import "server-only";

import { requireClient, requireStaff } from "@/lib/auth/access";
import { isCreativeRole } from "@/lib/auth/roles";
import { studioDayRange } from "@/lib/appointments/datetime";
import { documentTotals } from "@/lib/billing/totals";
import { prisma } from "@/lib/db";
import { isLowStock } from "@/lib/materials/format";

const dueWindowMs = 21 * 86_400_000;

export async function getStaffDashboard() {
  const user = await requireStaff();
  const { start, end } = studioDayRange();
  const dueUntil = new Date(start.getTime() + dueWindowMs);

  const [dueOrders, todaySittings, unpaidDocuments, materials] = await Promise.all([
    prisma.order.findMany({
      where: {
        status: { notIn: ["delivered", "cancelled"] },
        dueAt: { not: null, lte: dueUntil },
      },
      orderBy: [{ dueAt: "asc" }],
      take: 8,
      select: {
        id: true,
        reference: true,
        title: true,
        status: true,
        dueAt: true,
        client: { select: { displayName: true } },
      },
    }),
    prisma.appointment.findMany({
      where: {
        status: "scheduled",
        startsAt: { gte: start, lt: end },
      },
      orderBy: { startsAt: "asc" },
      include: {
        client: { select: { displayName: true } },
        staff: { select: { name: true } },
        order: { select: { id: true, reference: true } },
      },
    }),
    prisma.document.findMany({
      where: { kind: "invoice", status: "sent" },
      orderBy: { createdAt: "desc" },
      include: {
        lines: true,
        payments: true,
        order: {
          select: {
            id: true,
            reference: true,
            title: true,
            client: { select: { displayName: true } },
          },
        },
      },
    }),
    isCreativeRole(user.role)
      ? prisma.material.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            color: true,
            quantity: true,
            unit: true,
            lowStockAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const unpaidInvoices = unpaidDocuments
    .map((document) => ({
      ...document,
      totals: documentTotals({
        lines: document.lines,
        taxRateBps: document.taxRateBps,
        taxInclusive: document.taxInclusive,
        payments: document.payments,
      }),
    }))
    .filter((document) => document.totals.remaining > 0)
    .slice(0, 8);

  const lowStock = materials.filter((material) =>
    isLowStock(material.quantity, material.lowStockAt),
  );

  return {
    role: user.role,
    showLowStock: isCreativeRole(user.role),
    dueOrders,
    todaySittings,
    unpaidInvoices,
    lowStock,
  };
}

export async function getPortalDashboard() {
  const user = await requireClient();
  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!record) {
    return {
      hasFile: false as const,
      nextSitting: null,
      sharedDesigns: [],
      orders: [],
    };
  }

  const now = new Date();
  const [nextSitting, sharedDesigns, orders] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        clientId: record.id,
        status: "scheduled",
        startsAt: { gte: now },
      },
      orderBy: { startsAt: "asc" },
      include: {
        staff: { select: { name: true } },
        order: { select: { id: true, title: true } },
      },
    }),
    prisma.design.findMany({
      where: {
        clientId: record.id,
        sharedWithClient: true,
        status: { not: "archived" },
      },
      orderBy: { updatedAt: "desc" },
      take: 4,
      include: {
        collection: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true } },
      },
    }),
    prisma.order.findMany({
      where: { clientId: record.id, status: { not: "cancelled" } },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      include: {
        design: { select: { title: true, sharedWithClient: true } },
      },
    }),
  ]);

  return {
    hasFile: true as const,
    nextSitting,
    sharedDesigns,
    orders,
  };
}
