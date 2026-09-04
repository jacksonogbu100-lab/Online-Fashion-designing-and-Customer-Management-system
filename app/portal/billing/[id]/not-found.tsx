import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function PortalInvoiceNotFound() {
  return (
    <div className="flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Invoice not in your portal
      </h1>
      <p className="text-muted-foreground">
        That invoice is not yours, has not been sent, or the link is no longer valid.
      </p>
      <Link href="/portal/billing" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to your invoices
      </Link>
    </div>
  );
}
