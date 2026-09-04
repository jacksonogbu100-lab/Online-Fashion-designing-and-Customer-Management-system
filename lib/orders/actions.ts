"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { requireStaff } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/measurements/format";
import {
  emptyToNull,
  orderNoteSchema,
  orderStatusSchema,
  orderWriteSchema,
  type OrderStatus,
} from "@/lib/orders/schemas";
import { snapshotFromProfile } from "@/lib/orders/snapshot";
import { createNotification, portalUserIdForClient } from "@/lib/notifications/create";
import { orderStatusClientLabel } from "@/lib/orders/format";

export type OrderFormState = {
  error?: string;
  fieldErrors?: {
    title?: string;
    clientId?: string;
    designId?: string;
    measurementProfileId?: string;
    dueAt?: string;
    priceEstimateInr?: string;
    notes?: string;
  };
};

export type OrderNoteState = {
  error?: string;
};

export type OrderStatusState = {
  error?: string;
};

function revalidateOrderPaths(orderId?: string, clientId?: string, designId?: string | null) {
  revalidatePath("/app");
  revalidatePath("/portal");
  revalidatePath("/app/orders");
  revalidatePath("/portal/orders");
  if (orderId) {
    revalidatePath(`/app/orders/${orderId}`);
    revalidatePath(`/portal/orders/${orderId}`);
  }
  if (clientId) {
    revalidatePath(`/app/clients/${clientId}`);
    revalidatePath(`/app/clients/${clientId}/orders`);
  }
  if (designId) {
    revalidatePath(`/app/designs/${designId}`);
  }
}

async function notifyOrderStatus(orderId: string, clientId: string, status: OrderStatus) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { reference: true, title: true },
  });
  if (!order) {
    return;
  }
  await createNotification({
    userId: await portalUserIdForClient(clientId),
    kind: "order_status",
    title: `Your order is now ${orderStatusClientLabel(status)}`,
    body: `${order.reference} · ${order.title}`,
    href: `/portal/orders/${orderId}`,
  });
}

function fieldErrorsFromZod(error: z.ZodError): OrderFormState["fieldErrors"] {
  const fieldErrors: OrderFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
      fieldErrors[key as keyof typeof fieldErrors] = issue.message;
    }
  }
  return fieldErrors;
}

function parsePrice(raw: string): { value: number | null; error?: string } {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { value: null };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { value: null, error: "Enter a whole rupee amount." };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0 || value > 10_000_000) {
    return { value: null, error: "Enter a sensible estimate in rupees." };
  }
  return { value };
}

