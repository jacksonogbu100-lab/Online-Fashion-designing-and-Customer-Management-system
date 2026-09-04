import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteDesignImageButton } from "@/components/designs/delete-image-button";
import { DesignImageUpload } from "@/components/designs/image-upload";
import { DesignShareForm } from "@/components/designs/share-form";
import {
  BomLineLabel,
  DesignBomForm,
  RemoveDesignBomButton,
} from "@/components/materials/design-bom-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { isCreativeRole } from "@/lib/auth/roles";
import { formatHouseDate } from "@/lib/clients/format";
import {
  designCategoryLabel,
  designImageKindLabel,
  designImageSrc,
  designStatusLabel,
} from "@/lib/designs/format";
import { getDesignForStaff } from "@/lib/designs/queries";
import { listDesignMaterials, listMaterialsForSelect } from "@/lib/materials/queries";
import { orderStatusLabel } from "@/lib/orders/format";
import { listOrdersForDesign } from "@/lib/orders/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Design",
};

export default async function DesignWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const design = await getDesignForStaff(id);
  const canEdit = isCreativeRole(user.role);
  const orders = await listOrdersForDesign(design.id);
  const bom = await listDesignMaterials(design.id);
  const catalog = canEdit ? await listMaterialsForSelect() : [];
  const available = catalog.filter(
    (material) => !bom.some((line) => line.materialId === material.id),
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/app/designs"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Designs
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-4xl font-medium tracking-tight">
              {design.title}
            </h1>
            <Badge>{designStatusLabel(design.status)}</Badge>
            <Badge variant="outline">{designCategoryLabel(design.category)}</Badge>
          </div>
          <p className="mt-3 text-muted-foreground">
            {design.collection
              ? `${design.collection.name}${design.collection.season ? ` · ${design.collection.season}` : ""}`
              : "No collection"}
            {design.client ? ` · ${design.client.displayName}` : " · House piece"}
            {` · Updated ${formatHouseDate(design.updatedAt)}`}
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/app/orders/new?designId=${design.id}${design.clientId ? `&clientId=${design.clientId}` : ""}`}
              className={cn(buttonVariants())}
            >
              New order
            </Link>
            <Link
              href={`/app/designs/${design.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit
            </Link>
          </div>
        ) : (
          <Link
            href={`/app/orders/new?designId=${design.id}${design.clientId ? `&clientId=${design.clientId}` : ""}`}
            className={cn(buttonVariants())}
          >
            New order
          </Link>
        )}
      </div>

      {design.description ? (
        <p className="max-w-2xl leading-relaxed text-muted-foreground">{design.description}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <NoteCard title="Colour" body={design.colorNotes} />
        <NoteCard title="Fabric" body={design.fabricNotes} />
        <NoteCard title="Construction" body={design.constructionNotes} />
      </div>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Images</CardTitle>
          <CardDescription>
            Sketches, drapes, and mood for the workroom. Files stay on this machine.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {design.images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No images on this design yet.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2">
              {design.images.map((image) => (
                <li key={image.id} className="flex flex-col gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={designImageSrc(image.id)}
                    alt={image.originalName}
                    className="aspect-[4/5] w-full rounded-lg object-cover ring-1 ring-foreground/10"
                  />
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-muted-foreground">
                      {designImageKindLabel(image.kind)} · {image.originalName}
                    </p>
                    {canEdit ? (
                      <DeleteDesignImageButton designId={design.id} imageId={image.id} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {canEdit ? <DesignImageUpload designId={design.id} /> : null}
        </CardContent>
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Bill of materials</CardTitle>
          <CardDescription>
            {bom.length === 0
              ? "No fabrics or trims on this piece yet."
              : "What one garment of this design needs from the house book."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {bom.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {bom.map((line) => (
                <li
                  key={line.id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  {canEdit ? (
                    <Link
                      href={`/app/materials/${line.material.id}`}
                      className="hover:text-foreground"
                    >
                      <BomLineLabel
                        name={line.material.name}
                        color={line.material.color}
                        quantity={line.quantity?.toString() ?? null}
                        unit={line.material.unit}
                      />
                    </Link>
                  ) : (
                    <BomLineLabel
                      name={line.material.name}
                      color={line.material.color}
                      quantity={line.quantity?.toString() ?? null}
                      unit={line.material.unit}
                    />
                  )}
                  {canEdit ? (
                    <RemoveDesignBomButton designId={design.id} lineId={line.id} />
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {canEdit && available.length > 0 ? (
            <DesignBomForm
              designId={design.id}
              materials={available.map((material) => ({
                id: material.id,
                name: material.name,
                kind: material.kind,
                color: material.color,
                unit: material.unit,
              }))}
            />
          ) : null}
          {canEdit && catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add a fabric or trim in Materials before building this bill.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Client portal</CardTitle>
          <CardDescription>
            {design.sharedWithClient
              ? "Visible to the linked client."
              : "Hidden from the portal until shared."}
          </CardDescription>
        </CardHeader>
        {canEdit ? (
          <CardContent>
            <DesignShareForm
              designId={design.id}
              sharedWithClient={design.sharedWithClient}
              hasClient={Boolean(design.clientId)}
            />
          </CardContent>
        ) : null}
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {orders.length === 0
              ? "No production jobs use this design yet."
              : "Commissions attached to this piece."}
          </CardDescription>
        </CardHeader>
        {orders.length > 0 ? (
          <CardContent>
            <ul className="flex flex-col gap-2">
              {orders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/app/orders/${order.id}`}
                    className="flex flex-wrap items-baseline justify-between gap-2 text-sm hover:text-foreground"
                  >
                    <span>
                      {order.reference} · {order.client.displayName}
                    </span>
                    <span className="text-muted-foreground">
                      {orderStatusLabel(order.status)} · Due {formatHouseDate(order.dueAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        ) : null}
      </Card>

      <p className="text-sm text-muted-foreground">
        Opened by {design.createdBy.name}.
      </p>
    </div>
  );
}

function NoteCard({ title, body }: { title: string; body: string | null }) {
  return (
    <Card className="border-none shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{body || "None yet."}</CardDescription>
      </CardHeader>
    </Card>
  );
}
