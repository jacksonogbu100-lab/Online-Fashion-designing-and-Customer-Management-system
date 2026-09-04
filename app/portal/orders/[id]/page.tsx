import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireClient } from "@/lib/auth/access";
import { documentStatusClientLabel } from "@/lib/billing/format";
import { listOwnInvoicesForOrderPortal } from "@/lib/billing/queries";
import { formatHouseDate, formatHouseDateTime } from "@/lib/clients/format";
import { formatRupees, orderEventClientTitle, orderStatusClientLabel } from "@/lib/orders/format";
import { getOwnOrderForPortal } from "@/lib/orders/queries";

export const metadata = {
  title: "Order status",
};

export default async function PortalOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClient();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const order = await getOwnOrderForPortal(id);
  const invoices = await listOwnInvoicesForOrderPortal(order.id);
  const design =
    order.design?.sharedWithClient === true ? order.design : null;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/portal/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Your orders
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-4xl font-medium tracking-tight">
            {order.title}
          </h1>
          <Badge>{orderStatusClientLabel(order.status)}</Badge>
        </div>
        <p className="mt-3 text-muted-foreground">
          Due {formatHouseDate(order.dueAt)}
          {design ? ` · ${design.title}` : ""}
        </p>
      </div>

      {design ? (
        <p className="text-sm">
          <Link
            href={`/portal/designs/${design.id}`}
            className="text-muted-foreground hover:text-foreground"
          >
            View the shared design
          </Link>
        </p>
      ) : null}

      {invoices.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-medium">Invoices</h2>
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
                        {formatRupees(invoice.totals.total)}
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
        </section>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-medium">Status</h2>
        {order.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {order.events.map((event) => (
              <li key={event.id}>
                <Card className="border-none shadow-none ring-foreground/8">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {orderEventClientTitle(event)}
                    </CardTitle>
                    <CardDescription>
                      {formatHouseDateTime(event.createdAt)}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
