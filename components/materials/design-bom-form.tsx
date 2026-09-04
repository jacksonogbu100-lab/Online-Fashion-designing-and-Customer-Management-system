"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { addDesignMaterialAction, removeDesignMaterialAction } from "@/lib/materials/actions";
import { formatQuantity, materialKindLabel } from "@/lib/materials/format";
import type { MaterialKind, MaterialUnit } from "@/lib/materials/schemas";

export function DesignBomForm({
  designId,
  materials,
}: {
  designId: string;
  materials: {
    id: string;
    name: string;
    kind: MaterialKind;
    color: string | null;
    unit: MaterialUnit;
  }[];
}) {
  const action = addDesignMaterialAction.bind(null, designId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Label htmlFor="bom-material">Add to this piece</Label>
      <Select id="bom-material" name="materialId" required>
        <option value="">Choose a material</option>
        {materials.map((material) => (
          <option key={material.id} value={material.id}>
            {material.name}
            {material.color ? ` · ${material.color}` : ""} · {materialKindLabel(material.kind)}
          </option>
        ))}
      </Select>
      <Input name="quantity" placeholder="Quantity for one garment" />
      <Button type="submit" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Add to bill"}
      </Button>
    </form>
  );
}

export function RemoveDesignBomButton({
  designId,
  lineId,
}: {
  designId: string;
  lineId: string;
}) {
  return (
    <form action={removeDesignMaterialAction.bind(null, designId, lineId)}>
      <Button type="submit" variant="ghost" size="sm">
        Remove
      </Button>
    </form>
  );
}

export function BomLineLabel({
  name,
  color,
  quantity,
  unit,
}: {
  name: string;
  color: string | null;
  quantity: string | null;
  unit: MaterialUnit;
}) {
  return (
    <span>
      {name}
      {color ? ` · ${color}` : ""}
      {quantity ? ` · ${formatQuantity(quantity, unit)}` : ""}
    </span>
  );
}
