import "server-only";

import { notFound } from "next/navigation";

import { requireClient, requireStaff } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import { parseMeasurementValues } from "@/lib/measurements/parse";

const profileSelect = {
  id: true,
  clientId: true,
  label: true,
  recordedAt: true,
  notes: true,
  isCurrent: true,
  values: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listMeasurementProfilesForStaff(clientId: string) {
  await requireStaff();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, displayName: true, status: true },
  });
  if (!client) {
    notFound();
  }

  const profiles = await prisma.measurementProfile.findMany({
    where: { clientId },
    orderBy: [{ recordedAt: "desc" }, { createdAt: "desc" }],
    select: profileSelect,
  });

  return {
    client,
    profiles: profiles.map((profile) => ({
      ...profile,
      values: parseMeasurementValues(profile.values),
    })),
  };
}

export async function getMeasurementProfileForStaff(clientId: string, profileId: string) {
  await requireStaff();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      displayName: true,
      status: true,
      email: true,
      phone: true,
      city: true,
      country: true,
    },
  });
  if (!client) {
    notFound();
  }

  const profile = await prisma.measurementProfile.findFirst({
    where: { id: profileId, clientId },
    select: profileSelect,
  });
  if (!profile) {
    notFound();
  }

  return {
    client,
    profile: {
      ...profile,
      values: parseMeasurementValues(profile.values),
    },
  };
}

export async function getCurrentMeasurementProfileForStaff(clientId: string) {
  await requireStaff();

  const profile = await prisma.measurementProfile.findFirst({
    where: { clientId, isCurrent: true },
    select: profileSelect,
  });

  if (!profile) {
    return null;
  }

  return {
    ...profile,
    values: parseMeasurementValues(profile.values),
  };
}

export async function getOwnCurrentMeasurementProfile() {
  const user = await requireClient();

  const client = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!client) {
    return null;
  }

  const profile = await prisma.measurementProfile.findFirst({
    where: { clientId: client.id, isCurrent: true },
    select: profileSelect,
  });
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    values: parseMeasurementValues(profile.values),
  };
}
