import type { Role } from "@/lib/auth/roles";

declare module "next-auth" {
  interface User {
    role: Role;
    status: "active" | "disabled";
  }

  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: Role;
      status: "active" | "disabled";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    status?: "active" | "disabled";
  }
}
