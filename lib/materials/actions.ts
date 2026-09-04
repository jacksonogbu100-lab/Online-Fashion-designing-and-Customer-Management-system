"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { requireCreative, requireStaff } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import {
  bomLineSchema,
  emptyToNull,
  materialWriteSchema,
  orderMaterialSchema,
  stockAdjustSchema,
} from "@/lib/materials/schemas";

export type MaterialFormState = {
  error?: string;
  warning?: string;
  fieldErrors?: {
    name?: string;
    kind?: string;
    color?: string;
    quantity?: string;
    unit?: string;
    supplier?: string;
    lowStockAt?: string;
    notes?: string;
    materialId?: string;
    quantityNeeded?: string;
  };
};

function revalidateMaterialPaths(options?: { materialId?: string; designId?: string; orderId?: string }) {
  revalidatePath("/app/materials");
  if (options?.materialId) {
    revalidatePath(`/app/materials/${options.materialId}`);
  }
  if (options?.designId) {
    revalidatePath(`/app/designs/${options.designId}`);
  }
  if (options?.orderId) {
    revalidatePath(`/app/orders/${options.orderId}`);
  }
}

function fieldErrorsFromZod(error: z.ZodError): MaterialFormState["fieldErrors"] {
  const fieldErrors: MaterialFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
      fieldErrors[key as keyof typeof fieldErrors] = issue.message;
    }
  }
  return fieldErrors;
}

function parseQuantity(raw: string): { value: Prisma.Decimal } | { error: string } {
  const trimmed = raw.trim().replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    return { error: "Enter a number with up to two decimals." };
  }
  const value = new Prisma.Decimal(trimmed);
  if (value.abs().greaterThan(1_000_000)) {
    return { error: "That quantity is too large." };
  }
  return { value };
}

function wouldGoNegative(next: Prisma.Decimal, allowNegative: boolean): string | null {
  if (next.isNegative() && !allowNegative) {
    return "That would take stock below zero. Tick the box if you mean it.";
  }
  return null;
}

