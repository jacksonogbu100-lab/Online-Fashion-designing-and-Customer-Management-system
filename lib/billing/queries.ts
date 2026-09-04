import "server-only";

import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requireClient, requireStaff } from "@/lib/auth/access";
import { billableOrderStatuses } from "@/lib/billing/format";
import { documentTotals } from "@/lib/billing/totals";
import { prisma } from "@/lib/db";

const documentInclude = {
  order: {
    select: {
      id: true,
      reference: true,
      title: true,
      status: true,
      priceEstimateInr: true,
      client: {
        select: {
          id: true,
          displayName: true,
          email: true,
          phone: true,
          city: true,
          country: true,
          portalUserId: true,
        },
      },
      design: { select: { id: true, title: true } },
    },
  },
  issuedBy: { select: { id: true, name: true } },
  lines: { orderBy: { sortOrder: "asc" as const } },
  payments: {
    orderBy: [{ receivedAt: "asc" as const }, { createdAt: "asc" as const }],
    include: { recordedBy: { select: { name: true } } },
  },
  invoice: { select: { id: true, reference: true, status: true } },
  sourceQuote: { select: { id: true, reference: true } },
} satisfies Prisma.DocumentInclude;

export type StaffDocument = Prisma.DocumentGetPayload<{ include: typeof documentInclude }>;

export function totalsForDocument(document: {
  lines: { quantity: { toString(): string }; unitAmountInr: number }[];
  taxRateBps: number;
  taxInclusive: boolean;
  payments: { amountInr: number }[];
}) {
  return documentTotals({
    lines: document.lines,
    taxRateBps: document.taxRateBps,
    taxInclusive: document.taxInclusive,
    payments: document.payments,
  });
}

export async function listDocumentsForStaff() {
  await requireStaff();

  const documents = await prisma.document.findMany({
    orderBy: { createdAt: "desc" },
    include: documentInclude,
  });

  return documents.map((document) => ({
    ...document,
    totals: totalsForDocument(document),
  }));
}

export async function getDocumentForStaff(id: string) {
  await requireStaff();

  const document = await prisma.document.findUnique({
    where: { id },
    include: documentInclude,
  });

  if (!document) {
    notFound();
  }

  return {
    ...document,
    totals: totalsForDocument(document),
  };
}

export async function listDocumentsForOrder(orderId: string) {
  await requireStaff();

  const documents = await prisma.document.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    include: documentInclude,
  });

  return documents.map((document) => ({
    ...document,
    totals: totalsForDocument(document),
  }));
}

export async function listBillableOrdersForSelect() {
  await requireStaff();

  return prisma.order.findMany({
    where: { status: { in: billableOrderStatuses } },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      reference: true,
      title: true,
      status: true,
      client: { select: { displayName: true } },
    },
  });
}

export async function getOrderForQuote(orderId: string) {
  await requireStaff();

  return prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      reference: true,
      title: true,
      status: true,
      client: { select: { displayName: true } },
    },
  });
}

async function portalClientId(userId: string) {
  const record = await prisma.client.findUnique({
    where: { portalUserId: userId },
    select: { id: true },
  });
  return record?.id ?? null;
}

const portalInvoiceWhere = {
  kind: "invoice" as const,
  status: { not: "draft" as const },
  sentAt: { not: null },
};

export async function listOwnInvoicesForPortal() {
  const user = await requireClient();
  const clientId = await portalClientId(user.id);
  if (!clientId) {
    return [];
  }

  const documents = await prisma.document.findMany({
    where: {
      ...portalInvoiceWhere,
      order: { clientId },
    },
    orderBy: { createdAt: "desc" },
    include: documentInclude,
  });

  return documents.map((document) => ({
    ...document,
    totals: totalsForDocument(document),
  }));
}

export async function getOwnInvoiceForPortal(id: string) {
  const user = await requireClient();
  const clientId = await portalClientId(user.id);
  if (!clientId) {
    notFound();
  }

  const document = await prisma.document.findFirst({
    where: {
      id,
      ...portalInvoiceWhere,
      order: { clientId },
    },
    include: documentInclude,
  });

  if (!document) {
    notFound();
  }

  return {
    ...document,
    totals: totalsForDocument(document),
  };
}

export async function listOwnInvoicesForOrderPortal(orderId: string) {
  const user = await requireClient();
  const clientId = await portalClientId(user.id);
  if (!clientId) {
    return [];
  }

  const documents = await prisma.document.findMany({
    where: {
      orderId,
      ...portalInvoiceWhere,
      order: { clientId },
    },
    orderBy: { createdAt: "desc" },
    include: documentInclude,
  });

  return documents.map((document) => ({
    ...document,
    totals: totalsForDocument(document),
  }));
}
