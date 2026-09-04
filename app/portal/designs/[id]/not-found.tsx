import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PortalDesignNotFound() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Design not shared with you
      </h1>
      <p className="text-muted-foreground">
        That piece is not in your portal, or it has not been shared.
      </p>
      <Link href="/portal/designs" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to shared designs
      </Link>
    </div>
  );
}
