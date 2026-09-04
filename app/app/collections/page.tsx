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
import { collectionStatusLabel } from "@/lib/designs/format";
import { listCollectionsForStaff } from "@/lib/designs/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Collections",
};

export default async function CollectionsPage() {
  await requireCreative();
  const collections = await listCollectionsForStaff({ includeArchived: true });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            Design studio
          </p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
            Collections
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Seasonal and thematic groups for Sunnex Clothing designs.
          </p>
        </div>
        <Link href="/app/collections/new" className={cn(buttonVariants())}>
          New collection
        </Link>
      </div>

      {collections.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No collections yet</CardTitle>
            <CardDescription>
              Name a drop, then attach designs from the workspace.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {collections.map((collection) => (
            <li key={collection.id}>
              <Link href={`/app/collections/${collection.id}`} className="block">
                <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{collection.name}</CardTitle>
                      <Badge variant="outline">
                        {collectionStatusLabel(collection.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {collection.season || "No season"}
                      {` · ${collection._count.designs} ${collection._count.designs === 1 ? "design" : "designs"}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
