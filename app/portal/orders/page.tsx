import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireClient } from "@/lib/auth/access";
import { formatHouseDate } from "@/lib/clients/format";
import { orderStatusClientLabel } from "@/lib/orders/format";
import { listOwnOrdersForPortal } from "@/lib/orders/queries";

export const metadata = {
  title: "Your orders",
};

export default async function PortalOrdersPage() {
  await requireClient();
  const orders = await listOwnOrdersForPortal();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Client portal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Your orders
        </h1>
        <p className="mt-3 text-muted-foreground">
          Status for garments Sunnex Clothing is making for you.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No orders yet</CardTitle>
            <CardDescription>
              When the house opens a commission for you, it will appear here.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/portal/orders/${order.id}`} className="block">
                <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{order.title}</CardTitle>
                      <Badge variant="outline">
                        {orderStatusClientLabel(order.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {order.design?.sharedWithClient ? order.design.title : order.reference}
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
