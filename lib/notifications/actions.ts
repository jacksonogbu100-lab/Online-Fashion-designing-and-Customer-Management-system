"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff, requireUser } from "@/lib/auth/access";
import { homeForRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import { appointmentTypeLabel } from "@/lib/appointments/format";
import { formatStudioRange } from "@/lib/appointments/datetime";
import { createNotification } from "@/lib/notifications/create";
import { isSafeAppPath } from "@/lib/notifications/format";

export type NotificationActionState = {
  error?: string;
};

function revalidateNotificationPaths() {
  revalidatePath("/app");
  revalidatePath("/portal");
  revalidatePath("/app/notifications");
  revalidatePath("/portal/notifications");
}

export async function markAllNotificationsReadAction(
  _prev: NotificationActionState,
  _formData: FormData,
): Promise<NotificationActionState> {
  const user = await requireUser();
  await prisma.notification.updateMany({
    where: { userId: user.id, readAt: null },
    data: { readAt: new Date() },
  });
  revalidateNotificationPaths();
  return {};
}

export async function openNotificationAction(
  notificationId: string,
  _formData?: FormData,
): Promise<void> {
  const user = await requireUser();
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: user.id },
  });
  if (!notification) {
    redirect(homeForRole(user.role) === "/app" ? "/app/notifications" : "/portal/notifications");
  }

  if (!notification.readAt) {
    await prisma.notification.update({
      where: { id: notification.id },
      data: { readAt: new Date() },
    });
    revalidateNotificationPaths();
  }

  redirect(isSafeAppPath(notification.href) ? notification.href : homeForRole(user.role));
}

export async function sendAppointmentReminderAction(
  appointmentId: string,
  _prev: NotificationActionState,
  _formData: FormData,
): Promise<NotificationActionState> {
  await requireStaff();

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      client: { select: { displayName: true, portalUserId: true } },
    },
  });
  if (!appointment) {
    return { error: "That sitting is missing." };
  }
  if (appointment.status !== "scheduled") {
    return { error: "Only a scheduled sitting can be reminded." };
  }
  if (!appointment.client.portalUserId) {
    return { error: "This client has no portal login yet." };
  }

  const href = `/portal/appointments/${appointment.id}`;
  const existing = await prisma.notification.findFirst({
    where: {
      userId: appointment.client.portalUserId,
      kind: "appointment_reminder",
      href,
      readAt: null,
    },
    select: { id: true },
  });
  if (existing) {
    return { error: "A reminder is already waiting in their portal." };
  }

  await createNotification({
    userId: appointment.client.portalUserId,
    kind: "appointment_reminder",
    title: `Reminder: ${appointmentTypeLabel(appointment.type).toLowerCase()} at Sunnex Clothing`,
    body: `${formatStudioRange(appointment.startsAt, appointment.endsAt)} · ${appointment.location}`,
    href,
  });

  return {};
}
