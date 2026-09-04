import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { isCreativeRole, isStaffRole, type Role, type StaffRole } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session-user";

async function loadActiveUser(): Promise<SessionUser | null> {
  const session = await auth();
  const sessionUser = session?.user;
  if (!sessionUser?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, name: true, email: true, role: true, status: true },
  });

  if (!user || user.status !== "active") {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  return loadActiveUser();
}

export async function requireUser(): Promise<SessionUser> {
  const user = await loadActiveUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect("/forbidden");
  }
  return user;
}

export async function requireStaff(): Promise<SessionUser & { role: StaffRole }> {
  const user = await requireUser();
  if (!isStaffRole(user.role)) {
    redirect("/forbidden");
  }
  return user as SessionUser & { role: StaffRole };
}

export async function requireCreative(): Promise<
  SessionUser & { role: "admin" | "designer" }
> {
  const user = await requireUser();
  if (!isCreativeRole(user.role)) {
    redirect("/forbidden");
  }
  return user as SessionUser & { role: "admin" | "designer" };
}

export async function requireClient(): Promise<SessionUser> {
  return requireRole("client");
}
