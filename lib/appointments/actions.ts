"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/lib/auth/access";
import { isStaffRole } from "@/lib/auth/roles";
import { formatStudioRange, parseStudioDateTime, weekParam } from "@/lib/appointments/datetime";
import { appointmentTypeLabel } from "@/lib/appointments/format";
import { findOverlappingAppointment } from "@/lib/appointments/queries";
import {
  appointmentWriteSchema,
  emptyToNull,
  type AppointmentStatus,
} from "@/lib/appointments/schemas";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications/create";

export type AppointmentFormState = {
  error?: string;
  fieldErrors?: {
    type?: string;
    clientId?: string;
    orderId?: string;
    staffId?: string;
    startsAt?: string;
    endsAt?: string;
    location?: string;
    notes?: string;
  };
};

export type AppointmentStatusState = {
  error?: string;
};

function revalidateAppointmentPaths(options: {
  appointmentId?: string;
  clientId?: string;
  orderId?: string | null;
}) {
  revalidatePath("/app");
  revalidatePath("/portal");
  revalidatePath("/app/calendar");
  revalidatePath("/portal/appointments");
  if (options.appointmentId) {
    revalidatePath(`/app/calendar/${options.appointmentId}`);
    revalidatePath(`/portal/appointments/${options.appointmentId}`);
  }
  if (options.clientId) {
    revalidatePath(`/app/clients/${options.clientId}`);
    revalidatePath(`/app/clients/${options.clientId}/appointments`);
  }
  if (options.orderId) {
    revalidatePath(`/app/orders/${options.orderId}`);
  }
}

function fieldErrorsFromZod(error: z.ZodError): AppointmentFormState["fieldErrors"] {
  const fieldErrors: AppointmentFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
      fieldErrors[key as keyof typeof fieldErrors] = issue.message;
    }
  }
  return fieldErrors;
}

async function resolveBooking(input: {
  clientId: string;
  orderId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
}) {
  const startsAt = parseStudioDateTime(input.startsAt);
  const endsAt = parseStudioDateTime(input.endsAt);
  if (!startsAt) {
    return { ok: false as const, error: "Choose a start time.", fieldErrors: { startsAt: "Choose a start time." } };
  }
  if (!endsAt) {
    return { ok: false as const, error: "Choose an end time.", fieldErrors: { endsAt: "Choose an end time." } };
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    return {
      ok: false as const,
      error: "End time must be after the start.",
      fieldErrors: { endsAt: "End time must be after the start." },
    };
  }
  if (endsAt.getTime() - startsAt.getTime() > 4 * 60 * 60 * 1000) {
    return {
      ok: false as const,
      error: "Keep a sitting under four hours.",
      fieldErrors: { endsAt: "Keep a sitting under four hours." },
    };
  }

  const staff = await prisma.user.findUnique({
    where: { id: input.staffId },
    select: { id: true, name: true, role: true, status: true },
  });
  if (!staff || staff.status !== "active" || !isStaffRole(staff.role)) {
    return {
      ok: false as const,
      error: "Choose who is with the client.",
      fieldErrors: { staffId: "Choose a house person." },
    };
  }

  const client = await prisma.client.findUnique({
    where: { id: input.clientId },
    select: { id: true, displayName: true },
  });
  if (!client) {
    return {
      ok: false as const,
      error: "Choose a client in the house book.",
      fieldErrors: { clientId: "Choose a client." },
    };
  }

  const orderId = emptyToNull(input.orderId);
  if (orderId) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, clientId: true },
    });
    if (!order) {
      return { ok: false as const, error: "Choose an order, or none.", fieldErrors: { orderId: "Choose an order." } };
    }
    if (order.clientId !== client.id) {
      return {
        ok: false as const,
        error: "That order belongs to another client.",
        fieldErrors: { orderId: "That order belongs to another client." },
      };
    }
  }

  return { ok: true as const, startsAt, endsAt, staff, client, orderId };
}

