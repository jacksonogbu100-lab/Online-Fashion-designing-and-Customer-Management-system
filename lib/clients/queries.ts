import "server-only";

import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";

import { requireClient, requireStaff } from "@/lib/auth/access";
import {
  clientDirectoryFilterSchema,
  type ClientDirectoryFilter,
} from "@/lib/clients/schemas";
import { prisma } from "@/lib/db";

export type ClientListItem = Prisma.ClientGetPayload<{
  select: {
    id: true;
    displayName: true;
    email: true;
    phone: true;
    status: true;
    lastContactedAt: true;
    updatedAt: true;
    portalUser: { select: { email: true } };
  };
}>;

function directoryWhere(
  query: string,
  filter: ClientDirectoryFilter,
): Prisma.ClientWhereInput {
  const statusFilter: Prisma.ClientWhereInput =
    filter === "open"
      ? { status: { in: ["lead", "active"] } }
      : filter === "all"
        ? {}
        : { status: filter };

  const term = query.trim();
  if (!term) {
    return statusFilter;
  }

  return {
    AND: [
      statusFilter,
      {
        OR: [
          { displayName: { contains: term, mode: "insensitive" } },
          { email: { contains: term, mode: "insensitive" } },
        ],
      },
    ],
  };
}

export function parseDirectoryFilter(value: string | undefined): ClientDirectoryFilter {
  const parsed = clientDirectoryFilterSchema.safeParse(value ?? "open");
  return parsed.success ? parsed.data : "open";
}

export async function listClientsForStaff(options: {
  query?: string;
  filter?: string;
}): Promise<ClientListItem[]> {
  await requireStaff();
  const filter = parseDirectoryFilter(options.filter);

  return prisma.client.findMany({
    where: directoryWhere(options.query ?? "", filter),
    orderBy: [{ displayName: "asc" }],
    select: {
      id: true,
      displayName: true,
      email: true,
      phone: true,
      status: true,
      lastContactedAt: true,
      updatedAt: true,
      portalUser: { select: { email: true } },
    },
  });
}

export async function getClientForStaff(id: string) {
  await requireStaff();

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      portalUser: {
        select: { id: true, email: true, name: true },
      },
      notes: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { name: true } },
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  return client;
}

export async function listLinkablePortalUsers(currentClientId?: string) {
  await requireStaff();

  return prisma.user.findMany({
    where: {
      role: "client",
      status: "active",
      OR: currentClientId
        ? [{ clientRecord: null }, { clientRecord: { id: currentClientId } }]
        : [{ clientRecord: null }],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });
}

export async function getOwnClientRecord() {
  const user = await requireClient();

  return prisma.client.findUnique({
    where: { portalUserId: user.id },
    select: {
      id: true,
      displayName: true,
      email: true,
      phone: true,
      styleNotes: true,
      status: true,
    },
  });
}

