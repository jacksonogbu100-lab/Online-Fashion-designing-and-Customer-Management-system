"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { changeOrderStatusAction } from "@/lib/orders/actions";
import { orderStatusLabel } from "@/lib/orders/format";
import { orderStatuses, type OrderStatus } from "@/lib/orders/schemas";

export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const action = changeOrderStatusAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Label htmlFor="order-status">Move status</Label>
      <div className="flex flex-wrap items-end gap-2">
        <Select id="order-status" name="status" defaultValue={status} className="sm:w-52">
          {orderStatuses
            .filter((value) => value !== "cancelled")
            .map((value) => (
              <option key={value} value={value}>
                {orderStatusLabel(value)}
              </option>
            ))}
        </Select>
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "Saving…" : "Record status"}
        </Button>
      </div>
    </form>
  );
}
