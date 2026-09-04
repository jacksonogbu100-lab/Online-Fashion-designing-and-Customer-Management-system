import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { formatStudioRange, studioDayRange } from "@/lib/appointments/datetime";
import { appointmentTypeLabel } from "@/lib/appointments/format";
import { formatHouseDate } from "@/lib/clients/format";
import { getStaffDashboard } from "@/lib/dashboard/queries";
import { formatQuantity, isNegativeStock } from "@/lib/materials/format";
import { formatRupees, orderStatusLabel } from "@/lib/orders/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "House",
};

export default async function StaffHomePage() {
  const user = await requireStaff();
  const dashboard = await getStaffDashboard();
  const todayStart = studioDayRange().start;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Staff home
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Today, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Due work, sittings, and unpaid invoices for Sunnex Clothing. Open a card to
          continue it.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Due orders</CardTitle>
            <CardDescription>
              Overdue and due in the next three weeks. Delivered and cancelled jobs stay off this list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.dueOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing is due soon. New commissions appear here once they have a due date.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dashboard.dueOrders.map((order) => {
                  const overdue = order.dueAt ? order.dueAt < todayStart : false;
                  return (
                    <li key={order.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <Link href={`/app/orders/${order.id}`} className="hover:text-foreground">
                        {order.reference} · {order.client.displayName}
                      </Link>
                      <span className="text-muted-foreground">
                        {orderStatusLabel(order.status)}
                        {` · ${overdue ? "Overdue" : "Due"} ${formatHouseDate(order.dueAt)}`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Today’s sittings</CardTitle>
            <CardDescription>Scheduled consultations, measurements, fittings, and pickups in India time.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.todaySittings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No sittings on the book today. Book from a client or order when they need to come in.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dashboard.todaySittings.map((sitting) => (
                  <li key={sitting.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <Link href={`/app/calendar/${sitting.id}`} className="hover:text-foreground">
                      {appointmentTypeLabel(sitting.type)} · {sitting.client.displayName}
                    </Link>
                    <span className="text-muted-foreground">
                      {formatStudioRange(sitting.startsAt, sitting.endsAt)} · {sitting.staff.name}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Unpaid invoices</CardTitle>
            <CardDescription>Sent invoices that still have a balance.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.unpaidInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No open invoices. Send an invoice from billing after a confirmed order is quoted.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {dashboard.unpaidInvoices.map((invoice) => (
                  <li key={invoice.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                    <Link href={`/app/billing/${invoice.id}`} className="hover:text-foreground">
                      {invoice.reference} · {invoice.order.client.displayName}
                    </Link>
                    <span className="text-muted-foreground">
                      {formatRupees(invoice.totals.remaining)} remaining
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {dashboard.showLowStock ? (
          <Card className="border-none shadow-none ring-foreground/8">
            <CardHeader>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Fabrics and trims at or below the cut point.</CardDescription>
            </CardHeader>
            <CardContent>
              {dashboard.lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Stock is above the cut points. Add a fabric to the house book if a new mill drop arrives.
                </p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {dashboard.lowStock.map((material) => (
                    <li key={material.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <Link href={`/app/materials/${material.id}`} className="hover:text-foreground">
                        {material.name}
                        {material.color ? ` · ${material.color}` : ""}
                      </Link>
                      <span className="text-muted-foreground">
                        {formatQuantity(material.quantity, material.unit)}
                        {isNegativeStock(material.quantity) ? " · below zero" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
