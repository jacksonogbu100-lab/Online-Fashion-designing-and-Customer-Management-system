import type { OrderStatus } from "@/lib/orders/schemas";

import {
  documentLineKinds,
  documentStatuses,
  paymentMethods,
  type DocumentKind,
  type DocumentLineKind,
  type DocumentStatus,
  type PaymentMethod,
} from "@/lib/billing/schemas";
import { formatRupees } from "@/lib/orders/format";

export const billableOrderStatuses: OrderStatus[] = [
  "confirmed",
  "in_cut",
  "in_sew",
  "fitting",
  "ready",
  "delivered",
];

export function isBillableOrderStatus(status: OrderStatus): boolean {
  return (billableOrderStatuses as string[]).includes(status);
}

export function documentKindLabel(kind: DocumentKind): string {
  return kind === "quote" ? "Quote" : "Invoice";
}

export function documentStatusLabel(status: DocumentStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "void":
      return "Void";
  }
}

export function documentStatusClientLabel(status: Exclude<DocumentStatus, "draft">): string {
  switch (status) {
    case "sent":
      return "Sent";
    case "paid":
      return "Paid";
    case "void":
      return "Cancelled";
  }
}

export function documentLineKindLabel(kind: DocumentLineKind): string {
  switch (kind) {
    case "labour":
      return "Labour";
    case "material":
      return "Material";
    case "extra":
      return "Extra";
  }
}

export function paymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case "cash":
      return "Cash";
    case "transfer":
      return "Bank transfer";
    case "card_offline":
      return "Card (offline)";
  }
}

export function taxRateLabel(taxRateBps: number): string {
  if (taxRateBps === 0) {
    return "No tax";
  }
  const percent = taxRateBps / 100;
  return Number.isInteger(percent) ? `${percent}% GST` : `${percent.toFixed(2)}% GST`;
}

export function formatDocumentMoney(value: number): string {
  return formatRupees(value);
}

export { documentLineKinds, documentStatuses, paymentMethods, formatRupees };
