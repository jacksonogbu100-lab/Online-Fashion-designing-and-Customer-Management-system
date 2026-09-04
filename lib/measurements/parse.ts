import type { Prisma } from "@prisma/client";

import {
  MEASUREMENT_FIELDS,
  isMeasurementFieldKey,
  type MeasurementFieldKey,
} from "@/lib/measurements/fields";

export type MeasurementValues = Partial<Record<MeasurementFieldKey, number>>;

const MAX_CM = 400;
const MIN_CM = 0.1;

export function parseMeasurementValues(raw: Prisma.JsonValue | null | undefined): MeasurementValues {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const source = raw as Record<string, unknown>;
  const values: MeasurementValues = {};

  for (const field of MEASUREMENT_FIELDS) {
    const value = source[field.key];
    if (typeof value === "number" && Number.isFinite(value) && value >= MIN_CM && value < MAX_CM) {
      values[field.key] = value;
    }
  }

  return values;
}

export function readMeasurementValues(formData: FormData): {
  values: MeasurementValues;
  fieldErrors: Partial<Record<MeasurementFieldKey, string>>;
} {
  const values: MeasurementValues = {};
  const fieldErrors: Partial<Record<MeasurementFieldKey, string>> = {};

  for (const field of MEASUREMENT_FIELDS) {
    const raw = String(formData.get(field.key) ?? "").trim();
    if (raw === "") {
      continue;
    }

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < MIN_CM || parsed >= MAX_CM) {
      fieldErrors[field.key] = "Enter a measurement in centimetres.";
      continue;
    }

    values[field.key] = Math.round(parsed * 10) / 10;
  }

  return { values, fieldErrors };
}

export function hasMeasurementContent(values: MeasurementValues, notes: string): boolean {
  return Object.keys(values).length > 0 || notes.trim().length > 0;
}

export function valueInput(values: MeasurementValues, key: MeasurementFieldKey): string {
  const value = values[key];
  return typeof value === "number" ? String(value) : "";
}

export function asJsonValues(values: MeasurementValues): Prisma.InputJsonValue {
  const json: Record<string, number> = {};
  for (const [key, value] of Object.entries(values)) {
    if (isMeasurementFieldKey(key) && typeof value === "number") {
      json[key] = value;
    }
  }
  return json;
}
