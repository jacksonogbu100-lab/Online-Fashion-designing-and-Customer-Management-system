"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { cancelOrderAction, reopenOrderAction } from "@/lib/orders/actions";
import type { OrderStatus } from "@/lib/orders/schemas";

export function OrderCancelForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  if (status === "delivered") {
    return (
      <p className="text-sm text-muted-foreground">
        Delivered orders stay in the book. They cannot be cancelled.
      </p>
    );
  }

  if (status === "cancelled") {
    return <ReopenButton orderId={orderId} />;
  }

  return <CancelButton orderId={orderId} />;
}

function CancelButton({ orderId }: { orderId: string }) {
  const action = cancelOrderAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm("Cancel this order? The record and timeline stay in the book.")) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-2"
    >
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="destructive" className="w-fit" disabled={pending}>
        {pending ? "Cancelling…" : "Cancel order"}
      </Button>
    </form>
  );
}

function ReopenButton({ orderId }: { orderId: string }) {
  const action = reopenOrderAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "Reopening…" : "Reopen to inquiry"}
      </Button>
    </form>
  );
}
