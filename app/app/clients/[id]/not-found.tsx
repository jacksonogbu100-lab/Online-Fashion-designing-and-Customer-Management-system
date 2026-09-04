import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ClientNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Client not found
      </h1>
      <p className="text-muted-foreground">
        That record is missing, or the link is no longer valid.
      </p>
      <Link href="/app/clients" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to clients
      </Link>
    </div>
  );
}