export async function createMaterialAction(
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await requireCreative();

  const parsed = materialWriteSchema.safeParse({
    name: formData.get("name") ?? "",
    kind: formData.get("kind") ?? "",
    color: formData.get("color") ?? "",
    quantity: formData.get("quantity") ?? "",
    unit: formData.get("unit") ?? "",
    supplier: formData.get("supplier") ?? "",
    lowStockAt: formData.get("lowStockAt") ?? "",
    notes: formData.get("notes") ?? "",
    allowNegative: formData.get("allowNegative") === "on",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const quantity = parseQuantity(parsed.data.quantity);
  if ("error" in quantity) {
    return { error: quantity.error, fieldErrors: { quantity: quantity.error } };
  }
  const lowStockAt = parseQuantity(parsed.data.lowStockAt);
  if ("error" in lowStockAt) {
    return { error: lowStockAt.error, fieldErrors: { lowStockAt: lowStockAt.error } };
  }
  if (lowStockAt.value.isNegative()) {
    return { error: "Low-stock point cannot be negative.", fieldErrors: { lowStockAt: "Use zero or more." } };
  }

  const negative = wouldGoNegative(quantity.value, parsed.data.allowNegative);
  if (negative) {
    return { error: negative, warning: negative, fieldErrors: { quantity: negative } };
  }

  const material = await prisma.material.create({
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      color: emptyToNull(parsed.data.color),
      quantity: quantity.value,
      unit: parsed.data.unit,
      supplier: emptyToNull(parsed.data.supplier),
      lowStockAt: lowStockAt.value,
      notes: emptyToNull(parsed.data.notes),
    },
    select: { id: true },
  });

  revalidateMaterialPaths({ materialId: material.id });
  redirect(`/app/materials/${material.id}`);
}

export async function updateMaterialAction(
  materialId: string,
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await requireCreative();

  const parsed = materialWriteSchema.safeParse({
    name: formData.get("name") ?? "",
    kind: formData.get("kind") ?? "",
    color: formData.get("color") ?? "",
    quantity: formData.get("quantity") ?? "",
    unit: formData.get("unit") ?? "",
    supplier: formData.get("supplier") ?? "",
    lowStockAt: formData.get("lowStockAt") ?? "",
    notes: formData.get("notes") ?? "",
    allowNegative: formData.get("allowNegative") === "on",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const quantity = parseQuantity(parsed.data.quantity);
  if ("error" in quantity) {
    return { error: quantity.error, fieldErrors: { quantity: quantity.error } };
  }
  const lowStockAt = parseQuantity(parsed.data.lowStockAt);
  if ("error" in lowStockAt) {
    return { error: lowStockAt.error, fieldErrors: { lowStockAt: lowStockAt.error } };
  }
  if (lowStockAt.value.isNegative()) {
    return { error: "Low-stock point cannot be negative.", fieldErrors: { lowStockAt: "Use zero or more." } };
  }

  const negative = wouldGoNegative(quantity.value, parsed.data.allowNegative);
  if (negative) {
    return { error: negative, warning: negative, fieldErrors: { quantity: negative } };
  }

  await prisma.material.update({
    where: { id: materialId },
    data: {
      name: parsed.data.name,
      kind: parsed.data.kind,
      color: emptyToNull(parsed.data.color),
      quantity: quantity.value,
      unit: parsed.data.unit,
      supplier: emptyToNull(parsed.data.supplier),
      lowStockAt: lowStockAt.value,
      notes: emptyToNull(parsed.data.notes),
    },
  });

  revalidateMaterialPaths({ materialId });
  redirect(`/app/materials/${materialId}`);
}

export async function adjustMaterialStockAction(
  materialId: string,
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await requireCreative();

  const parsed = stockAdjustSchema.safeParse({
    quantity: formData.get("quantity") ?? "",
    allowNegative: formData.get("allowNegative") === "on",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const quantity = parseQuantity(parsed.data.quantity);
  if ("error" in quantity) {
    return { error: quantity.error, fieldErrors: { quantity: quantity.error } };
  }

  const existing = await prisma.material.findUnique({
    where: { id: materialId },
    select: { id: true, quantity: true },
  });
  if (!existing) {
    return { error: "This material is no longer in stock." };
  }

  const next = existing.quantity.plus(quantity.value);
  const negative = wouldGoNegative(next, parsed.data.allowNegative);
  if (negative) {
    return { error: negative, warning: negative, fieldErrors: { quantity: negative } };
  }

  await prisma.material.update({
    where: { id: materialId },
    data: { quantity: next },
  });

  revalidateMaterialPaths({ materialId });
  return next.isNegative()
    ? { warning: `On hand is now ${next.toString()}. Stock is below zero.` }
    : {};
}

export async function addDesignMaterialAction(
  designId: string,
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await requireCreative();

  const parsed = bomLineSchema.safeParse({
    materialId: formData.get("materialId") ?? "",
    quantity: formData.get("quantity") ?? "",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  let quantity: Prisma.Decimal | null = null;
  if (parsed.data.quantity.trim() !== "") {
    const parsedQty = parseQuantity(parsed.data.quantity);
    if ("error" in parsedQty) {
      return { error: parsedQty.error, fieldErrors: { quantity: parsedQty.error } };
    }
    if (parsedQty.value.isNegative()) {
      return { error: "Need cannot be negative.", fieldErrors: { quantity: "Use zero or more." } };
    }
    quantity = parsedQty.value;
  }

  try {
    await prisma.designMaterial.create({
      data: {
        designId,
        materialId: parsed.data.materialId,
        quantity,
        notes: emptyToNull(parsed.data.notes),
      },
    });
  } catch {
    return { error: "That material is already on this design." };
  }

  revalidateMaterialPaths({ designId, materialId: parsed.data.materialId });
  return {};
}

export async function removeDesignMaterialAction(designId: string, lineId: string): Promise<void> {
  await requireCreative();
  await prisma.designMaterial.deleteMany({ where: { id: lineId, designId } });
  revalidateMaterialPaths({ designId });
}

export async function addOrderMaterialAction(
  orderId: string,
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await requireStaff();

  const parsed = orderMaterialSchema.safeParse({
    materialId: formData.get("materialId") ?? "",
    quantityNeeded: formData.get("quantityNeeded") ?? "",
    notes: formData.get("notes") ?? "",
    allowNegative: formData.get("allowNegative") === "on",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const needed = parseQuantity(parsed.data.quantityNeeded);
  if ("error" in needed) {
    return { error: needed.error, fieldErrors: { quantityNeeded: needed.error } };
  }
  if (needed.value.isNegative() || needed.value.isZero()) {
    return { error: "Need a quantity greater than zero.", fieldErrors: { quantityNeeded: "Enter more than zero." } };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, designId: true },
  });
  if (!order) {
    return { error: "This order is no longer in the book." };
  }

  try {
    await prisma.orderMaterial.create({
      data: {
        orderId,
        materialId: parsed.data.materialId,
        quantityNeeded: needed.value,
        notes: emptyToNull(parsed.data.notes),
      },
    });
  } catch {
    return { error: "That material is already on this order." };
  }

  revalidateMaterialPaths({ orderId, materialId: parsed.data.materialId });
  return {};
}

export async function allocateOrderMaterialAction(
  orderId: string,
  lineId: string,
  _prev: MaterialFormState,
  formData: FormData,
): Promise<MaterialFormState> {
  await requireStaff();
  const allowNegative = formData.get("allowNegative") === "on";

  const line = await prisma.orderMaterial.findFirst({
    where: { id: lineId, orderId },
    include: { material: { select: { id: true, quantity: true, name: true } } },
  });
  if (!line) {
    return { error: "That line is no longer on the order." };
  }

  const delta = line.quantityNeeded.minus(line.quantityAllocated);
  if (delta.lessThanOrEqualTo(0)) {
    return { error: "This line is already allocated." };
  }

  const nextStock = line.material.quantity.minus(delta);
  const negative = wouldGoNegative(nextStock, allowNegative);
  if (negative) {
    return {
      error: `Allocating ${line.material.name} ${negative}`,
      warning: negative,
    };
  }

  await prisma.$transaction([
    prisma.material.update({
      where: { id: line.materialId },
      data: { quantity: nextStock },
    }),
    prisma.orderMaterial.update({
      where: { id: line.id },
      data: { quantityAllocated: line.quantityNeeded },
    }),
  ]);

  revalidateMaterialPaths({ orderId, materialId: line.materialId });
  return nextStock.isNegative()
    ? { warning: `${line.material.name} is now below zero on hand.` }
    : {};
}

export async function copyDesignBomToOrderAction(
  orderId: string,
  _prev: MaterialFormState,
  _formData: FormData,
): Promise<MaterialFormState> {
  await requireStaff();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, designId: true },
  });
  if (!order?.designId) {
    return { error: "Attach a design before copying its bill of materials." };
  }

  const lines = await prisma.designMaterial.findMany({
    where: { designId: order.designId },
  });
  if (lines.length === 0) {
    return { error: "That design has no materials yet." };
  }

  let copied = 0;
  for (const line of lines) {
    if (!line.quantity) {
      continue;
    }
    await prisma.orderMaterial.upsert({
      where: { orderId_materialId: { orderId, materialId: line.materialId } },
      update: {},
      create: {
        orderId,
        materialId: line.materialId,
        quantityNeeded: line.quantity,
        notes: line.notes,
      },
    });
    copied += 1;
  }

  if (copied === 0) {
    return { error: "The design bill has no quantities to copy." };
  }

  revalidateMaterialPaths({ orderId, designId: order.designId });
  return {};
}

export async function removeOrderMaterialAction(orderId: string, lineId: string): Promise<void> {
  await requireStaff();

  const line = await prisma.orderMaterial.findFirst({
    where: { id: lineId, orderId },
  });
  if (!line) {
    return;
  }
  if (line.quantityAllocated.greaterThan(0)) {
    return;
  }

  await prisma.orderMaterial.delete({ where: { id: lineId } });
  revalidateMaterialPaths({ orderId });
}
