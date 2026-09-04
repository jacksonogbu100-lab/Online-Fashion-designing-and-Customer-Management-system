import type { MaterialKind, MaterialUnit } from "@/lib/materials/schemas";

export function materialKindLabel(kind: MaterialKind): string {
  switch (kind) {
    case "fabric":
      return "Fabric";
    case "trim":
      return "Trim";
    case "lining":
      return "Lining";
  }
}

export function materialUnitLabel(unit: MaterialUnit): string {
  switch (unit) {
    case "metres":
      return "metres";
    case "pieces":
      return "pieces";
    case "rolls":
      return "rolls";
  }
}

export function formatQuantity(value: { toString(): string } | number | string, unit: MaterialUnit): string {
  const raw = typeof value === "number" ? String(value) : value.toString();
  const asNumber = Number(raw);
  const display = Number.isInteger(asNumber) ? String(asNumber) : asNumber.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${display} ${materialUnitLabel(unit)}`;
}

export function toQuantityInput(value: { toString(): string } | number | string): string {
  const raw = typeof value === "number" ? String(value) : value.toString();
  const asNumber = Number(raw);
  if (!Number.isFinite(asNumber)) {
    return "0";
  }
  return Number.isInteger(asNumber) ? String(asNumber) : asNumber.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

export function isLowStock(quantity: { toString(): string }, lowStockAt: { toString(): string }): boolean {
  return Number(quantity.toString()) <= Number(lowStockAt.toString());
}

export function isNegativeStock(quantity: { toString(): string }): boolean {
  return Number(quantity.toString()) < 0;
}
