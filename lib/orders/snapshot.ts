import type { Prisma } from "@prisma/client";

import { parseMeasurementValues, type MeasurementValues } from "@/lib/measurements/parse";

export type FitSnapshot = {
  profileId: string;
  label: string;
  recordedAt: string;
  notes: string | null;
  values: MeasurementValues;
};

export function snapshotFromProfile(profile: {
  id: string;
  label: string;
  recordedAt: Date;
  notes: string | null;
  values: Prisma.JsonValue;
}): FitSnapshot {
  return {
    profileId: profile.id,
    label: profile.label,
    recordedAt: profile.recordedAt.toISOString(),
    notes: profile.notes,
    values: parseMeasurementValues(profile.values),
  };
}

export function parseFitSnapshot(raw: Prisma.JsonValue | null | undefined): FitSnapshot | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const source = raw as Record<string, unknown>;
  if (typeof source.profileId !== "string" || typeof source.label !== "string") {
    return null;
  }

  return {
    profileId: source.profileId,
    label: source.label,
    recordedAt: typeof source.recordedAt === "string" ? source.recordedAt : "",
    notes: typeof source.notes === "string" ? source.notes : null,
    values: parseMeasurementValues(source.values as Prisma.JsonValue),
  };
}
