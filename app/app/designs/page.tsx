import Link from "next/link";

import { DesignDirectoryFilters } from "@/components/designs/directory-filters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { isCreativeRole } from "@/lib/auth/roles";
import { designCategoryLabel, designImageKindLabel, designImageSrc, designStatusLabel } from "@/lib/designs/format";
import {
  listDesignsForStaff,
  parseDesignDirectoryFilter,
} from "@/lib/designs/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Designs",
};

export default async function DesignsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireStaff();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filter = parseDesignDirectoryFilter(params.status);
  const designs = await listDesignsForStaff({ query, filter });
  const canEdit = isCreativeRole(user.role);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            Design studio
          </p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
            Designs
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Original pieces for Sunnex Clothing. Staff can read the gallery;
            designers keep the sketches and notes.
          </p>
        </div>
        {canEdit ? (
          <Link href="/app/designs/new" className={cn(buttonVariants())}>
            New design
          </Link>
        ) : null}
      </div>

      <DesignDirectoryFilters query={query} filter={filter} />

      {designs.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No designs yet</CardTitle>
            <CardDescription>
              {canEdit
                ? "Start a concept, then add sketches and construction notes."
                : "Nothing in the gallery matches this filter."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((design) => {
            const cover = design.images[0];
            const kinds = [...new Set(design.images.map((image) => image.kind))];
            return (
              <li key={design.id}>
                <Link href={`/app/designs/${design.id}`} className="block">
                  <Card className="h-full overflow-hidden border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                    {cover ? (
                      <div className="relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={designImageSrc(cover.id)}
                          alt=""
                          className="aspect-[4/5] w-full object-cover"
                        />
                        {kinds.length > 0 ? (
                          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1 bg-gradient-to-t from-black/55 to-transparent p-3">
                            {kinds.map((kind) => (
                              <Badge key={kind} variant="secondary">
                                {designImageKindLabel(kind)}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center bg-muted text-sm text-muted-foreground">
                        No image yet
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">{design.title}</CardTitle>
                        <Badge variant="outline">{designStatusLabel(design.status)}</Badge>
                      </div>
                      <CardDescription>
                        {designCategoryLabel(design.category)}
                        {design.collection ? ` · ${design.collection.name}` : ""}
                        {design.client ? ` · ${design.client.displayName}` : ""}
                        {design.images.length > 0
                          ? ` · ${design.images.length} ${design.images.length === 1 ? "image" : "images"}`
                          : ""}
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
