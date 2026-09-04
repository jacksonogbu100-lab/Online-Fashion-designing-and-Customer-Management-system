"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  addOrderMaterialAction,
  allocateOrderMaterialAction,
  copyDesignBomToOrderAction,
  removeOrderMaterialAction,
} from "@/lib/materials/actions";
import { formatQuantity, isLowStock, materialKindLabel } from "@/lib/materials/format";
import type { MaterialKind, MaterialUnit } from "@/lib/materials/schemas";

export function OrderMaterialForm({
  orderId,
  materials,
}: {
  orderId: string;
  materials: {
    id: string;
    name: string;
    kind: MaterialKind;
    color: string | null;
    quantity: string;
    unit: MaterialUnit;
    lowStockAt: string;
  }[];
}) {
  const action = addOrderMaterialAction.bind(null, orderId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Label htmlFor="order-material">Required for this job</Label>
      <Select id="order-material" name="materialId" required>
        <option value="">Choose a material</option>
        {materials.map((material) => (
          <option key={material.id} value={material.id}>
            {material.name}
            {material.color ? ` · ${material.color}` : ""}
            {` · ${formatQuantity(material.quantity, material.unit)} on hand`}
            {isLowStock(material.quantity, material.lowStockAt) ? " · low" : ""}
          </option>
        ))}
      </Select>
      <Input name="quantityNeeded" required placeholder="Quantity needed" />
      <Button type="submit" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Add to order"}
      </Button>
    </form>
  );
}

export function CopyBomButton({ orderId, hasDesign }: { orderId: string; hasDesign: boolean }) {
  const [state, formAction, pending] = useActionState(
    copyDesignBomToOrderAction.bind(null, orderId),
    {},
  );

  if (!hasDesign) {
    return (
      <p className="text-sm text-muted-foreground">
        Attach a design to copy its bill of materials.
      </p>
    );
  }

  return (
    <form action={formAction}>
      {state.error ? (
        <p className="mb-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Copying…" : "Copy from design"}
      </Button>
    </form>
  );
}

export function AllocateMaterialButton({
  orderId,
  lineId,
  remaining,
  unit,
}: {
  orderId: string;
  lineId: string;
  remaining: string;
  unit: MaterialUnit;
}) {
  const action = allocateOrderMaterialAction.bind(null, orderId, lineId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.warning && !state.error ? (
        <p className="text-xs text-muted-foreground">{state.warning}</p>
      ) : null}
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" name="allowNegative" className="mt-0.5 size-4 accent-primary" />
        <span>Allow stock below zero</span>
      </label>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "Allocating…" : `Allocate ${remaining} ${unit}`}
      </Button>
    </form>
  );
}

export function RemoveOrderMaterialButton({
  orderId,
  lineId,
}: {
  orderId: string;
  lineId: string;
}) {
  return (
    <form action={removeOrderMaterialAction.bind(null, orderId, lineId)}>
      <Button type="submit" variant="ghost" size="sm">
        Remove
      </Button>
    </form>
  );
}

export function OrderMaterialKind({ kind }: { kind: MaterialKind }) {
  return materialKindLabel(kind);
}
