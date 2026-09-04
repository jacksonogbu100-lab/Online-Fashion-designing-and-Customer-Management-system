"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createMaterialAction,
  updateMaterialAction,
  type MaterialFormState,
} from "@/lib/materials/actions";
import { materialKindLabel, materialUnitLabel, toQuantityInput } from "@/lib/materials/format";
import {
  materialKinds,
  materialUnits,
  type MaterialKind,
  type MaterialUnit,
} from "@/lib/materials/schemas";
import { cn } from "@/lib/utils";

const initialState: MaterialFormState = {};

export function MaterialForm({
  material,
}: {
  material?: {
    id: string;
    name: string;
    kind: MaterialKind;
    color: string;
    quantity: string;
    unit: MaterialUnit;
    supplier: string;
    lowStockAt: string;
    notes: string;
  };
}) {
  const action = material ? updateMaterialAction.bind(null, material.id) : createMaterialAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const cancelHref = material ? `/app/materials/${material.id}` : "/app/materials";

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
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
          defaultValue={material?.name}
          placeholder="11 oz stretch denim"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kind" htmlFor="kind">
          <Select id="kind" name="kind" defaultValue={material?.kind ?? "fabric"}>
            {materialKinds.map((kind) => (
              <option key={kind} value={kind}>
                {materialKindLabel(kind)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Colour" htmlFor="color" error={state.fieldErrors?.color}>
          <Input id="color" name="color" defaultValue={material?.color} placeholder="Deep indigo" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="On hand" htmlFor="quantity" error={state.fieldErrors?.quantity}>
          <Input
            id="quantity"
            name="quantity"
            required
            defaultValue={material ? toQuantityInput(material.quantity) : "0"}
          />
        </Field>
        <Field label="Unit" htmlFor="unit">
          <Select id="unit" name="unit" defaultValue={material?.unit ?? "metres"}>
            {materialUnits.map((unit) => (
              <option key={unit} value={unit}>
                {materialUnitLabel(unit)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Low-stock at" htmlFor="lowStockAt" error={state.fieldErrors?.lowStockAt}>
          <Input
            id="lowStockAt"
            name="lowStockAt"
            required
            defaultValue={material ? toQuantityInput(material.lowStockAt) : "10"}
          />
        </Field>
      </div>

      <Field label="Supplier" htmlFor="supplier" error={state.fieldErrors?.supplier}>
        <Input
          id="supplier"
          name="supplier"
          defaultValue={material?.supplier}
          placeholder="Arvind Mills"
        />
      </Field>

      <Field label="Notes" htmlFor="notes" error={state.fieldErrors?.notes}>
        <Textarea id="notes" name="notes" defaultValue={material?.notes} />
      </Field>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="allowNegative" className="mt-0.5 size-4 accent-primary" />
        <span>Allow on-hand to go below zero. You will still see a warning if it does.</span>
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : material ? "Save material" : "Add material"}
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
