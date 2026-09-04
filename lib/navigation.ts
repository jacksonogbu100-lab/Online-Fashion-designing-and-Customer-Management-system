import type { StaffRole } from "@/lib/auth/roles";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  phase: number;
};

export type StaffNavItem = NavItem & {
  roles: StaffRole[];
};

export type NavGroup = {
  title: string;
  items: StaffNavItem[];
};

const allStaff: StaffRole[] = ["admin", "designer", "staff"];
const creative: StaffRole[] = ["admin", "designer"];

export const staffNav: NavGroup[] = [
  {
    title: "House",
    items: [
      {
        href: "/app",
        label: "Home",
        description: "Due work, sittings, and unpaid invoices.",
        phase: 9,
        roles: allStaff,
      },
      {
        href: "/app/clients",
        label: "Clients",
        description: "Directory, profiles, notes, and fit.",
        phase: 2,
        roles: allStaff,
      },
      {
        href: "/app/designs",
        label: "Designs",
        description: "Sketches, palettes, and construction notes.",
        phase: 4,
        roles: allStaff,
      },
      {
        href: "/app/collections",
        label: "Collections",
        description: "Seasonal and thematic groupings.",
        phase: 4,
        roles: creative,
      },
    ],
  },
  {
    title: "Work",
    items: [
      {
        href: "/app/orders",
        label: "Orders",
        description: "Commissions from inquiry to delivery.",
        phase: 5,
        roles: allStaff,
      },
      {
        href: "/app/calendar",
        label: "Calendar",
        description: "Consultations, measurements, and fittings.",
        phase: 6,
        roles: allStaff,
      },
    ],
  },
  {
    title: "House ops",
    items: [
      {
        href: "/app/materials",
        label: "Materials",
        description: "Fabrics, trims, and stock levels.",
        phase: 7,
        roles: creative,
      },
      {
        href: "/app/billing",
        label: "Billing",
        description: "Quotes, invoices, and recorded payments.",
        phase: 8,
        roles: allStaff,
      },
      {
        href: "/app/settings",
        label: "Settings",
        description: "Users, roles, and house configuration.",
        phase: 1,
        roles: ["admin"],
      },
    ],
  },
];

export const portalNav: NavItem[] = [
  {
    href: "/portal",
    label: "Home",
    description: "Your next fitting and shared work.",
    phase: 9,
  },
  {
    href: "/portal/orders",
    label: "Orders",
    description: "Status of garments in progress.",
    phase: 5,
  },
  {
    href: "/portal/appointments",
    label: "Appointments",
    description: "Upcoming fittings and consultations.",
    phase: 6,
  },
  {
    href: "/portal/billing",
    label: "Invoices",
    description: "Invoices the house has sent you.",
    phase: 8,
  },
  {
    href: "/portal/designs",
    label: "Designs",
    description: "Pieces Sunnex Clothing has shared with you.",
    phase: 4,
  },
];

export function visibleStaffNav(role: StaffRole): NavGroup[] {
  return staffNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}
