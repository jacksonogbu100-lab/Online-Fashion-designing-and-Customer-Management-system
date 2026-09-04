import Link from "next/link";

import { MaterialForm } from "@/components/materials/material-form";
import { requireCreative } from "@/lib/auth/access";

export const metadata = {
  title: "Add material",
};

export default async function NewMaterialPage() {
  await requireCreative();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/app/materials"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Materials
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Add material
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Fabric, trim, or lining. Quantity is what the house has on the shelf.
        </p>
      </div>
      <MaterialForm />
    </div>
  );
}
