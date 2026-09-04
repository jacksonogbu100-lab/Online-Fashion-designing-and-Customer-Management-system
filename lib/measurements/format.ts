import { MEASUREMENT_UNIT } from "@/lib/measurements/fields";
import type { MeasurementValues } from "@/lib/measurements/parse";

export function formatCentimetres(value: number): string {
  const rounded = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${rounded} ${MEASUREMENT_UNIT}`;
}

export function filledMeasurementCount(values: MeasurementValues): number {
  return Object.keys(values).length;
}

export function parseDateInput(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toDateInputValue(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function todayInputValue(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function suggestedFittingLabel(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)} fitting`;
}
