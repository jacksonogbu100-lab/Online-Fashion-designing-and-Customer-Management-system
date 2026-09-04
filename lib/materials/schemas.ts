import { z } from "zod";

export const materialKinds = ["fabric", "trim", "lining"] as const;
export type MaterialKind = (typeof materialKinds)[number];

export const materialUnits = ["metres", "pieces", "rolls"] as const;
export type MaterialUnit = (typeof materialUnits)[number];

export const materialWriteSchema = z.object({
  name: z.string().trim().min(1, "Name this material.").max(120),
  kind: z.enum(materialKinds),
  color: z.string().trim().max(80),
  quantity: z.string().trim().min(1, "Enter how much is on hand."),
  unit: z.enum(materialUnits),
  supplier: z.string().trim().max(120),
  lowStockAt: z.string().trim().min(1, "Enter a low-stock point."),
  notes: z.string().trim().max(2000),
  allowNegative: z.boolean(),
});

export const stockAdjustSchema = z.object({
  quantity: z.string().trim().min(1, "Enter a quantity."),
  allowNegative: z.boolean(),
});

export const bomLineSchema = z.object({
  materialId: z.string().trim().min(1, "Choose a material."),
  quantity: z.string().trim(),
  notes: z.string().trim().max(500),
});

export const orderMaterialSchema = z.object({
  materialId: z.string().trim().min(1, "Choose a material."),
  quantityNeeded: z.string().trim().min(1, "Enter how much this job needs."),
  notes: z.string().trim().max(500),
  allowNegative: z.boolean(),
});

export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
