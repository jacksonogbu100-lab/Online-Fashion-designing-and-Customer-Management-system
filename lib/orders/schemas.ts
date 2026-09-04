import { z } from "zod";

export const orderStatuses = [
  "inquiry",
  "quoted",
  "confirmed",
  "in_cut",
  "in_sew",
  "fitting",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const orderPriorities = ["low", "normal", "high", "rush"] as const;
export type OrderPriority = (typeof orderPriorities)[number];

export const orderDirectoryFilterSchema = z.enum([
  "open",
  "inquiry",
  "quoted",
  "confirmed",
  "in_cut",
  "in_sew",
  "fitting",
  "ready",
  "delivered",
  "cancelled",
  "all",
]);

export type OrderDirectoryFilter = z.infer<typeof orderDirectoryFilterSchema>;

export const orderWriteSchema = z.object({
  title: z.string().trim().min(1, "Name this order.").max(120),
  clientId: z.string().trim().min(1, "Choose a client."),
  designId: z.string().trim(),
  measurementProfileId: z.string().trim(),
  snapshotFit: z.boolean(),
  dueAt: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{4}-\d{2}-\d{2}$/.test(value), "Choose a date."),
  priceEstimateInr: z.string().trim(),
  priority: z.enum(orderPriorities),
  notes: z.string().trim().max(4000),
});

export const orderStatusSchema = z.enum(orderStatuses);

export const orderNoteSchema = z.object({
  body: z.string().trim().min(1, "Write a note.").max(2000),
});

export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
