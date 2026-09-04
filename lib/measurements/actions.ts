"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaff } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import type { MeasurementFieldKey } from "@/lib/measurements/fields";
import { parseDateInput } from "@/lib/measurements/format";
import {
  asJsonValues,
  hasMeasurementContent,
  readMeasurementValues,
} from "@/lib/measurements/parse";
import { measurementProfileMetaSchema } from "@/lib/measurements/schemas";

export type MeasurementFormState = {
  error?: string;
  fieldErrors?: {
    label?: string;
    recordedAt?: string;
    notes?: string;
  } & Partial<Record<MeasurementFieldKey, string>>;
};

function revalidateMeasurementPaths(clientId: string, profileId?: string) {
  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath(`/app/clients/${clientId}/measurements`);
  revalidatePath("/portal");
  if (profileId) {
    revalidatePath(`/app/clients/${clientId}/measurements/${profileId}`);
    revalidatePath(`/app/clients/${clientId}/measurements/${profileId}/edit`);
    revalidatePath(`/app/clients/${clientId}/measurements/${profileId}/print`);
  }
}

function readMeta(formData: FormData) {
  return measurementProfileMetaSchema.safeParse({
    label: formData.get("label") ?? "",
    recordedAt: formData.get("recordedAt") ?? "",
    notes: formData.get("notes") ?? "",
    makeCurrent: formData.get("makeCurrent") === "on",
  });
}

function metaFieldErrors(error: {
  issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }>;
}): MeasurementFormState["fieldErrors"] {
  const fieldErrors: MeasurementFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "label" && !fieldErrors.label) {
      fieldErrors.label = issue.message;
    }
    if (key === "recordedAt" && !fieldErrors.recordedAt) {
      fieldErrors.recordedAt = issue.message;
    }
    if (key === "notes" && !fieldErrors.notes) {
      fieldErrors.notes = issue.message;
    }
  }
  return fieldErrors;
}

async function requireClientId(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) {
    return null;
  }
  return client;
}

async function markCurrentInTransaction(clientId: string, profileId: string) {
  await prisma.$transaction([
    prisma.measurementProfile.updateMany({
      where: { clientId, NOT: { id: profileId } },
      data: { isCurrent: false },
    }),
    prisma.measurementProfile.updateMany({
      where: { id: profileId, clientId },
      data: { isCurrent: true },
    }),
  ]);
}

export async function createMeasurementProfileAction(
  clientId: string,
  _prev: MeasurementFormState,
  formData: FormData,
): Promise<MeasurementFormState> {
  await requireStaff();

  const client = await requireClientId(clientId);
  if (!client) {
    return { error: "This client is no longer in the house book." };
  }

  const parsed = readMeta(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: metaFieldErrors(parsed.error),
    };
  }

  const recordedAt = parseDateInput(parsed.data.recordedAt);
  if (!recordedAt) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { recordedAt: "Choose a date." },
    };
  }

  const { values, fieldErrors } = readMeasurementValues(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors,
    };
  }

  if (!hasMeasurementContent(values, parsed.data.notes)) {
    return {
      error: "Enter at least one measurement or a note.",
    };
  }

  const existingCount = await prisma.measurementProfile.count({
    where: { clientId },
  });
  const makeCurrent = parsed.data.makeCurrent || existingCount === 0;

  const profile = await prisma.measurementProfile.create({
    data: {
      clientId,
      label: parsed.data.label,
      recordedAt,
      notes: parsed.data.notes === "" ? null : parsed.data.notes,
      isCurrent: false,
      values: asJsonValues(values),
    },
    select: { id: true },
  });

  if (makeCurrent) {
    await markCurrentInTransaction(clientId, profile.id);
  }

  revalidateMeasurementPaths(clientId, profile.id);
  redirect(`/app/clients/${clientId}/measurements/${profile.id}`);
}

export async function updateMeasurementProfileAction(
  clientId: string,
  profileId: string,
  _prev: MeasurementFormState,
  formData: FormData,
): Promise<MeasurementFormState> {
  await requireStaff();

  const existing = await prisma.measurementProfile.findFirst({
    where: { id: profileId, clientId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "This fit profile is no longer in the book." };
  }

  const parsed = readMeta(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: metaFieldErrors(parsed.error),
    };
  }

  const recordedAt = parseDateInput(parsed.data.recordedAt);
  if (!recordedAt) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: { recordedAt: "Choose a date." },
    };
  }

  const { values, fieldErrors } = readMeasurementValues(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors,
    };
  }

  if (!hasMeasurementContent(values, parsed.data.notes)) {
    return {
      error: "Enter at least one measurement or a note.",
    };
  }

  await prisma.measurementProfile.update({
    where: { id: profileId },
    data: {
      label: parsed.data.label,
      recordedAt,
      notes: parsed.data.notes === "" ? null : parsed.data.notes,
      values: asJsonValues(values),
    },
  });

  revalidateMeasurementPaths(clientId, profileId);
  redirect(`/app/clients/${clientId}/measurements/${profileId}`);
}

export async function setCurrentMeasurementProfileAction(
  clientId: string,
  profileId: string,
  _prev: { error?: string },
  _formData: FormData,
): Promise<{ error?: string }> {
  await requireStaff();

  const existing = await prisma.measurementProfile.findFirst({
    where: { id: profileId, clientId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "This fit profile is no longer in the book." };
  }

  await markCurrentInTransaction(clientId, profileId);
  revalidateMeasurementPaths(clientId, profileId);
  return {};
}
