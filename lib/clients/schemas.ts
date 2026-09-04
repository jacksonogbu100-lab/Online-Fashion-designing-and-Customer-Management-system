import { z } from "zod";

export const clientStatuses = ["lead", "active", "archived"] as const;
export type ClientStatus = (typeof clientStatuses)[number];

export const clientStatusSchema = z.enum(clientStatuses);

export const clientDirectoryFilterSchema = z.enum([
  "open",
  "lead",
  "active",
  "archived",
  "all",
]);

export type ClientDirectoryFilter = z.infer<typeof clientDirectoryFilterSchema>;

export const clientWriteSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Enter a name.")
    .max(120, "Name is too long."),
  email: z.string().trim().toLowerCase().max(160),
  phone: z.string().trim().max(40),
  addressLine1: z.string().trim().max(160),
  city: z.string().trim().max(80),
  region: z.string().trim().max(80),
  postalCode: z.string().trim().max(20),
  country: z.string().trim().max(80),
  styleNotes: z.string().trim().max(4000),
  status: clientStatusSchema,
  portalUserId: z.string().trim(),
});

export const clientNoteSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a note.")
    .max(2000, "Keep notes under 2,000 characters."),
});

export type ClientWriteInput = z.infer<typeof clientWriteSchema>;

export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
