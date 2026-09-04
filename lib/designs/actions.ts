"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireCreative } from "@/lib/auth/access";
import { prisma } from "@/lib/db";
import {
  collectionWriteSchema,
  designImageKinds,
  designWriteSchema,
  emptyToNull,
  type DesignImageKind,
} from "@/lib/designs/schemas";
import { removeDesignImageFile, saveDesignImageFile } from "@/lib/designs/storage";

export type CollectionFormState = {
  error?: string;
  fieldErrors?: {
    name?: string;
    season?: string;
    notes?: string;
    status?: string;
  };
};

export type DesignFormState = {
  error?: string;
  fieldErrors?: {
    title?: string;
    description?: string;
    category?: string;
    status?: string;
    colorNotes?: string;
    fabricNotes?: string;
    constructionNotes?: string;
    collectionId?: string;
    clientId?: string;
  };
};

export type DesignImageFormState = {
  error?: string;
};

function revalidateDesignPaths(designId?: string, clientId?: string | null) {
  revalidatePath("/app");
  revalidatePath("/portal");
  revalidatePath("/app/designs");
  revalidatePath("/app/collections");
  revalidatePath("/portal/designs");
  if (designId) {
    revalidatePath(`/app/designs/${designId}`);
    revalidatePath(`/app/designs/${designId}/edit`);
    revalidatePath(`/portal/designs/${designId}`);
  }
  if (clientId) {
    revalidatePath(`/app/clients/${clientId}`);
  }
}

function collectionFieldErrors(error: z.ZodError): CollectionFormState["fieldErrors"] {
  const fieldErrors: CollectionFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
      fieldErrors[key as keyof typeof fieldErrors] = issue.message;
    }
  }
  return fieldErrors;
}

function designFieldErrors(error: z.ZodError): DesignFormState["fieldErrors"] {
  const fieldErrors: DesignFormState["fieldErrors"] = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !fieldErrors[key as keyof typeof fieldErrors]) {
      fieldErrors[key as keyof typeof fieldErrors] = issue.message;
    }
  }
  return fieldErrors;
}

async function resolveCollectionId(
  rawId: string,
  currentId?: string | null,
): Promise<{ collectionId: string | null; error?: string }> {
  const collectionId = emptyToNull(rawId);
  if (!collectionId) {
    return { collectionId: null };
  }

  const collection = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true, status: true },
  });
  if (!collection) {
    return { collectionId: null, error: "Choose an open collection, or none." };
  }
  if (collection.status === "archived" && collection.id !== currentId) {
    return { collectionId: null, error: "Choose an open collection, or none." };
  }
  return { collectionId: collection.id };
}

async function resolveClientId(rawId: string): Promise<{ clientId: string | null; error?: string }> {
  const clientId = emptyToNull(rawId);
  if (!clientId) {
    return { clientId: null };
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, status: true },
  });
  if (!client) {
    return { clientId: null, error: "Choose a client in the house book, or none." };
  }
  return { clientId: client.id };
}

export async function createCollectionAction(
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireCreative();

  const parsed = collectionWriteSchema.safeParse({
    name: formData.get("name") ?? "",
    season: formData.get("season") ?? "",
    status: formData.get("status") ?? "draft",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: collectionFieldErrors(parsed.error) };
  }

  const collection = await prisma.collection.create({
    data: {
      name: parsed.data.name,
      season: emptyToNull(parsed.data.season),
      status: parsed.data.status,
      notes: emptyToNull(parsed.data.notes),
    },
    select: { id: true },
  });

  revalidatePath("/app/collections");
  revalidatePath("/app/designs");
  redirect(`/app/collections/${collection.id}`);
}

export async function updateCollectionAction(
  collectionId: string,
  _prev: CollectionFormState,
  formData: FormData,
): Promise<CollectionFormState> {
  await requireCreative();

  const existing = await prisma.collection.findUnique({
    where: { id: collectionId },
    select: { id: true },
  });
  if (!existing) {
    return { error: "This collection is no longer in the book." };
  }

  const parsed = collectionWriteSchema.safeParse({
    name: formData.get("name") ?? "",
    season: formData.get("season") ?? "",
    status: formData.get("status") ?? "draft",
    notes: formData.get("notes") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: collectionFieldErrors(parsed.error) };
  }

  await prisma.collection.update({
    where: { id: collectionId },
    data: {
      name: parsed.data.name,
      season: emptyToNull(parsed.data.season),
      status: parsed.data.status,
      notes: emptyToNull(parsed.data.notes),
    },
  });

  revalidatePath("/app/collections");
  revalidatePath(`/app/collections/${collectionId}`);
  revalidatePath("/app/designs");
  redirect(`/app/collections/${collectionId}`);
}

