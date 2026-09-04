import type { NotificationKind } from "@/lib/notifications/schemas";

export function notificationKindLabel(kind: NotificationKind): string {
  switch (kind) {
    case "order_status":
      return "Order";
    case "appointment_reminder":
      return "Sitting";
    case "invoice_sent":
      return "Invoice";
  }
}

export function isSafeAppPath(href: string): boolean {
  return href.startsWith("/") && !href.startsWith("//") && !href.startsWith("/\\");
}
