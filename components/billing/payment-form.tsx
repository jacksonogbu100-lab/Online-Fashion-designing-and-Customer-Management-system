"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { recordPaymentAction, type BillingFormState } from "@/lib/billing/actions";
import { paymentMethodLabel } from "@/lib/billing/format";
import { paymentMethods } from "@/lib/billing/schemas";
import { todayInputValue } from "@/lib/measurements/format";

const initialState: BillingFormState = {};

export function PaymentForm({ documentId }: { documentId: string }) {
  const action = recordPaymentAction.bind(null, documentId);
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
          <Label htmlFor="amountInr">Amount (₹)</Label>
          <Input id="amountInr" name="amountInr" required placeholder="10000" />
          {state.fieldErrors?.amountInr ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.amountInr}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="method">Method</Label>
          <Select id="method" name="method" defaultValue="cash">
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {paymentMethodLabel(method)}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="receivedAt">Received</Label>
          <Input id="receivedAt" name="receivedAt" type="date" required defaultValue={todayInputValue()} />
          {state.fieldErrors?.receivedAt ? (
            <p className="text-xs text-destructive" role="alert">
              {state.fieldErrors.receivedAt}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="notes">Note</Label>
          <Input id="notes" name="notes" placeholder="Studio till, UPI ref…" />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="overpayNote">Overpay note</Label>
        <Textarea
          id="overpayNote"
          name="overpayNote"
          placeholder="Required if this payment would take paid above the invoice total."
        />
        {state.fieldErrors?.overpayNote ? (
          <p className="text-xs text-destructive" role="alert">
            {state.fieldErrors.overpayNote}
          </p>
        ) : null}
      </div>
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}
