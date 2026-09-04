import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireClient } from "@/lib/auth/access";
import { designCategoryLabel, designImageSrc } from "@/lib/designs/format";
import { listSharedDesignsForPortal } from "@/lib/designs/queries";

export const metadata = {
  title: "Shared designs",
};

export default async function PortalDesignsPage() {
  await requireClient();
  const designs = await listSharedDesignsForPortal();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Client portal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Shared designs
        </h1>
        <p className="mt-3 text-muted-foreground">
          Only pieces Sunnex Clothing has shared with you appear here.
        </p>
      </div>

      {designs.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Nothing shared yet</CardTitle>
            <CardDescription>
              When the house shares a design with you, it will land here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {designs.map((design) => {
            const cover = design.images[0];
            return (
              <li key={design.id}>
                <Link href={`/portal/designs/${design.id}`} className="block">
                  <Card className="h-full overflow-hidden border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                    {cover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={designImageSrc(cover.id)}
                        alt=""
                        className="aspect-[4/5] w-full object-cover"
                      />
                    ) : (
                      <div className="flex aspect-[4/5] items-center justify-center bg-muted text-sm text-muted-foreground">
                        No image yet
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{design.title}</CardTitle>
                      <CardDescription>
                        {designCategoryLabel(design.category)}
                        {design.collection ? ` · ${design.collection.name}` : ""}
                      </CardDescription>
                      <Badge variant="outline" className="w-fit">
                        Shared
                      </Badge>
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