export async function createDesignAction(
  _prev: DesignFormState,
  formData: FormData,
): Promise<DesignFormState> {
  const user = await requireCreative();

  const parsed = designWriteSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "other",
    status: formData.get("status") ?? "concept",
    colorNotes: formData.get("colorNotes") ?? "",
    fabricNotes: formData.get("fabricNotes") ?? "",
    constructionNotes: formData.get("constructionNotes") ?? "",
    collectionId: formData.get("collectionId") ?? "",
    clientId: formData.get("clientId") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: designFieldErrors(parsed.error) };
  }

  const collection = await resolveCollectionId(parsed.data.collectionId);
  if (collection.error) {
    return { error: collection.error, fieldErrors: { collectionId: collection.error } };
  }
  const client = await resolveClientId(parsed.data.clientId);
  if (client.error) {
    return { error: client.error, fieldErrors: { clientId: client.error } };
  }

  const design = await prisma.design.create({
    data: {
      title: parsed.data.title,
      description: emptyToNull(parsed.data.description),
      category: parsed.data.category,
      status: parsed.data.status,
      colorNotes: emptyToNull(parsed.data.colorNotes),
      fabricNotes: emptyToNull(parsed.data.fabricNotes),
      constructionNotes: emptyToNull(parsed.data.constructionNotes),
      collectionId: collection.collectionId,
      clientId: client.clientId,
      createdById: user.id,
      sharedWithClient: false,
    },
    select: { id: true, clientId: true },
  });

  revalidateDesignPaths(design.id, design.clientId);
  redirect(`/app/designs/${design.id}`);
}

export async function updateDesignAction(
  designId: string,
  _prev: DesignFormState,
  formData: FormData,
): Promise<DesignFormState> {
  await requireCreative();

  const existing = await prisma.design.findUnique({
    where: { id: designId },
    select: { id: true, clientId: true, collectionId: true, sharedWithClient: true },
  });
  if (!existing) {
    return { error: "This design is no longer in the book." };
  }

  const parsed = designWriteSchema.safeParse({
    title: formData.get("title") ?? "",
    description: formData.get("description") ?? "",
    category: formData.get("category") ?? "other",
    status: formData.get("status") ?? "concept",
    colorNotes: formData.get("colorNotes") ?? "",
    fabricNotes: formData.get("fabricNotes") ?? "",
    constructionNotes: formData.get("constructionNotes") ?? "",
    collectionId: formData.get("collectionId") ?? "",
    clientId: formData.get("clientId") ?? "",
  });
  if (!parsed.success) {
    return { error: "Check the highlighted fields.", fieldErrors: designFieldErrors(parsed.error) };
  }

  const collection = await resolveCollectionId(parsed.data.collectionId, existing.collectionId);
  if (collection.error) {
    return { error: collection.error, fieldErrors: { collectionId: collection.error } };
  }
  const client = await resolveClientId(parsed.data.clientId);
  if (client.error) {
    return { error: client.error, fieldErrors: { clientId: client.error } };
  }

  const sharedWithClient = Boolean(client.clientId) && existing.sharedWithClient;

  await prisma.design.update({
    where: { id: designId },
    data: {
      title: parsed.data.title,
      description: emptyToNull(parsed.data.description),
      category: parsed.data.category,
      status: parsed.data.status,
      colorNotes: emptyToNull(parsed.data.colorNotes),
      fabricNotes: emptyToNull(parsed.data.fabricNotes),
      constructionNotes: emptyToNull(parsed.data.constructionNotes),
      collectionId: collection.collectionId,
      clientId: client.clientId,
      sharedWithClient,
    },
  });

  revalidateDesignPaths(designId, client.clientId ?? existing.clientId);
  redirect(`/app/designs/${designId}`);
}

export async function setDesignShareAction(
  designId: string,
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  await requireCreative();

  const existing = await prisma.design.findUnique({
    where: { id: designId },
    select: { id: true, clientId: true },
  });
  if (!existing) {
    return { error: "This design is no longer in the book." };
  }
  if (!existing.clientId) {
    return { error: "Link a client before sharing this design." };
  }

  const sharedWithClient = formData.get("sharedWithClient") === "on";
  await prisma.design.update({
    where: { id: designId },
    data: { sharedWithClient },
  });

  revalidateDesignPaths(designId, existing.clientId);
  return {};
}

export async function uploadDesignImageAction(
  designId: string,
  _prev: DesignImageFormState,
  formData: FormData,
): Promise<DesignImageFormState> {
  await requireCreative();

  const design = await prisma.design.findUnique({
    where: { id: designId },
    select: { id: true, clientId: true },
  });
  if (!design) {
    return { error: "This design is no longer in the book." };
  }

  const kindParsed = z.enum(designImageKinds).safeParse(formData.get("kind") ?? "sketch");
  const kind: DesignImageKind = kindParsed.success ? kindParsed.data : "sketch";
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { error: "Choose an image to upload." };
  }

  const maxOrder = await prisma.designImage.aggregate({
    where: { designId },
    _max: { sortOrder: true },
  });

  const image = await prisma.designImage.create({
    data: {
      designId,
      storedName: "pending",
      originalName: file.name.slice(0, 200) || "image",
      mimeType: "application/octet-stream",
      kind,
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
    select: { id: true },
  });

  const saved = await saveDesignImageFile({
    designId,
    imageId: image.id,
    file,
  });

  if ("error" in saved) {
    await prisma.designImage.delete({ where: { id: image.id } });
    return { error: saved.error };
  }

  await prisma.designImage.update({
    where: { id: image.id },
    data: {
      storedName: saved.storedName,
      mimeType: saved.mimeType,
      originalName: file.name.slice(0, 200) || "image",
    },
  });

  revalidateDesignPaths(designId, design.clientId);
  return {};
}

export async function deleteDesignImageAction(designId: string, imageId: string) {
  await requireCreative();

  const image = await prisma.designImage.findFirst({
    where: { id: imageId, designId },
    select: { id: true, storedName: true, design: { select: { clientId: true } } },
  });
  if (!image) {
    return;
  }

  await prisma.designImage.delete({ where: { id: image.id } });
  await removeDesignImageFile(designId, image.storedName);
  revalidateDesignPaths(designId, image.design.clientId);
}
