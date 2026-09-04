"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addDocumentLineAction,
  removeDocumentLineAction,
  type BillingFormState,
} from "@/lib/billing/actions";
import { documentLineKindLabel } from "@/lib/billing/format";
import { documentLineKinds } from "@/lib/billing/schemas";
import { formatRupees } from "@/lib/orders/format";

const initialState: BillingFormState = {};

export function AddDocumentLineForm({ documentId }: { documentId: string }) {
  const action = addDocumentLineAction.bind(null, documentId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="kind">Kind</Label>
          <Select id="kind" name="kind" defaultValue="labour">
            {documentLineKinds.map((kind) => (
              <option key={kind} value={kind}>
                {documentLineKindLabel(kind)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" required placeholder="Labour for slim jean" />
          {state.fieldErrors?.description ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.description}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" required defaultValue="1" />
          {state.fieldErrors?.quantity ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.quantity}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="unitAmountInr">Amount (₹)</Label>
          <Input id="unitAmountInr" name="unitAmountInr" required defaultValue="0" />
          {state.fieldErrors?.unitAmountInr ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.unitAmountInr}
            </p>
          ) : null}
        </div>
      </div>
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Adding…" : "Add line"}
      </Button>
    </form>
  );
}

export function RemoveDocumentLineButton({
  documentId,
  lineId,
  description,
  amount,
}: {
  documentId: string;
  lineId: string;
  description: string;
  amount: number;
}) {
  const action = removeDocumentLineAction.bind(null, documentId, lineId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2">
      {state.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="ghost" size="sm" disabled={pending} aria-label={`Remove ${description} (${formatRupees(amount)})`}>
        {pending ? "Removing…" : "Remove"}
      </Button>
    </form>
  );
}
