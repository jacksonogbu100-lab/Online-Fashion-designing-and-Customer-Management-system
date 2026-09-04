import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function CollectionNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Collection not found
      </h1>
      <p className="text-muted-foreground">
        That grouping is missing, or the link is no longer valid.
      </p>
      <Link href="/app/collections" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to collections
      </Link>
    </div>
  );
}
