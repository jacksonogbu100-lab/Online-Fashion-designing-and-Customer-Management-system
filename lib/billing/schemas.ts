import { z } from "zod";

export const documentKinds = ["quote", "invoice"] as const;
export type DocumentKind = (typeof documentKinds)[number];

export const documentStatuses = ["draft", "sent", "paid", "void"] as const;
export type DocumentStatus = (typeof documentStatuses)[number];

export const documentLineKinds = ["labour", "material", "extra"] as const;
export type DocumentLineKind = (typeof documentLineKinds)[number];

export const paymentMethods = ["cash", "transfer", "card_offline"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const taxRateOptions = [
  { value: 0, label: "No tax" },
  { value: 1800, label: "18% GST" },
] as const;

export const createQuoteSchema = z.object({
  orderId: z.string().trim().min(1, "Choose an order."),
});

export const documentMetaSchema = z.object({
  title: z.string().trim().min(1, "Name this document.").max(160),
  notes: z.string().trim().max(2000),
  taxRateBps: z.enum(["0", "1800"]),
  taxInclusive: z.boolean(),
});

export const documentLineSchema = z.object({
  kind: z.enum(documentLineKinds),
  description: z.string().trim().min(1, "Describe the line.").max(200),
  quantity: z.string().trim().min(1, "Enter a quantity."),
  unitAmountInr: z.string().trim().min(1, "Enter a rupee amount."),
});

export const paymentSchema = z.object({
  amountInr: z.string().trim().min(1, "Enter a rupee amount."),
  method: z.enum(paymentMethods),
  receivedAt: z.string().trim().min(1, "Choose the date received."),
  notes: z.string().trim().max(500),
  overpayNote: z.string().trim().max(500),
});

export const voidDocumentSchema = z.object({
  voidReason: z.string().trim().min(1, "Say why this document is void.").max(500),
});

export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
