import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireClient } from "@/lib/auth/access";
import { documentStatusClientLabel } from "@/lib/billing/format";
import { listOwnInvoicesForPortal } from "@/lib/billing/queries";
import { formatRupees } from "@/lib/orders/format";

export const metadata = {
  title: "Your invoices",
};

export default async function PortalBillingPage() {
  await requireClient();
  const invoices = await listOwnInvoicesForPortal();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Client portal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Your invoices
        </h1>
        <p className="mt-3 text-muted-foreground">
          Invoices Sunnex Clothing has sent for your garments.
        </p>
      </div>

      {invoices.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No invoices yet</CardTitle>
            <CardDescription>
              When the house sends an invoice for your order, it will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {invoices.map((invoice) => (
            <li key={invoice.id}>
              <Link href={`/portal/billing/${invoice.id}`} className="block">
                <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{invoice.reference}</CardTitle>
                      <Badge variant={invoice.status === "void" ? "destructive" : "outline"}>
                        {invoice.status === "draft"
                          ? "Sent"
                          : documentStatusClientLabel(invoice.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {invoice.order.title}
                      {` · ${formatRupees(invoice.totals.total)}`}
                      {invoice.status !== "void"
                        ? ` · remaining ${formatRupees(invoice.totals.remaining)}`
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
