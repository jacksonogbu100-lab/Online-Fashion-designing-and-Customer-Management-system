"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createQuoteAction, type BillingFormState } from "@/lib/billing/actions";
import { cn } from "@/lib/utils";

const initialState: BillingFormState = {};

export function CreateQuoteForm({
  orders,
  defaultOrderId,
}: {
  orders: { id: string; reference: string; title: string; client: { displayName: string } }[];
  defaultOrderId?: string;
}) {
  const [state, formAction, pending] = useActionState(createQuoteAction, initialState);

  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Confirm an order before quoting. Inquiry and quoted jobs stay on the production board
        until they are confirmed.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-6">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="orderId">Order</Label>
        <Select id="orderId" name="orderId" defaultValue={defaultOrderId ?? orders[0]?.id} required>
          {orders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.reference} · {order.client.displayName} · {order.title}
            </option>
          ))}
        </Select>
        {state.fieldErrors?.orderId ? (
          <p className="text-xs text-destructive" role="alert">
            {state.fieldErrors.orderId}
          </p>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Opening quote…" : "Start quote"}
        </Button>
        <Link href="/app/billing" className={cn(buttonVariants({ variant: "outline" }))}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

export function CreateQuoteButton({ orderId }: { orderId: string }) {
  const [state, formAction, pending] = useActionState(createQuoteAction, initialState);

  return (
    <form action={formAction}>
      <input type="hidden" name="orderId" value={orderId} />
      {state.error ? (
        <p className="mb-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Opening…" : "New quote"}
      </Button>
    </form>
  );
}