async function nextOrderReference() {
  const year = new Date().getFullYear();
  const prefix = `SNX-${year}-`;
  const latest = await prisma.order.findFirst({
    where: { reference: { startsWith: prefix } },
    orderBy: { reference: "desc" },
    select: { reference: true },
  });
  const last = latest ? Number(latest.reference.slice(prefix.length)) : 0;
  const next = Number.isFinite(last) ? last + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

async function resolveDesign(clientId: string, rawId: string) {
  const designId = emptyToNull(rawId);
  if (!designId) {
    return { designId: null as string | null };
  }

  const design = await prisma.design.findUnique({
    where: { id: designId },
    select: { id: true, clientId: true, status: true, title: true },
  });
  if (!design || design.status === "archived") {
    return { designId: null, error: "Choose an open design, or none." };
  }
  if (design.clientId && design.clientId !== clientId) {
    return { designId: null, error: "That design belongs to another client." };
  }
  return { designId: design.id, title: design.title };
}

async function resolveFitSnapshot(clientId: string, rawProfileId: string, snapshotFit: boolean) {
  const requestedId = emptyToNull(rawProfileId);
  if (!snapshotFit && !requestedId) {
    return { measurementProfileId: null as string | null, fitSnapshot: null };
  }

  const profile = requestedId
    ? await prisma.measurementProfile.findFirst({
        where: { id: requestedId, clientId },
      })
    : await prisma.measurementProfile.findFirst({
        where: { clientId, isCurrent: true },
      });

  if (requestedId && !profile) {
    return {
      measurementProfileId: null,
      fitSnapshot: null,
      error: "Choose a tape chart that belongs to this client.",
    };
  }
  if (!profile) {
    return { measurementProfileId: null, fitSnapshot: null };
  }

  return {
    measurementProfileId: profile.id,
    fitSnapshot: snapshotFromProfile(profile),
  };
}

export async function createOrderAction(
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const user = await requireStaff();

  const parsed = orderWriteSchema.safeParse({
    title: formData.get("title") ?? "",
    clientId: formData.get("clientId") ?? "",
    designId: formData.get("designId") ?? "",
    measurementProfileId: formData.get("measurementProfileId") ?? "",
    snapshotFit: formData.get("snapshotFit") === "on",
    dueAt: formData.get("dueAt") ?? "",
    priceEstimateInr: formData.get("priceEstimateInr") ?? "",
    priority: formData.get("priority") ?? "normal",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const client = await prisma.client.findUnique({
    where: { id: parsed.data.clientId },
    select: { id: true },
  });
  if (!client) {
    return { error: "Choose a client in the house book.", fieldErrors: { clientId: "Choose a client." } };
  }

  const design = await resolveDesign(client.id, parsed.data.designId);
  if (design.error) {
    return { error: design.error, fieldErrors: { designId: design.error } };
  }

  const fit = await resolveFitSnapshot(
    client.id,
    parsed.data.measurementProfileId,
    parsed.data.snapshotFit,
  );
  if (fit.error) {
    return { error: fit.error, fieldErrors: { measurementProfileId: fit.error } };
  }

  const dueAt = parsed.data.dueAt ? parseDateInput(parsed.data.dueAt) : null;
  if (parsed.data.dueAt && !dueAt) {
    return { error: "Check the highlighted fields.", fieldErrors: { dueAt: "Choose a date." } };
  }

  const price = parsePrice(parsed.data.priceEstimateInr);
  if (price.error) {
    return { error: price.error, fieldErrors: { priceEstimateInr: price.error } };
  }

  const title = parsed.data.title || design.title || "Custom order";
  const reference = await nextOrderReference();

  const order = await prisma.order.create({
    data: {
      reference,
      title,
      notes: emptyToNull(parsed.data.notes),
      clientId: client.id,
      designId: design.designId,
      measurementProfileId: fit.measurementProfileId,
      fitSnapshot: (fit.fitSnapshot ?? undefined) as Prisma.InputJsonValue | undefined,
      dueAt,
      priceEstimateInr: price.value,
      priority: parsed.data.priority,
      status: "inquiry",
      createdById: user.id,
      events: {
        create: {
          actorId: user.id,
          kind: "created",
          toStatus: "inquiry",
          body: "Order opened.",
        },
      },
    },
    select: { id: true },
  });

  revalidateOrderPaths(order.id, client.id, design.designId);
  redirect(`/app/orders/${order.id}`);
}

export async function updateOrderAction(
  orderId: string,
  _prev: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  await requireStaff();

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, clientId: true, status: true },
  });
  if (!existing) {
    return { error: "This order is no longer in the book." };
  }
  if (existing.status === "cancelled") {
    return { error: "Reopen this order before editing it." };
  }

  const parsed = orderWriteSchema.safeParse({
    title: formData.get("title") ?? "",
    clientId: existing.clientId,
    designId: formData.get("designId") ?? "",
    measurementProfileId: formData.get("measurementProfileId") ?? "",
    snapshotFit: formData.get("snapshotFit") === "on",
    dueAt: formData.get("dueAt") ?? "",
    priceEstimateInr: formData.get("priceEstimateInr") ?? "",
    priority: formData.get("priority") ?? "normal",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const design = await resolveDesign(existing.clientId, parsed.data.designId);
  if (design.error) {
    return { error: design.error, fieldErrors: { designId: design.error } };
  }

  const dueAt = parsed.data.dueAt ? parseDateInput(parsed.data.dueAt) : null;
  if (parsed.data.dueAt && !dueAt) {
    return { error: "Check the highlighted fields.", fieldErrors: { dueAt: "Choose a date." } };
  }

  const price = parsePrice(parsed.data.priceEstimateInr);
  if (price.error) {
    return { error: price.error, fieldErrors: { priceEstimateInr: price.error } };
  }

  const shouldResnapshot = parsed.data.snapshotFit;
  const fit = shouldResnapshot
    ? await resolveFitSnapshot(existing.clientId, parsed.data.measurementProfileId, true)
    : null;
  if (fit?.error) {
    return { error: fit.error, fieldErrors: { measurementProfileId: fit.error } };
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      title: parsed.data.title,
      notes: emptyToNull(parsed.data.notes),
      designId: design.designId,
      dueAt,
      priceEstimateInr: price.value,
      priority: parsed.data.priority,
      ...(fit
        ? {
            measurementProfileId: fit.measurementProfileId,
            fitSnapshot: (fit.fitSnapshot ?? undefined) as Prisma.InputJsonValue | undefined,
          }
        : {}),
    },
  });

  revalidateOrderPaths(orderId, existing.clientId, design.designId);
  redirect(`/app/orders/${orderId}`);
}