export async function createAppointmentAction(
  _prev: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  const user = await requireStaff();

  const parsed = appointmentWriteSchema.safeParse({
    type: formData.get("type") ?? "",
    clientId: formData.get("clientId") ?? "",
    orderId: formData.get("orderId") ?? "",
    staffId: formData.get("staffId") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
    location: formData.get("location") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const booking = await resolveBooking(parsed.data);
  if (!booking.ok) {
    return { error: booking.error, fieldErrors: booking.fieldErrors };
  }

  const overlap = await findOverlappingAppointment({
    staffId: booking.staff.id,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
  });
  if (overlap) {
    return {
      error: `${booking.staff.name} already has ${appointmentTypeLabel(overlap.type).toLowerCase()} with ${overlap.client.displayName} in that slot.`,
      fieldErrors: { startsAt: "That slot is taken." },
    };
  }

  const appointment = await prisma.appointment.create({
    data: {
      type: parsed.data.type,
      status: "scheduled",
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      location: parsed.data.location,
      notes: emptyToNull(parsed.data.notes),
      clientId: booking.client.id,
      orderId: booking.orderId,
      staffId: booking.staff.id,
      createdById: user.id,
    },
    select: { id: true, startsAt: true, endsAt: true, location: true },
  });

  await createNotification({
    userId: booking.staff.id,
    kind: "appointment_reminder",
    title: `${appointmentTypeLabel(parsed.data.type)} with ${booking.client.displayName}`,
    body: `${formatStudioRange(appointment.startsAt, appointment.endsAt)} · ${appointment.location}`,
    href: `/app/calendar/${appointment.id}`,
  });

  revalidateAppointmentPaths({
    appointmentId: appointment.id,
    clientId: booking.client.id,
    orderId: booking.orderId,
  });
  redirect(`/app/calendar/${appointment.id}?week=${weekParam(appointment.startsAt)}`);
}

export async function updateAppointmentAction(
  appointmentId: string,
  _prev: AppointmentFormState,
  formData: FormData,
): Promise<AppointmentFormState> {
  await requireStaff();

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, status: true, clientId: true },
  });
  if (!existing) {
    return { error: "This appointment is no longer in the book." };
  }
  if (existing.status !== "scheduled") {
    return { error: "Only a scheduled sitting can be moved." };
  }

  const parsed = appointmentWriteSchema.safeParse({
    type: formData.get("type") ?? "",
    clientId: existing.clientId,
    orderId: formData.get("orderId") ?? "",
    staffId: formData.get("staffId") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    endsAt: formData.get("endsAt") ?? "",
    location: formData.get("location") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const booking = await resolveBooking({
    ...parsed.data,
    clientId: existing.clientId,
  });
  if (!booking.ok) {
    return { error: booking.error, fieldErrors: booking.fieldErrors };
  }

  const overlap = await findOverlappingAppointment({
    staffId: booking.staff.id,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    excludeId: appointmentId,
  });
  if (overlap) {
    return {
      error: `${booking.staff.name} already has ${appointmentTypeLabel(overlap.type).toLowerCase()} with ${overlap.client.displayName} in that slot.`,
      fieldErrors: { startsAt: "That slot is taken." },
    };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      type: parsed.data.type,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      location: parsed.data.location,
      notes: emptyToNull(parsed.data.notes),
      orderId: booking.orderId,
      staffId: booking.staff.id,
    },
  });

  revalidateAppointmentPaths({
    appointmentId,
    clientId: existing.clientId,
    orderId: booking.orderId,
  });
  redirect(`/app/calendar/${appointmentId}`);
}

async function setAppointmentStatus(
  appointmentId: string,
  status: Exclude<AppointmentStatus, "scheduled">,
): Promise<AppointmentStatusState> {
  await requireStaff();

  const existing = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, status: true, clientId: true, orderId: true, startsAt: true },
  });
  if (!existing) {
    return { error: "This appointment is no longer in the book." };
  }
  if (existing.status !== "scheduled") {
    return { error: "That sitting is already closed." };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status },
  });

  revalidateAppointmentPaths({
    appointmentId,
    clientId: existing.clientId,
    orderId: existing.orderId,
  });
  return {};
}

export async function completeAppointmentAction(
  appointmentId: string,
  _prev: AppointmentStatusState,
  _formData: FormData,
): Promise<AppointmentStatusState> {
  return setAppointmentStatus(appointmentId, "completed");
}

export async function markAppointmentNoShowAction(
  appointmentId: string,
  _prev: AppointmentStatusState,
  _formData: FormData,
): Promise<AppointmentStatusState> {
  return setAppointmentStatus(appointmentId, "no_show");
}

export async function cancelAppointmentAction(
  appointmentId: string,
  _prev: AppointmentStatusState,
  _formData: FormData,
): Promise<AppointmentStatusState> {
  return setAppointmentStatus(appointmentId, "cancelled");
}
