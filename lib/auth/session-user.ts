import type { Role } from "@/lib/auth/roles";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};
