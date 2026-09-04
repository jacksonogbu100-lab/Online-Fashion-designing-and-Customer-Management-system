import Link from "next/link";
import { notFound } from "next/navigation";

import { StockAdjustForm } from "@/components/materials/stock-adjust-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCreative } from "@/lib/auth/access";
import {
  formatQuantity,
  isLowStock,
  isNegativeStock,
  materialKindLabel,
} from "@/lib/materials/format";
import { getMaterialForCreative } from "@/lib/materials/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Material",
};

export default async function MaterialDetailPage({
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
  const low = isLowStock(material.quantity, material.lowStockAt);
  const negative = isNegativeStock(material.quantity);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/app/materials"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Materials
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-4xl font-medium tracking-tight">
              {material.name}
            </h1>
            <Badge variant="outline">{materialKindLabel(material.kind)}</Badge>
            {negative ? <Badge variant="destructive">Below zero</Badge> : null}
            {low && !negative ? <Badge variant="destructive">Low stock</Badge> : null}
          </div>
          <p className="mt-3 text-muted-foreground">
            {formatQuantity(material.quantity, material.unit)} on hand
            {material.color ? ` · ${material.color}` : ""}
            {material.supplier ? ` · ${material.supplier}` : ""}
          </p>
        </div>
        <Link
          href={`/app/materials/${material.id}/edit`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Edit
        </Link>
      </div>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Adjust stock</CardTitle>
          <CardDescription>
            Add a positive number after a delivery. Use a minus after a cut. Going below
            zero needs an explicit tick.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StockAdjustForm materialId={material.id} unit={material.unit} />
        </CardContent>
      </Card>

      {material.notes ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{material.notes}</p>
      ) : null}

      {material.designLines.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl font-medium">On designs</h2>
          <ul className="text-sm">
            {material.designLines.map((line) => (
              <li key={line.id}>
                <Link href={`/app/designs/${line.design.id}`} className="hover:text-foreground">
                  {line.design.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {material.orderLines.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="font-heading text-2xl font-medium">On orders</h2>
          <ul className="text-sm">
            {material.orderLines.map((line) => (
              <li key={line.id}>
                <Link href={`/app/orders/${line.order.id}`} className="hover:text-foreground">
                  {line.order.reference} · {line.order.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
