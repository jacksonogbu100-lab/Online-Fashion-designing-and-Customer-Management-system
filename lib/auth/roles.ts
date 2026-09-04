export const staffRoles = ["admin", "designer", "staff"] as const;

export type StaffRole = (typeof staffRoles)[number];
export type Role = StaffRole | "client";

export function isStaffRole(role: string | undefined): role is StaffRole {
  return role === "admin" || role === "designer" || role === "staff";
}

export function isCreativeRole(role: string | undefined): role is "admin" | "designer" {
  return role === "admin" || role === "designer";
}

export function homeForRole(role: Role): "/app" | "/portal" {
  return role === "client" ? "/portal" : "/app";
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "designer":
      return "Designer";
    case "staff":
      return "Staff";
    case "client":
      return "Client";
  }
}
