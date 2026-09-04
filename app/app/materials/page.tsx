import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCreative } from "@/lib/auth/access";
import { formatQuantity, isLowStock, isNegativeStock, materialKindLabel } from "@/lib/materials/format";
import { listMaterialsForCreative } from "@/lib/materials/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Materials",
};

export default async function MaterialsPage() {
  await requireCreative();
  const materials = await listMaterialsForCreative();
  const belowZero = materials.filter((material) => isNegativeStock(material.quantity));
  const low = materials.filter((material) => isLowStock(material.quantity, material.lowStockAt));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            House ops
          </p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
            Materials
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Fabrics, trims, and linings on hand. Low stock is flagged before a cut.
          </p>
        </div>
        <Link href="/app/materials/new" className={cn(buttonVariants())}>
          Add material
        </Link>
      </div>

      {belowZero.length > 0 ? (
        <p className="text-sm text-destructive">
          {belowZero.length === 1 ? "1 material is" : `${belowZero.length} materials are`} below
          zero on hand.
        </p>
      ) : null}
      {low.length > 0 ? (
        <p className="text-sm text-destructive">
          {low.length === 1 ? "1 material is" : `${low.length} materials are`} at or below the
          low-stock point.
        </p>
      ) : null}

      {materials.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No materials yet</CardTitle>
            <CardDescription>Add the first fabric or trim to the house book.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {materials.map((material) => {
            const lowFlag = isLowStock(material.quantity, material.lowStockAt);
            const negative = isNegativeStock(material.quantity);
            return (
              <li key={material.id}>
                <Link href={`/app/materials/${material.id}`} className="block">
                  <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">{material.name}</CardTitle>
                        <Badge variant="outline">{materialKindLabel(material.kind)}</Badge>
                        {negative ? <Badge variant="destructive">Below zero</Badge> : null}
                        {lowFlag && !negative ? <Badge variant="destructive">Low stock</Badge> : null}
                      </div>
                      <CardDescription>
                        {formatQuantity(material.quantity, material.unit)} on hand
                        {material.color ? ` · ${material.color}` : ""}
                        {material.supplier ? ` · ${material.supplier}` : ""}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
