import type { NextAuthConfig } from "next-auth";

import { isStaffRole, type Role } from "@/lib/auth/roles";

function isRole(value: unknown): value is Role {
  return (
    value === "admin" ||
    value === "designer" ||
    value === "staff" ||
    value === "client"
  );
}

function isUserStatus(value: unknown): value is "active" | "disabled" {
  return value === "active" || value === "disabled";
}

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isStaffArea = pathname === "/app" || pathname.startsWith("/app/");
      const isPortal = pathname === "/portal" || pathname.startsWith("/portal/");
      const isMedia = pathname.startsWith("/media/");

      if (isMedia) {
        return Boolean(auth?.user);
      }

      if (!isStaffArea && !isPortal) {
        return true;
      }

      const role = auth?.user?.role;
      if (!auth?.user || !role) {
        return false;
      }

      if (isStaffArea && !isStaffRole(role)) {
        return Response.redirect(new URL("/forbidden", request.nextUrl.origin));
      }

      if (isPortal && role !== "client") {
        return Response.redirect(new URL("/forbidden", request.nextUrl.origin));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user && isRole(user.role) && isUserStatus(user.status)) {
        token.role = user.role;
        token.status = user.status;
      }
      return token;
    },
    session({ session, token }) {
      if (
        session.user &&
        token.sub &&
        isRole(token.role) &&
        isUserStatus(token.status)
      ) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.status = token.status;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
