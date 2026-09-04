import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientRecordTitle, ClientSubnav } from "@/components/clients/client-subnav";
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
import { getClientForStaff } from "@/lib/clients/queries";
import { orderStatusLabel } from "@/lib/orders/format";
import { listOrdersForClient } from "@/lib/orders/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Client orders",
};

export default async function ClientOrdersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const client = await getClientForStaff(id);
  const orders = await listOrdersForClient(client.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ClientRecordTitle client={client} />
        <Link
          href={`/app/orders/new?clientId=${client.id}`}
          className={cn(buttonVariants())}
        >
          New order
        </Link>
      </div>

      <ClientSubnav clientId={client.id} active="orders" />

      {orders.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
            <CardDescription>
              Open a commission for {client.displayName} from this page.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/app/orders/${order.id}`} className="block">
                <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{order.title}</CardTitle>
                      <Badge variant="outline">{orderStatusLabel(order.status)}</Badge>
                    </div>
                    <CardDescription>
                      {order.reference}
                      {order.design ? ` · ${order.design.title}` : ""}
                      {` · Due ${formatHouseDate(order.dueAt)}`}
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
