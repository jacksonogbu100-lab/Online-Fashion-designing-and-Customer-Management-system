"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma, type DocumentKind } from "@prisma/client";
import { z } from "zod";

import { requireStaff } from "@/lib/auth/access";
import { isBillableOrderStatus } from "@/lib/billing/format";
import {
  createQuoteSchema,
  documentLineSchema,
  documentMetaSchema,
  emptyToNull,
  paymentSchema,
  voidDocumentSchema,
} from "@/lib/billing/schemas";
import { documentTotals } from "@/lib/billing/totals";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/measurements/format";
import { createNotification, portalUserIdForClient } from "@/lib/notifications/create";

export type BillingFormState = {
  error?: string;
  fieldErrors?: {
    orderId?: string;
    title?: string;
    notes?: string;
    taxRateBps?: string;
    kind?: string;
    description?: string;
    quantity?: string;
    unitAmountInr?: string;
    amountInr?: string;
    method?: string;
    receivedAt?: string;
    overpayNote?: string;
    voidReason?: string;
  };
};

function revalidateBillingPaths(options?: { documentId?: string; orderId?: string }) {
  revalidatePath("/app");
  revalidatePath("/portal");
  revalidatePath("/app/billing");
  revalidatePath("/portal/billing");
  if (options?.documentId) {
    revalidatePath(`/app/billing/${options.documentId}`);
    revalidatePath(`/app/billing/${options.documentId}/edit`);
    revalidatePath(`/app/billing/${options.documentId}/print`);
    revalidatePath(`/portal/billing/${options.documentId}`);
  }
  if (options?.orderId) {
    revalidatePath(`/app/orders/${options.orderId}`);
    revalidatePath(`/portal/orders/${options.orderId}`);
  }
}

function fieldErrorsFromZod(error: z.ZodError): BillingFormState["fieldErrors"] {
  const fieldErrors: BillingFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
      fieldErrors[key as keyof typeof fieldErrors] = issue.message;
    }
  }
  return fieldErrors;
}

function parseRupees(raw: string): { value: number } | { error: string } {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return { error: "Enter a whole rupee amount." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 10_000_000) {
    return { error: "Enter a sensible amount in rupees." };
  }
  return { value };
}

function parseQuantity(raw: string): { value: Prisma.Decimal } | { error: string } {
  const trimmed = raw.trim().replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { error: "Enter a number with up to two decimals." };
  }
  const value = new Prisma.Decimal(trimmed);
  if (value.lessThanOrEqualTo(0) || value.greaterThan(1_000_000)) {
    return { error: "Enter a quantity above zero." };
  }
  return { value };
}

