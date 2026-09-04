import { z } from "zod";

export const measurementProfileMetaSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "Name this fitting.")
    .max(80, "Keep the label under 80 characters."),
  recordedAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a date."),
  notes: z.string().trim().max(2000, "Keep notes under 2,000 characters."),
  makeCurrent: z.boolean(),
});

export type MeasurementProfileMeta = z.infer<typeof measurementProfileMetaSchema>;
