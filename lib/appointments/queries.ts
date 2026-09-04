import "server-only";

import { notFound } from "next/navigation";

import { requireClient, requireStaff } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import { addStudioDays } from "@/lib/appointments/datetime";

const appointmentInclude = {
  client: { select: { id: true, displayName: true, portalUserId: true } },
  order: { select: { id: true, reference: true, title: true } },
  staff: { select: { id: true, name: true } },
} as const;

export async function listAppointmentsForWeek(weekStart: Date) {
  await requireStaff();
  const weekEnd = addStudioDays(weekStart, 7);

  return prisma.appointment.findMany({
    where: {
      startsAt: { gte: weekStart, lt: weekEnd },
    },
    orderBy: [{ startsAt: "asc" }],
    include: appointmentInclude,
  });
}

export async function getAppointmentForStaff(id: string) {
  await requireStaff();

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      ...appointmentInclude,
      createdBy: { select: { name: true } },
    },
  });

  if (!appointment) {
    notFound();
  }

  return appointment;
}

export async function listAppointmentsForClient(clientId: string) {
  await requireStaff();

  return prisma.appointment.findMany({
    where: { clientId },
    orderBy: [{ startsAt: "desc" }],
    include: {
      order: { select: { id: true, reference: true, title: true } },
      staff: { select: { id: true, name: true } },
    },
  });
}

export async function listAppointmentsForOrder(orderId: string) {
  await requireStaff();

  return prisma.appointment.findMany({
    where: { orderId },
    orderBy: [{ startsAt: "desc" }],
    include: {
      staff: { select: { id: true, name: true } },
    },
  });
}

export async function listStaffForAppointments() {
  await requireStaff();

  return prisma.user.findMany({
    where: { role: { in: ["admin", "designer", "staff"] }, status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, role: true },
  });
}

export async function listClientsForAppointments(includeId?: string) {
  await requireStaff();

  return prisma.client.findMany({
    where: includeId
      ? { OR: [{ status: { in: ["lead", "active"] } }, { id: includeId }] }
      : { status: { in: ["lead", "active"] } },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });
}

export async function listOrdersForAppointmentForm(clientId?: string) {
  await requireStaff();

  return prisma.order.findMany({
    where: {
      status: { notIn: ["delivered", "cancelled"] },
      ...(clientId ? { clientId } : {}),
    },
    orderBy: [{ createdAt: "desc" }],
    select: { id: true, reference: true, title: true, clientId: true },
  });
}

export async function getAppointmentFormPrefill(options: {
  clientId?: string;
  orderId?: string;
}) {
  await requireStaff();

  const [client, order] = await Promise.all([
    options.clientId
      ? prisma.client.findUnique({
          where: { id: options.clientId },
          select: { id: true, displayName: true },
        })
      : Promise.resolve(null),
    options.orderId
      ? prisma.order.findUnique({
          where: { id: options.orderId },
          select: { id: true, title: true, reference: true, clientId: true },
        })
      : Promise.resolve(null),
  ]);

  return { client, order };
}

export async function findOverlappingAppointment(options: {
  staffId: string;
  startsAt: Date;
  endsAt: Date;
  excludeId?: string;
}) {
  return prisma.appointment.findFirst({
    where: {
      staffId: options.staffId,
      status: "scheduled",
      startsAt: { lt: options.endsAt },
      endsAt: { gt: options.startsAt },
      ...(options.excludeId ? { id: { not: options.excludeId } } : {}),
    },
    include: {
      client: { select: { displayName: true } },
    },
  });
}

export async function getOwnAppointmentForPortal(id: string) {
  const user = await requireClient();
  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!record) {
    notFound();
  }

  const appointment = await prisma.appointment.findFirst({
    where: { id, clientId: record.id },
    include: {
      order: { select: { id: true, title: true } },
      staff: { select: { name: true } },
    },
  });

  if (!appointment) {
    notFound();
  }

  return appointment;
}

export async function listOwnAppointmentsForPortal() {
  const user = await requireClient();
  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!record) {
    return [];
  }

  return prisma.appointment.findMany({
    where: { clientId: record.id },
    orderBy: [{ startsAt: "asc" }],
    include: {
      order: { select: { id: true, title: true } },
      staff: { select: { name: true } },
    },
  });
}
