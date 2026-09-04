import Link from "next/link";
import { notFound } from "next/navigation";

import { CollectionForm } from "@/components/designs/collection-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireCreative } from "@/lib/auth/access";
import { designCategoryLabel, designImageSrc, designStatusLabel } from "@/lib/designs/format";
import { getCollectionForStaff } from "@/lib/designs/queries";

export const metadata = {
  title: "Collection",
};

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCreative();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const collection = await getCollectionForStaff(id);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10">
      <div>
        <Link
          href="/app/collections"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Collections
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          {collection.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {collection.season || "No season set"}
        </p>
      </div>

      <CollectionForm
        collection={{
          id: collection.id,
          name: collection.name,
          season: collection.season ?? "",
          status: collection.status,
          notes: collection.notes ?? "",
        }}
      />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-medium">Designs in this collection</h2>
        {collection.designs.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No designs attached yet. Assign them from a design workspace.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {collection.designs.map((design) => {
              const cover = design.images[0];
              return (
                <li key={design.id}>
                  <Link href={`/app/designs/${design.id}`} className="block">
                    <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          {cover ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={designImageSrc(cover.id)}
                              alt=""
                              className="size-14 rounded-md object-cover"
                            />
                          ) : null}
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-xl">{design.title}</CardTitle>
                              <Badge variant="outline">
                                {designStatusLabel(design.status)}
                              </Badge>
                            </div>
                            <CardDescription>{designCategoryLabel(design.category)}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
