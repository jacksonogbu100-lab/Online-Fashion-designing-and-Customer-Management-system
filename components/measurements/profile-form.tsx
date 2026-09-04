"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  MEASUREMENT_GROUPS,
  MEASUREMENT_UNIT,
  fieldsInGroup,
} from "@/lib/measurements/fields";
import {
  createMeasurementProfileAction,
  updateMeasurementProfileAction,
  type MeasurementFormState,
} from "@/lib/measurements/actions";
import { suggestedFittingLabel, todayInputValue } from "@/lib/measurements/format";
import type { MeasurementValues } from "@/lib/measurements/parse";
import { valueInput } from "@/lib/measurements/parse";
import { cn } from "@/lib/utils";

const initialState: MeasurementFormState = {};

export function MeasurementProfileForm({
  clientId,
  profileId,
  defaults,
}: {
  clientId: string;
  profileId?: string;
  defaults?: {
    label: string;
    recordedAt: string;
    notes: string;
    values: MeasurementValues;
  };
}) {
  const action = profileId
    ? updateMeasurementProfileAction.bind(null, clientId, profileId)
    : createMeasurementProfileAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const cancelHref = profileId
    ? `/app/clients/${clientId}/measurements/${profileId}`
    : `/app/clients/${clientId}/measurements`;

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-8">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Label" htmlFor="label" error={state.fieldErrors?.label}>
          <Input
            id="label"
            name="label"
            required
            placeholder={suggestedFittingLabel()}
            defaultValue={defaults?.label || (!profileId ? suggestedFittingLabel() : undefined)}
            aria-invalid={state.fieldErrors?.label ? true : undefined}
          />
        </Field>
        <Field label="Recorded" htmlFor="recordedAt" error={state.fieldErrors?.recordedAt}>
          <Input
            id="recordedAt"
            name="recordedAt"
            type="date"
            required
            defaultValue={defaults?.recordedAt ?? todayInputValue()}
            aria-invalid={state.fieldErrors?.recordedAt ? true : undefined}
          />
        </Field>
      </div>

      <div className="flex flex-col gap-8">
        <div>
          <h2 className="font-heading text-xl font-medium">Tape chart</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave a field blank if it was not taken. Figures are in {MEASUREMENT_UNIT}.
          </p>
        </div>
        {MEASUREMENT_GROUPS.map((group) => (
          <fieldset key={group.id} className="flex flex-col gap-4">
            <legend className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
              {group.label}
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {fieldsInGroup(group.id).map((field) => (
                <Field
                  key={field.key}
                  label={field.label}
                  htmlFor={field.key}
                  hint={field.hint}
                  error={state.fieldErrors?.[field.key]}
                >
                  <Input
                    id={field.key}
                    name={field.key}
                    type="number"
                    inputMode="decimal"
                    min="0.1"
                    max="399.9"
                    step="0.1"
                    defaultValue={valueInput(defaults?.values ?? {}, field.key)}
                    aria-invalid={state.fieldErrors?.[field.key] ? true : undefined}
                  />
                </Field>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <Field label="Notes" htmlFor="notes" error={state.fieldErrors?.notes}>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={defaults?.notes}
          placeholder="Posture, ease, or which side is fuller…"
        />
      </Field>

      {profileId ? (
        <p className="text-sm text-muted-foreground">
          Saving corrects this record. For a new fitting date, add another
          profile so the history stays intact.
        </p>
      ) : (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="makeCurrent"
            defaultChecked
            className="size-4 accent-primary"
          />
          Mark as the current profile for the workroom
        </label>
      )}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : profileId ? "Save profile" : "Add profile"}
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
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
