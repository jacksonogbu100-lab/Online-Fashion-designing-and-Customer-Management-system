import Link from "next/link";

import { OrderDirectoryFilters } from "@/components/orders/directory-filters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { formatHouseDate } from "@/lib/clients/format";
import {
  closedColumns,
  formatRupees,
  orderPriorityLabel,
  orderStatusLabel,
  productionColumns,
} from "@/lib/orders/format";
import {
  listOrdersForStaff,
  parseOrderDirectoryFilter,
} from "@/lib/orders/queries";
import type { OrderStatus } from "@/lib/orders/schemas";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Orders",
};

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filter = parseOrderDirectoryFilter(params.status);
  const orders = await listOrdersForStaff({ query, filter });
  const columns: OrderStatus[] =
    filter === "all"
      ? [...productionColumns, ...closedColumns]
      : filter === "open"
        ? productionColumns
        : [filter];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            Production
          </p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
            Orders
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Commissions move from inquiry to delivery here. Every job belongs to a
            client.
          </p>
        </div>
        <Link href="/app/orders/new" className={cn(buttonVariants())}>
          New order
        </Link>
      </div>

      <OrderDirectoryFilters query={query} filter={filter} />

      {orders.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No orders in this view</CardTitle>
            <CardDescription>
              Open a commission from a client profile or a design, or clear the filter.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {columns.map((status) => {
            const columnOrders = orders.filter((order) => order.status === status);
            return (
              <section
                key={status}
                className="flex w-64 shrink-0 flex-col gap-3"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                    {orderStatusLabel(status)}
                  </h2>
                  <span className="text-xs text-muted-foreground">{columnOrders.length}</span>
                </div>
                {columnOrders.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 px-3 py-4 text-sm text-muted-foreground">
                    Empty
                  </p>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {columnOrders.map((order) => (
                      <li key={order.id}>
                        <Link href={`/app/orders/${order.id}`} className="block">
                          <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                            <CardHeader className="gap-1">
                              <p className="text-xs text-muted-foreground">{order.reference}</p>
                              <CardTitle className="text-base">{order.title}</CardTitle>
                              <CardDescription>
                                {order.client.displayName}
                                {order.design ? ` · ${order.design.title}` : ""}
                              </CardDescription>
                              <div className="flex flex-wrap items-center gap-1 pt-1">
                                {order.priority !== "normal" ? (
                                  <Badge
                                    variant={
                                      order.priority === "rush" ? "destructive" : "outline"
                                    }
                                  >
                                    {orderPriorityLabel(order.priority)}
                                  </Badge>
                                ) : null}
                                <span className="text-xs text-muted-foreground">
                                  Due {formatHouseDate(order.dueAt)}
                                  {order.priceEstimateInr != null
                                    ? ` · ${formatRupees(order.priceEstimateInr)}`
                                    : ""}
                                </span>
                              </div>
                            </CardHeader>
                          </Card>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
