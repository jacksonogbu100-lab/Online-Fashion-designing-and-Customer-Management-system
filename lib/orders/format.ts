import type { OrderPriority, OrderStatus } from "@/lib/orders/schemas";

export function orderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "inquiry":
      return "Inquiry";
    case "quoted":
      return "Quoted";
    case "confirmed":
      return "Confirmed";
    case "in_cut":
      return "In cut";
    case "in_sew":
      return "In sew";
    case "fitting":
      return "Fitting";
    case "ready":
      return "Ready";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

export function orderStatusClientLabel(status: OrderStatus): string {
  switch (status) {
    case "inquiry":
      return "Request received";
    case "quoted":
      return "Quote ready";
    case "confirmed":
      return "Confirmed";
    case "in_cut":
      return "Cutting";
    case "in_sew":
      return "Sewing";
    case "fitting":
      return "Fitting";
    case "ready":
      return "Ready for you";
    case "delivered":
      return "Delivered";
    case "cancelled":
      return "Cancelled";
  }
}

export function orderPriorityLabel(priority: OrderPriority): string {
  switch (priority) {
    case "low":
      return "Low";
    case "normal":
      return "Normal";
    case "high":
      return "High";
    case "rush":
      return "Rush";
  }
}

export function formatRupees(value: number | null | undefined): string {
  if (value == null) {
    return "—";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === "delivered" || status === "cancelled";
}

export const productionColumns: OrderStatus[] = [
  "inquiry",
  "quoted",
  "confirmed",
  "in_cut",
  "in_sew",
  "fitting",
  "ready",
];

export const closedColumns: OrderStatus[] = ["delivered", "cancelled"];

export function orderEventTitle(event: {
  kind: "created" | "status_changed" | "note";
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
}): string {
  if (event.kind === "created") {
    return event.toStatus ? `Opened · ${orderStatusLabel(event.toStatus)}` : "Opened";
  }
  if (event.kind === "status_changed") {
    const from = event.fromStatus ? orderStatusLabel(event.fromStatus) : "—";
    const to = event.toStatus ? orderStatusLabel(event.toStatus) : "—";
    return `${from} → ${to}`;
  }
  return "Workroom note";
}

export function orderEventClientTitle(event: {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus | null;
}): string {
  const from = event.fromStatus ? orderStatusClientLabel(event.fromStatus) : "—";
  const to = event.toStatus ? orderStatusClientLabel(event.toStatus) : "—";
  return `${from} → ${to}`;
}
