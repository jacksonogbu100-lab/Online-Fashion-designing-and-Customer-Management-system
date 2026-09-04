import "server-only";

import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requireClient, requireCreative, requireStaff, getCurrentUser } from "@/lib/auth/access";
import { isStaffRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/db";
import {
  designDirectoryFilterSchema,
  type DesignDirectoryFilter,
} from "@/lib/designs/schemas";

const imageSelect = {
  id: true,
  storedName: true,
  originalName: true,
  mimeType: true,
  kind: true,
  sortOrder: true,
} as const;

export function parseDesignDirectoryFilter(value: string | undefined): DesignDirectoryFilter {
  const parsed = designDirectoryFilterSchema.safeParse(value ?? "open");
  return parsed.success ? parsed.data : "open";
}

function designWhere(
  query: string,
  filter: DesignDirectoryFilter,
  collectionId?: string,
): Prisma.DesignWhereInput {
  const statusFilter: Prisma.DesignWhereInput =
    filter === "open"
      ? { status: { in: ["concept", "in_development", "approved"] } }
      : filter === "all"
        ? {}
        : { status: filter };

  const term = query.trim();
  const search: Prisma.DesignWhereInput = term
    ? {
        OR: [
          { title: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      }
    : {};

  return {
    AND: [
      statusFilter,
      search,
      collectionId ? { collectionId } : {},
    ],
  };
}

export async function listDesignsForStaff(options: {
  query?: string;
  filter?: string;
  collectionId?: string;
}) {
  await requireStaff();
  const filter = parseDesignDirectoryFilter(options.filter);

  return prisma.design.findMany({
    where: designWhere(options.query ?? "", filter, options.collectionId),
    orderBy: [{ updatedAt: "desc" }],
    include: {
      collection: { select: { id: true, name: true } },
      client: { select: { id: true, displayName: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, kind: true },
      },
    },
  });
}

export async function getDesignForStaff(id: string) {
  await requireStaff();

  const design = await prisma.design.findUnique({
    where: { id },
    include: {
      collection: { select: { id: true, name: true, season: true } },
      client: { select: { id: true, displayName: true } },
      createdBy: { select: { name: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: imageSelect,
      },
    },
  });

  if (!design) {
    notFound();
  }

  return design;
}

export async function listCollectionsForStaff(options?: { includeArchived?: boolean }) {
  await requireCreative();

  return prisma.collection.findMany({
    where: options?.includeArchived ? {} : { status: { not: "archived" } },
    orderBy: [{ name: "asc" }],
    include: {
      _count: { select: { designs: true } },
    },
  });
}

export async function listCollectionsForSelect(includeId?: string | null) {
  await requireStaff();

  return prisma.collection.findMany({
    where: includeId
      ? { OR: [{ status: { not: "archived" } }, { id: includeId }] }
      : { status: { not: "archived" } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, season: true },
  });
}

export async function getCollectionForStaff(id: string) {
  await requireCreative();

  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      designs: {
        orderBy: { title: "asc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  });

  if (!collection) {
    notFound();
  }

  return collection;
}

export async function listClientsForDesignLink(includeId?: string | null) {
  await requireStaff();

  return prisma.client.findMany({
    where: includeId
      ? { OR: [{ status: { in: ["lead", "active"] } }, { id: includeId }] }
      : { status: { in: ["lead", "active"] } },
    orderBy: { displayName: "asc" },
    select: { id: true, displayName: true },
  });
}

export async function getDesignImageForViewer(imageId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return null;
  }

  const image = await prisma.designImage.findUnique({
    where: { id: imageId },
    include: {
      design: {
        select: {
          id: true,
          sharedWithClient: true,
          clientId: true,
        },
      },
    },
  });

  if (!image) {
    return null;
  }

  if (isStaffRole(user.role)) {
    return image;
  }

  if (user.role !== "client") {
    return null;
  }

  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (
    !record ||
    !image.design.sharedWithClient ||
    image.design.clientId !== record.id
  ) {
    return null;
  }

  return image;
}

export async function listSharedDesignsForPortal() {
  const user = await requireClient();
  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!record) {
    return [];
  }

  return prisma.design.findMany({
    where: {
      sharedWithClient: true,
      clientId: record.id,
      status: { not: "archived" },
    },
    orderBy: { updatedAt: "desc" },
    include: {
      collection: { select: { name: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: { id: true },
      },
    },
  });
}

export async function getSharedDesignForPortal(id: string) {
  const user = await requireClient();
  const record = await prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: { id: true },
  });
  if (!record) {
    notFound();
  }

  const design = await prisma.design.findFirst({
    where: {
      id,
      sharedWithClient: true,
      clientId: record.id,
      status: { not: "archived" },
    },
    include: {
      collection: { select: { name: true, season: true } },
      images: {
        orderBy: { sortOrder: "asc" },
        select: imageSelect,
      },
    },
  });

  if (!design) {
    notFound();
  }

  return design;
}
