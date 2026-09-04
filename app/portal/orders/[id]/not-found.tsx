import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PortalOrderNotFound() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Order not in your portal
      </h1>
      <p className="text-muted-foreground">
        That job is not yours, or the link is no longer valid.
      </p>
      <Link href="/portal/orders" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to your orders
      </Link>
    </div>
  );
}
