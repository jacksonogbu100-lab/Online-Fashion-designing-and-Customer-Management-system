"use server";

import { AuthError } from "next-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { requireStaff, requireUser } from "@/lib/auth/access";
import { homeForRole, isStaffRole } from "@/lib/auth/roles";
import { loginSchema } from "@/lib/auth/schemas";
import { prisma } from "@/lib/db";

export type LoginState = {
  error?: string;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Invalid email or password." };
  }

  const requested = String(formData.get("from") ?? "");
  const safeFrom =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "";

  try {
    const result = await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });

    if (result && typeof result === "object" && "error" in result && result.error) {
      return { error: "Invalid email or password." };
    }
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { role: true, status: true },
  });

  if (!user || user.status !== "active") {
    return { error: "Invalid email or password." };
  }

  if (safeFrom.startsWith("/app") && isStaffRole(user.role)) {
    redirect(safeFrom);
  }
  if (safeFrom.startsWith("/portal") && user.role === "client") {
    redirect(safeFrom);
  }
  redirect(homeForRole(user.role));
}

export async function logoutAction() {
  await requireUser();
  await signOut({ redirectTo: "/login" });
}

export async function refreshStaffWorkspacePulse() {
  await requireStaff();
  revalidatePath("/app");
}
