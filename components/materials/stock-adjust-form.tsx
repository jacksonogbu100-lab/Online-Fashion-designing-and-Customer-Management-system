"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adjustMaterialStockAction } from "@/lib/materials/actions";
import { materialUnitLabel } from "@/lib/materials/format";
import type { MaterialUnit } from "@/lib/materials/schemas";

export function StockAdjustForm({
  materialId,
  unit,
}: {
  materialId: string;
  unit: MaterialUnit;
}) {
  const action = adjustMaterialStockAction.bind(null, materialId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.warning && !state.error ? (
        <p className="text-sm text-muted-foreground" role="status">
          {state.warning}
        </p>
      ) : null}
      <Label htmlFor="stock-delta">Add or remove ({materialUnitLabel(unit)})</Label>
      <Input
        id="stock-delta"
        name="quantity"
        required
        placeholder="4 or -2"
      />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="allowNegative" className="mt-0.5 size-4 accent-primary" />
        <span>Allow the result to go below zero</span>
      </label>
      <Button type="submit" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Adjust stock"}
      </Button>
    </form>
  );
}
