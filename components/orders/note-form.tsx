"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addOrderNoteAction } from "@/lib/orders/actions";

export function OrderNoteForm({ orderId }: { orderId: string }) {
  const action = addOrderNoteAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Label htmlFor="order-note">Workroom note</Label>
      <Textarea
        id="order-note"
        name="body"
        required
        placeholder="Cutting note, fabric hold, next fitting…"
      />
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}