export async function changeOrderStatusAction(
  orderId: string,
  _prev: OrderStatusState,
  formData: FormData,
): Promise<OrderStatusState> {
  const user = await requireStaff();

  const parsed = orderStatusSchema.safeParse(formData.get("status") ?? "");
  if (!parsed.success) {
    return { error: "Choose a status." };
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, clientId: true, designId: true },
  });
  if (!existing) {
    return { error: "This order is no longer in the book." };
  }
  if (existing.status === parsed.data) {
    return {};
  }
  if (parsed.data === "cancelled") {
    return { error: "Use Cancel order. Cancelling keeps the history." };
  }
  if (existing.status === "cancelled" && parsed.data !== "inquiry") {
    return { error: "Reopen a cancelled order to Inquiry first." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: parsed.data },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        actorId: user.id,
        kind: "status_changed",
        fromStatus: existing.status,
        toStatus: parsed.data,
      },
    }),
  ]);

  await notifyOrderStatus(orderId, existing.clientId, parsed.data);
  revalidateOrderPaths(orderId, existing.clientId, existing.designId);
  return {};
}

export async function cancelOrderAction(
  orderId: string,
  _prev: OrderStatusState,
  _formData: FormData,
): Promise<OrderStatusState> {
  const user = await requireStaff();

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, clientId: true, designId: true },
  });
  if (!existing) {
    return { error: "This order is no longer in the book." };
  }
  if (existing.status === "cancelled") {
    return {};
  }
  if (existing.status === "delivered") {
    return { error: "A delivered order cannot be cancelled." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "cancelled" },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        actorId: user.id,
        kind: "status_changed",
        fromStatus: existing.status,
        toStatus: "cancelled",
        body: "Order cancelled. History kept.",
      },
    }),
  ]);

  await notifyOrderStatus(orderId, existing.clientId, "cancelled");
  revalidateOrderPaths(orderId, existing.clientId, existing.designId);
  return {};
}

export async function reopenOrderAction(
  orderId: string,
  _prev: OrderStatusState,
  _formData: FormData,
): Promise<OrderStatusState> {
  const user = await requireStaff();

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, status: true, clientId: true, designId: true },
  });
  if (!existing) {
    return { error: "This order is no longer in the book." };
  }
  if (existing.status !== "cancelled") {
    return { error: "Only a cancelled order can be reopened." };
  }

  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: { status: "inquiry" },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        actorId: user.id,
        kind: "status_changed",
        fromStatus: "cancelled",
        toStatus: "inquiry",
        body: "Order reopened.",
      },
    }),
  ]);

  await notifyOrderStatus(orderId, existing.clientId, "inquiry");
  revalidateOrderPaths(orderId, existing.clientId, existing.designId);
  return {};
}

export async function addOrderNoteAction(
  orderId: string,
  _prev: OrderNoteState,
  formData: FormData,
): Promise<OrderNoteState> {
  const user = await requireStaff();

  const parsed = orderNoteSchema.safeParse({
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Write a note." };
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, clientId: true, designId: true },
  });
  if (!existing) {
    return { error: "This order is no longer in the book." };
  }

  await prisma.orderEvent.create({
    data: {
      orderId,
      actorId: user.id,
      kind: "note",
      body: parsed.data.body,
    },
  });

  revalidateOrderPaths(orderId, existing.clientId, existing.designId);
  return {};
}
