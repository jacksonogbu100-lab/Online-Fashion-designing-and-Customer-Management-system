import Link from "next/link";
import { notFound } from "next/navigation";

import { MaterialForm } from "@/components/materials/material-form";
import { requireCreative } from "@/lib/auth/access";
import { getMaterialForCreative } from "@/lib/materials/queries";

export const metadata = {
  title: "Edit material",
};

export default async function EditMaterialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCreative();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const material = await getMaterialForCreative(id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href={`/app/materials/${material.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {material.name}
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Edit material
        </h1>
      </div>
      <MaterialForm
        material={{
          id: material.id,
          name: material.name,
          kind: material.kind,
          color: material.color ?? "",
          quantity: material.quantity.toString(),
          unit: material.unit,
          supplier: material.supplier ?? "",
          lowStockAt: material.lowStockAt.toString(),
          notes: material.notes ?? "",
        }}
      />
    </div>
  );
}
