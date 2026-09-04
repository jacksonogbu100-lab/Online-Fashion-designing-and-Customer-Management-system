"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateDocumentMetaAction, type BillingFormState } from "@/lib/billing/actions";
import { taxRateOptions } from "@/lib/billing/schemas";
import { cn } from "@/lib/utils";

const initialState: BillingFormState = {};

export function DocumentMetaForm({
  documentId,
  title,
  notes,
  taxRateBps,
  taxInclusive,
}: {
  documentId: string;
  title: string;
  notes: string;
  taxRateBps: number;
  taxInclusive: boolean;
}) {
  const action = updateDocumentMetaAction.bind(null, documentId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const rateValue = taxRateBps === 1800 ? "1800" : "0";

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={title} />
        {state.fieldErrors?.title ? (
          <p className="text-xs text-destructive" role="alert">
            {state.fieldErrors.title}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="taxRateBps">Tax</Label>
          <Select id="taxRateBps" name="taxRateBps" defaultValue={rateValue}>
            {taxRateOptions.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <label className="flex items-end gap-2 pb-1 text-sm">
          <input
            type="checkbox"
            name="taxInclusive"
            defaultChecked={taxInclusive}
            className="mt-0.5 size-4 accent-primary"
          />
          <span>Amounts include tax</span>
        </label>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">Workroom notes</Label>
        <Textarea id="notes" name="notes" defaultValue={notes} />
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save details"}
        </Button>
        <Link
          href={`/app/billing/${documentId}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Done
        </Link>
      </div>
    </form>
  );
}
