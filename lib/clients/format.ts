import type { ClientStatus } from "@/lib/clients/schemas";

export function clientStatusLabel(status: ClientStatus): string {
  switch (status) {
    case "lead":
      return "Lead";
    case "active":
      return "Active";
    case "archived":
      return "Archived";
  }
}

export function formatHouseDate(value: Date | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatHouseDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}
