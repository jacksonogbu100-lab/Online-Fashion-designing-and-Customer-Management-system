import "server-only";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import type { NotificationKind } from "@/lib/notifications/schemas";

export async function createNotification(input: {
  userId: string | null | undefined;
  kind: NotificationKind;
  title: string;
  body?: string | null;
  href: string;
}) {
  if (!input.userId) {
    return;
  }

  await prisma.notification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body ?? null,
      href: input.href,
    },
  });

  revalidatePath("/app");
  revalidatePath("/portal");
  revalidatePath("/app/notifications");
  revalidatePath("/portal/notifications");
}

export async function portalUserIdForClient(clientId: string) {
  const record = await prisma.client.findUnique({
    where: { id: clientId },
    select: { portalUserId: true },
  });
  return record?.portalUserId ?? null;
}
