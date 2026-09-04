import { z } from "zod";

export const collectionStatuses = ["draft", "active", "archived"] as const;
export type CollectionStatus = (typeof collectionStatuses)[number];

export const designStatuses = [
  "concept",
  "in_development",
  "approved",
  "archived",
] as const;
export type DesignStatus = (typeof designStatuses)[number];

export const designCategories = [
  "jeans",
  "trousers",
  "shirts",
  "jackets",
  "other",
] as const;
export type DesignCategory = (typeof designCategories)[number];

export const designImageKinds = ["sketch", "drape", "mood"] as const;
export type DesignImageKind = (typeof designImageKinds)[number];

export const collectionWriteSchema = z.object({
  name: z.string().trim().min(1, "Name this collection.").max(120),
  season: z.string().trim().max(80),
  status: z.enum(collectionStatuses),
  notes: z.string().trim().max(4000),
});

export const designWriteSchema = z.object({
  title: z.string().trim().min(1, "Name this design.").max(120),
  description: z.string().trim().max(4000),
  category: z.enum(designCategories),
  status: z.enum(designStatuses),
  colorNotes: z.string().trim().max(2000),
  fabricNotes: z.string().trim().max(2000),
  constructionNotes: z.string().trim().max(4000),
  collectionId: z.string().trim(),
  clientId: z.string().trim(),
});

export const designDirectoryFilterSchema = z.enum([
  "open",
  "concept",
  "in_development",
  "approved",
  "archived",
  "all",
]);

export type DesignDirectoryFilter = z.infer<typeof designDirectoryFilterSchema>;

export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
