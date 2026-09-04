import "server-only";

import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requireClient, requireStaff } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import {
  orderDirectoryFilterSchema,
  type OrderDirectoryFilter,
} from "@/lib/orders/schemas";
import { parseFitSnapshot } from "@/lib/orders/snapshot";

const orderListInclude = {
  client: { select: { id: true, displayName: true } },
  design: { select: { id: true, title: true } },
} as const;

export function parseOrderDirectoryFilter(value: string | undefined): OrderDirectoryFilter {
  const parsed = orderDirectoryFilterSchema.safeParse(value ?? "open");
  return parsed.success ? parsed.data : "open";
}

function orderWhere(query: string, filter: OrderDirectoryFilter): Prisma.OrderWhereInput {
  const statusFilter: Prisma.OrderWhereInput =
    filter === "open"
      ? { status: { notIn: ["delivered", "cancelled"] } }
      : filter === "all"
        ? {}
        : { status: filter };

  const term = query.trim();
  const search: Prisma.OrderWhereInput = term
    ? {
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { reference: { contains: term, mode: "insensitive" } },
          { client: { displayName: { contains: term, mode: "insensitive" } } },
        ],
      }
    : {};

  return { AND: [statusFilter, search] };
}

export async function listOrdersForStaff(options: { query?: string; filter?: string }) {
  await requireStaff();
  const filter = parseOrderDirectoryFilter(options.filter);

  return prisma.order.findMany({
    where: orderWhere(options.query ?? "", filter),
    orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
    include: orderListInclude,
  });
}

export async function listOrdersForClient(clientId: string) {
  await requireStaff();

  return prisma.order.findMany({
    where: { clientId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      design: { select: { id: true, title: true } },
    },
  });
}

export async function getOrderForStaff(id: string) {
  await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      client: {
        select: { id: true, displayName: true, status: true, email: true },
      },
      design: { select: { id: true, title: true, status: true } },
      createdBy: { select: { name: true } },
      events: {
        orderBy: { createdAt: "asc" },
        include: { actor: { select: { name: true } } },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return {
    ...order,
    fitSnapshot: parseFitSnapshot(order.fitSnapshot),
  };
}

export async function listClientsForOrderForm(includeId?: string) {
  await requireStaff();

  return prisma.client.findMany({
    where: includeId
      ? { OR: [{ status: { in: ["lead", "active"] } }, { id: includeId }] }
      : { status: { in: ["lead", "active"] } },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });
}

export async function getOrderFormPrefill(options: { clientId?: string; designId?: string }) {
  await requireStaff();

  const [client, design] = await Promise.all([
    options.clientId
      ? prisma.client.findUnique({
          where: { id: options.clientId },
          select: { id: true, displayName: true },
        })
      : Promise.resolve(null),
    options.designId
      ? prisma.design.findUnique({
          where: { id: options.designId },
          select: { id: true, title: true, clientId: true },
        })
      : Promise.resolve(null),
  ]);

  return { client, design };
}

export async function listDesignsForOrderForm(clientId?: string) {
  await requireStaff();

  return prisma.design.findMany({
    where: clientId
      ? {
          status: { not: "archived" },
          OR: [{ clientId }, { clientId: null }],
        }
      : { status: { not: "archived" } },
    orderBy: { title: "asc" },
    select: { id: true, title: true, clientId: true },
  });
}

export async function listMeasurementProfilesForOrderForm(clientId?: string) {
  await requireStaff();

  return prisma.measurementProfile.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: [{ isCurrent: "desc" }, { recordedAt: "desc" }],
    select: { id: true, clientId: true, label: true, isCurrent: true, recordedAt: true },
  });
}

export async function listOrdersForDesign(designId: string) {
  await requireStaff();

  return prisma.order.findMany({
    where: { designId },
    orderBy: [{ createdAt: "desc" }],
    include: {
      client: { select: { id: true, displayName: true } },
    },
  });
}

export async function listOwnOrdersForPortal() {
  const user = await requireClient();
  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!record) {
    return [];
  }

  return prisma.order.findMany({
    where: { clientId: record.id },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      design: { select: { id: true, title: true, sharedWithClient: true } },
    },
  });
}

export async function getOwnOrderForPortal(id: string) {
  const user = await requireClient();
  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!record) {
    notFound();
  }

  const order = await prisma.order.findFirst({
    where: { id, clientId: record.id },
    include: {
      design: { select: { id: true, title: true, sharedWithClient: true } },
      events: {
        where: { kind: "status_changed" },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          fromStatus: true,
          toStatus: true,
          createdAt: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  return order;
}
