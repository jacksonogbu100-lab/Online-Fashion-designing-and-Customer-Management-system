import "server-only";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/access";
import { prisma } from "@/lib/db";

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null },
  });
}

export async function listNotificationsForCurrentUser() {
  const user = await requireUser();

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getOwnNotification(id: string) {
  const user = await requireUser();
  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
  });
  if (!notification) {
    notFound();
  }
  return notification;
}