async function nextDocumentReference(kind: DocumentKind) {
  const year = new Date().getFullYear();
  const prefix = kind === "quote" ? `SNX-Q-${year}-` : `SNX-INV-${year}-`;
  const latest = await prisma.document.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const last = latest ? Number(latest.reference.slice(prefix.length)) : 0;
  const next = Number.isFinite(last) ? last + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

const documentWithMoney = {
  lines: true,
  payments: true,
} as const;

async function loadDocument(id: string) {
  return prisma.document.findUnique({
    where: { id },
    include: documentWithMoney,
  });
}

export async function createQuoteAction(
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const user = await requireStaff();

  const parsed = createQuoteSchema.safeParse({
    orderId: formData.get("orderId") ?? "",
  });
  if (!parsed.success) {
    return { error: "Choose an order.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const order = await prisma.order.findUnique({
    where: { id: parsed.data.orderId },
    select: { id: true, title: true, status: true, priceEstimateInr: true },
  });
  if (!order) {
    return { error: "That order is missing.", fieldErrors: { orderId: "Choose an open order." } };
  }
  if (!isBillableOrderStatus(order.status)) {
    return {
      error: "Confirm the order before quoting.",
      fieldErrors: { orderId: "Confirm the order before quoting." },
    };
  }

  const reference = await nextDocumentReference("quote");
  const document = await prisma.document.create({
    data: {
      kind: "quote",
      status: "draft",
      reference,
      title: `Quote · ${order.title}`,
      taxRateBps: 0,
      taxInclusive: true,
      orderId: order.id,
      issuedById: user.id,
      lines: {
        create: {
          kind: "labour",
          description: order.title,
          quantity: 1,
          unitAmountInr: order.priceEstimateInr ?? 0,
          sortOrder: 0,
        },
      },
    },
    select: { id: true, orderId: true },
  });

  revalidateBillingPaths({ documentId: document.id, orderId: document.orderId });
  redirect(`/app/billing/${document.id}/edit`);
}

export async function updateDocumentMetaAction(
  documentId: string,
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  await requireStaff();

  const parsed = documentMetaSchema.safeParse({
    title: formData.get("title") ?? "",
    notes: formData.get("notes") ?? "",
    taxRateBps: formData.get("taxRateBps") ?? "0",
    taxInclusive: formData.get("taxInclusive") === "on",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const document = await loadDocument(documentId);
  if (!document) {
    return { error: "That document is missing." };
  }
  if (document.status !== "draft") {
    return { error: "Only drafts can be edited." };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      title: parsed.data.title,
      notes: emptyToNull(parsed.data.notes),
      taxRateBps: Number(parsed.data.taxRateBps),
      taxInclusive: parsed.data.taxInclusive,
    },
  });

  revalidateBillingPaths({ documentId, orderId: document.orderId });
  return {};
}

export async function addDocumentLineAction(
  documentId: string,
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  await requireStaff();

  const parsed = documentLineSchema.safeParse({
    kind: formData.get("kind") ?? "",
    description: formData.get("description") ?? "",
    quantity: formData.get("quantity") ?? "",
    unitAmountInr: formData.get("unitAmountInr") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const quantity = parseQuantity(parsed.data.quantity);
  if ("error" in quantity) {
    return { error: quantity.error, fieldErrors: { quantity: quantity.error } };
  }
  const unitAmount = parseRupees(parsed.data.unitAmountInr);
  if ("error" in unitAmount) {
    return { error: unitAmount.error, fieldErrors: { unitAmountInr: unitAmount.error } };
  }

  const document = await loadDocument(documentId);
  if (!document) {
    return { error: "That document is missing." };
  }
  if (document.status !== "draft") {
    return { error: "Only drafts can be edited." };
  }

  const nextOrder = document.lines.reduce((max, line) => Math.max(max, line.sortOrder), -1) + 1;

  await prisma.documentLine.create({
    data: {
      documentId,
      kind: parsed.data.kind,
      description: parsed.data.description,
      quantity: quantity.value,
      unitAmountInr: unitAmount.value,
      sortOrder: nextOrder,
    },
  });

  revalidateBillingPaths({ documentId, orderId: document.orderId });
  return {};
}

export async function removeDocumentLineAction(
  documentId: string,
  lineId: string,
  _prev: BillingFormState,
  _formData: FormData,
): Promise<BillingFormState> {
  await requireStaff();

  const document = await loadDocument(documentId);
  if (!document) {
    return { error: "That document is missing." };
  }
  if (document.status !== "draft") {
    return { error: "Only drafts can be edited." };
  }

  const line = document.lines.find((item) => item.id === lineId);
  if (!line) {
    return { error: "That line is missing." };
  }

  await prisma.documentLine.delete({ where: { id: lineId } });
  revalidateBillingPaths({ documentId, orderId: document.orderId });
  return {};
}

export async function sendDocumentAction(
  documentId: string,
  _prev: BillingFormState,
  _formData: FormData,
): Promise<BillingFormState> {
  await requireStaff();

  const document = await loadDocument(documentId);
  if (!document) {
    return { error: "That document is missing." };
  }
  if (document.status !== "draft") {
    return { error: "Only a draft can be sent." };
  }
  if (document.lines.length === 0) {
    return { error: "Add at least one line before sending." };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: { status: "sent", sentAt: new Date() },
  });

  if (document.kind === "invoice") {
    const order = await prisma.order.findUnique({
      where: { id: document.orderId },
      select: { clientId: true, title: true },
    });
    if (order) {
      await createNotification({
        userId: await portalUserIdForClient(order.clientId),
        kind: "invoice_sent",
        title: `Invoice ${document.reference} is ready`,
        body: order.title,
        href: `/portal/billing/${document.id}`,
      });
    }
  }

  revalidateBillingPaths({ documentId, orderId: document.orderId });
  return {};
}

export async function convertQuoteToInvoiceAction(
  documentId: string,
  _prev: BillingFormState,
  _formData: FormData,
): Promise<BillingFormState> {
  const user = await requireStaff();

  const quote = await prisma.document.findUnique({
    where: { id: documentId },
    include: { lines: { orderBy: { sortOrder: "asc" } }, invoice: { select: { id: true } } },
  });
  if (!quote) {
    return { error: "That quote is missing." };
  }
  if (quote.kind !== "quote") {
    return { error: "Only a quote can become an invoice." };
  }
  if (quote.status !== "sent") {
    return { error: "Send the quote before converting it." };
  }
  if (quote.invoice) {
    return { error: "This quote already has an invoice." };
  }

  const order = await prisma.order.findUnique({
    where: { id: quote.orderId },
    select: { title: true },
  });
  if (!order) {
    return { error: "That order is missing." };
  }

  const reference = await nextDocumentReference("invoice");
  const invoice = await prisma.document.create({
    data: {
      kind: "invoice",
      status: "draft",
      reference,
      title: `Invoice · ${order.title}`,
      notes: quote.notes,
      taxRateBps: quote.taxRateBps,
      taxInclusive: quote.taxInclusive,
      orderId: quote.orderId,
      issuedById: user.id,
      sourceQuoteId: quote.id,
      lines: {
        create: quote.lines.map((line) => ({
          kind: line.kind,
          description: line.description,
          quantity: line.quantity,
          unitAmountInr: line.unitAmountInr,
          sortOrder: line.sortOrder,
        })),
      },
    },
    select: { id: true, orderId: true },
  });

  revalidateBillingPaths({ documentId: invoice.id, orderId: invoice.orderId });
  revalidateBillingPaths({ documentId: quote.id });
  redirect(`/app/billing/${invoice.id}/edit`);
}

export async function recordPaymentAction(
  documentId: string,
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  const user = await requireStaff();

  const parsed = paymentSchema.safeParse({
    amountInr: formData.get("amountInr") ?? "",
    method: formData.get("method") ?? "",
    receivedAt: formData.get("receivedAt") ?? "",
    notes: formData.get("notes") ?? "",
    overpayNote: formData.get("overpayNote") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const amount = parseRupees(parsed.data.amountInr);
  if ("error" in amount) {
    return { error: amount.error, fieldErrors: { amountInr: amount.error } };
  }
  if (amount.value === 0) {
    return { error: "Enter an amount above zero.", fieldErrors: { amountInr: "Enter an amount above zero." } };
  }

  const receivedAt = parseDateInput(parsed.data.receivedAt);
  if (!receivedAt) {
    return { error: "Choose a valid date.", fieldErrors: { receivedAt: "Choose a valid date." } };
  }

  const document = await loadDocument(documentId);
  if (!document) {
    return { error: "That document is missing." };
  }
  if (document.kind !== "invoice") {
    return { error: "Payments are recorded on invoices." };
  }
  if (document.status === "draft") {
    return { error: "Send the invoice before recording a payment." };
  }
  if (document.status === "void") {
    return { error: "Void invoices cannot take payments." };
  }

  const totals = documentTotals({
    lines: document.lines,
    taxRateBps: document.taxRateBps,
    taxInclusive: document.taxInclusive,
    payments: document.payments,
  });
  const nextPaid = totals.paid + amount.value;
  const overpayNote = emptyToNull(parsed.data.overpayNote);

  if (nextPaid > totals.total && !overpayNote) {
    return {
      error: "Paid amounts cannot exceed the invoice without an overpay note.",
      fieldErrors: { overpayNote: "Add a note if this payment goes over the total." },
    };
  }

  const becomesPaid = nextPaid >= totals.total;

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        documentId,
        amountInr: amount.value,
        method: parsed.data.method,
        receivedAt,
        notes: emptyToNull(parsed.data.notes),
        recordedById: user.id,
      },
    });

    await tx.document.update({
      where: { id: documentId },
      data: {
        overpayNote: nextPaid > totals.total ? overpayNote ?? document.overpayNote : document.overpayNote,
        status: becomesPaid ? "paid" : document.status,
        paidAt: becomesPaid ? (document.paidAt ?? new Date()) : document.paidAt,
      },
    });
  });

  revalidateBillingPaths({ documentId, orderId: document.orderId });
  return {};
}

export async function voidDocumentAction(
  documentId: string,
  _prev: BillingFormState,
  formData: FormData,
): Promise<BillingFormState> {
  await requireStaff();

  const parsed = voidDocumentSchema.safeParse({
    voidReason: formData.get("voidReason") ?? "",
  });
  if (!parsed.success) {
    return { error: "Say why this document is void.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const document = await loadDocument(documentId);
  if (!document) {
    return { error: "That document is missing." };
  }
  if (document.status === "void") {
    return { error: "This document is already void." };
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      status: "void",
      voidReason: parsed.data.voidReason,
      voidedAt: new Date(),
    },
  });

  revalidateBillingPaths({ documentId, orderId: document.orderId });
  return {};
}
