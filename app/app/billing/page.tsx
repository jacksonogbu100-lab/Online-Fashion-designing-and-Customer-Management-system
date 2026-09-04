import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import {
  documentKindLabel,
  documentStatusLabel,
} from "@/lib/billing/format";
import { listDocumentsForStaff } from "@/lib/billing/queries";
import { formatRupees } from "@/lib/orders/format";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Billing",
};

export default async function BillingPage() {
  await requireStaff();
  const documents = await listDocumentsForStaff();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            House ops
          </p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
            Billing
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Quotes, invoices, and recorded payments. Confirmed orders can be quoted, then invoiced.
          </p>
        </div>
        <Link href="/app/billing/new" className={cn(buttonVariants())}>
          New quote
        </Link>
      </div>

      {documents.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No documents yet</CardTitle>
            <CardDescription>
              Start a quote from a confirmed order. Inquiry jobs stay on the production board until they are confirmed.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Link href={`/app/billing/${document.id}`} className="block">
                <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{document.reference}</CardTitle>
                      <Badge variant="outline">{documentKindLabel(document.kind)}</Badge>
                      <Badge variant={document.status === "void" ? "destructive" : "default"}>
                        {documentStatusLabel(document.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {document.order.client.displayName}
                      {` · ${document.order.reference} ${document.order.title}`}
                      {` · ${formatRupees(document.totals.total)}`}
                      {document.kind === "invoice"
                        ? ` · remaining ${formatRupees(document.totals.remaining)}`
                        : ""}
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
