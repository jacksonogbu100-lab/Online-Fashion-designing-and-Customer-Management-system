"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createCollectionAction,
  updateCollectionAction,
  type CollectionFormState,
} from "@/lib/designs/actions";
import { collectionStatusLabel } from "@/lib/designs/format";
import { collectionStatuses, type CollectionStatus } from "@/lib/designs/schemas";
import { cn } from "@/lib/utils";

const initialState: CollectionFormState = {};

export function CollectionForm({
  collection,
}: {
  collection?: {
    id: string;
    name: string;
    season: string;
    status: CollectionStatus;
    notes: string;
  };
}) {
  const action = collection
    ? updateCollectionAction.bind(null, collection.id)
    : createCollectionAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const cancelHref = collection ? `/app/collections/${collection.id}` : "/app/collections";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Field label="Name" htmlFor="name" error={state.fieldErrors?.name}>
        <Input
          id="name"
          name="name"
          required
          defaultValue={collection?.name}
          placeholder="Indigo Edit"
          aria-invalid={state.fieldErrors?.name ? true : undefined}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Season" htmlFor="season" error={state.fieldErrors?.season}>
          <Input
            id="season"
            name="season"
            defaultValue={collection?.season}
            placeholder="Monsoon 2026"
          />
        </Field>
        <Field label="Status" htmlFor="status" error={state.fieldErrors?.status}>
          <Select id="status" name="status" defaultValue={collection?.status ?? "draft"}>
            {collectionStatuses.map((status) => (
              <option key={status} value={status}>
                {collectionStatusLabel(status)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Notes" htmlFor="notes" error={state.fieldErrors?.notes}>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={collection?.notes}
          placeholder="The story of this drop…"
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : collection ? "Save collection" : "Add collection"}
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
