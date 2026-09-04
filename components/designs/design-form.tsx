"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createDesignAction,
  updateDesignAction,
  type DesignFormState,
} from "@/lib/designs/actions";
import { designCategoryLabel, designStatusLabel } from "@/lib/designs/format";
import {
  designCategories,
  designStatuses,
  type DesignCategory,
  type DesignStatus,
} from "@/lib/designs/schemas";
import { cn } from "@/lib/utils";

const initialState: DesignFormState = {};

export function DesignForm({
  design,
  collections,
  clients,
}: {
  design?: {
    id: string;
    title: string;
    description: string;
    category: DesignCategory;
    status: DesignStatus;
    colorNotes: string;
    fabricNotes: string;
    constructionNotes: string;
    collectionId: string;
    clientId: string;
  };
  collections: { id: string; name: string; season: string | null }[];
  clients: { id: string; displayName: string }[];
}) {
  const action = design ? updateDesignAction.bind(null, design.id) : createDesignAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const cancelHref = design ? `/app/designs/${design.id}` : "/app/designs";

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          required
          defaultValue={design?.title}
          placeholder="Slim indigo jean"
          aria-invalid={state.fieldErrors?.title ? true : undefined}
        />
      </Field>

      <Field label="Description" htmlFor="description" error={state.fieldErrors?.description}>
        <Textarea
          id="description"
          name="description"
          defaultValue={design?.description}
          placeholder="The piece, the client, the idea…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" htmlFor="category" error={state.fieldErrors?.category}>
          <Select id="category" name="category" defaultValue={design?.category ?? "jeans"}>
            {designCategories.map((category) => (
              <option key={category} value={category}>
                {designCategoryLabel(category)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="status" error={state.fieldErrors?.status}>
          <Select id="status" name="status" defaultValue={design?.status ?? "concept"}>
            {designStatuses.map((status) => (
              <option key={status} value={status}>
                {designStatusLabel(status)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Collection" htmlFor="collectionId" error={state.fieldErrors?.collectionId}>
          <Select id="collectionId" name="collectionId" defaultValue={design?.collectionId ?? ""}>
            <option value="">No collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
                {collection.season ? ` · ${collection.season}` : ""}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Client" htmlFor="clientId" error={state.fieldErrors?.clientId}>
          <Select id="clientId" name="clientId" defaultValue={design?.clientId ?? ""}>
            <option value="">House piece — not commissioned</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Colour notes" htmlFor="colorNotes" error={state.fieldErrors?.colorNotes}>
        <Textarea
          id="colorNotes"
          name="colorNotes"
          defaultValue={design?.colorNotes}
          placeholder="Indigo, rinse, black…"
        />
      </Field>
      <Field label="Fabric notes" htmlFor="fabricNotes" error={state.fieldErrors?.fabricNotes}>
        <Textarea
          id="fabricNotes"
          name="fabricNotes"
          defaultValue={design?.fabricNotes}
          placeholder="Weight, stretch, mill…"
        />
      </Field>
      <Field
        label="Construction notes"
        htmlFor="constructionNotes"
        error={state.fieldErrors?.constructionNotes}
      >
        <Textarea
          id="constructionNotes"
          name="constructionNotes"
          defaultValue={design?.constructionNotes}
          placeholder="Pockets, rise, hardware…"
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : design ? "Save design" : "Add design"}
        </Button>
        <Link href={cancelHref} className={cn(buttonVariants({ variant: "outline" }))}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
