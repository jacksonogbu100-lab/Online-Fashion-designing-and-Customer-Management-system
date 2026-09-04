"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireStaff } from "@/lib/auth/access";
import {
  clientNoteSchema,
  clientWriteSchema,
  emptyToNull,
} from "@/lib/clients/schemas";
import { prisma } from "@/lib/db";

export type ClientFormState = {
  error?: string;
  fieldErrors?: {
    displayName?: string;
    email?: string;
  };
};

export type NoteFormState = {
  error?: string;
};

function readClientForm(formData: FormData) {
  return clientWriteSchema.safeParse({
    displayName: formData.get("displayName") ?? "",
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    addressLine1: formData.get("addressLine1") ?? "",
    city: formData.get("city") ?? "",
    region: formData.get("region") ?? "",
    postalCode: formData.get("postalCode") ?? "",
    country: formData.get("country") ?? "",
    styleNotes: formData.get("styleNotes") ?? "",
    status: formData.get("status") ?? "lead",
    portalUserId: formData.get("portalUserId") ?? "",
  });
}

function fieldErrorsFromZod(error: z.ZodError): ClientFormState["fieldErrors"] {
  const fieldErrors: ClientFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "displayName" && !fieldErrors.displayName) {
      fieldErrors.displayName = issue.message;
    }
    if (key === "email" && !fieldErrors.email) {
      fieldErrors.email = issue.message;
    }
  }
  return fieldErrors;
}

async function resolvePortalUserId(
  rawId: string,
  currentClientId?: string,
): Promise<{ portalUserId: string | null; error?: string }> {
  const portalUserId = emptyToNull(rawId);
  if (!portalUserId) {
    return { portalUserId: null };
  }

  const portalUser = await prisma.user.findUnique({
    where: { id: portalUserId },
    select: {
      id: true,
      role: true,
      status: true,
      clientRecord: { select: { id: true } },
    },
  });

  if (!portalUser || portalUser.role !== "client" || portalUser.status !== "active") {
    return { portalUserId: null, error: "Choose an active client login, or none." };
  }

  if (portalUser.clientRecord && portalUser.clientRecord.id !== currentClientId) {
    return {
      portalUserId: null,
      error: "That login is already linked to another client.",
    };
  }

  return { portalUserId: portalUser.id };
}

function toClientData(
  input: z.infer<typeof clientWriteSchema>,
  portalUserId: string | null,
): { error: string } | { data: Prisma.ClientUncheckedCreateInput } {
  const email = emptyToNull(input.email);
  if (email && !z.email().safeParse(email).success) {
    return { error: "Enter a valid email." };
  }

  return {
    data: {
      displayName: input.displayName,
      email,
      phone: emptyToNull(input.phone),
      addressLine1: emptyToNull(input.addressLine1),
      city: emptyToNull(input.city),
      region: emptyToNull(input.region),
      postalCode: emptyToNull(input.postalCode),
      country: emptyToNull(input.country),
      styleNotes: emptyToNull(input.styleNotes),
      status: input.status,
      portalUserId,
    },
  };
}

function uniqueConstraintMessage(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  const fields = Array.isArray(target) ? target.join(",") : String(target ?? "");
  if (fields.includes("email")) {
    return "A client with that email already exists.";
  }
  if (fields.includes("portalUserId")) {
    return "That login is already linked to another client.";
  }
  return "Could not save this client.";
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireStaff();

  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const portal = await resolvePortalUserId(parsed.data.portalUserId);
  if (portal.error) {
    return { error: portal.error };
  }

  const prepared = toClientData(parsed.data, portal.portalUserId);
  if ("error" in prepared) {
    return { error: prepared.error, fieldErrors: { email: prepared.error } };
  }

  try {
    const client = await prisma.client.create({ data: prepared.data });
    revalidatePath("/app/clients");
    redirect(`/app/clients/${client.id}`);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: uniqueConstraintMessage(error) };
    }
    throw error;
  }
}

export async function updateClientAction(
  clientId: string,
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  await requireStaff();

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "This client is no longer in the house book." };
  }

  const parsed = readClientForm(formData);
  if (!parsed.success) {
    return {
      error: "Check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const portal = await resolvePortalUserId(parsed.data.portalUserId, clientId);
  if (portal.error) {
    return { error: portal.error };
  }

  const prepared = toClientData(parsed.data, portal.portalUserId);
  if ("error" in prepared) {
    return { error: prepared.error, fieldErrors: { email: prepared.error } };
  }

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: prepared.data,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: uniqueConstraintMessage(error) };
    }
    throw error;
  }

  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${clientId}`);
  redirect(`/app/clients/${clientId}`);
}

export async function archiveClientAction(clientId: string) {
  await requireStaff();
  await prisma.client.updateMany({
    where: { id: clientId },
    data: { status: "archived" },
  });
  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${clientId}`);
}

export async function restoreClientAction(clientId: string) {
  await requireStaff();
  await prisma.client.updateMany({
    where: { id: clientId },
    data: { status: "active" },
  });
  revalidatePath("/app/clients");
  revalidatePath(`/app/clients/${clientId}`);
}

export async function addClientNoteAction(
  clientId: string,
  _prev: NoteFormState,
  formData: FormData,
): Promise<NoteFormState> {
  const staff = await requireStaff();

  const parsed = clientNoteSchema.safeParse({
    body: formData.get("body") ?? "",
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Write a note.",
    };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) {
    return { error: "This client is no longer in the house book." };
  }

  await prisma.clientNote.create({
    data: {
      clientId,
      authorId: staff.id,
      body: parsed.data.body,
    },
  });

  await prisma.client.update({
    where: { id: clientId },
    data: { lastContactedAt: new Date() },
  });

  revalidatePath(`/app/clients/${clientId}`);
  revalidatePath("/app/clients");
  redirect(`/app/clients/${clientId}`);
}
