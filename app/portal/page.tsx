import Link from "next/link";

import { MeasurementChart } from "@/components/measurements/measurement-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireClient } from "@/lib/auth/access";
import { formatStudioRange } from "@/lib/appointments/datetime";
import { appointmentTypeLabel } from "@/lib/appointments/format";
import { getOwnClientRecord } from "@/lib/clients/queries";
import { formatHouseDate } from "@/lib/clients/format";
import { getPortalDashboard } from "@/lib/dashboard/queries";
import { designCategoryLabel } from "@/lib/designs/format";
import { getOwnCurrentMeasurementProfile } from "@/lib/measurements/queries";
import { orderStatusClientLabel } from "@/lib/orders/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Portal",
};

export default async function PortalHomePage() {
  const user = await requireClient();
  const record = await getOwnClientRecord();
  const dashboard = await getPortalDashboard();
  const currentFit = record ? await getOwnCurrentMeasurementProfile() : null;

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Client portal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Hello, {user.name}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Your next sitting, shared designs, and garment status from Sunnex Clothing.
        </p>
      </div>

      {!dashboard.hasFile ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No house file yet</CardTitle>
            <CardDescription>
              You can sign in, but Sunnex Clothing has not attached a client record to this
              login. You cannot see anyone else’s file.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <Card className="border-none shadow-none ring-foreground/8">
            <CardHeader>
              <CardTitle>Next sitting</CardTitle>
              <CardDescription>
                {dashboard.nextSitting
                  ? `${appointmentTypeLabel(dashboard.nextSitting.type)} with ${dashboard.nextSitting.staff.name}`
                  : "No sitting is booked yet. The house will add one when you need to come in."}
              </CardDescription>
            </CardHeader>
            {dashboard.nextSitting ? (
              <CardContent className="text-sm">
                <Link
                  href={`/portal/appointments/${dashboard.nextSitting.id}`}
                  className="hover:text-foreground"
                >
                  {formatStudioRange(dashboard.nextSitting.startsAt, dashboard.nextSitting.endsAt)}
                  {` · ${dashboard.nextSitting.location}`}
                  {dashboard.nextSitting.order ? ` · ${dashboard.nextSitting.order.title}` : ""}
                </Link>
              </CardContent>
            ) : null}
          </Card>

          <Card className="border-none shadow-none ring-foreground/8">
            <CardHeader>
              <CardTitle>Shared designs</CardTitle>
              <CardDescription>
                {dashboard.sharedDesigns.length === 0
                  ? "Nothing has been shared with you yet. When the house shares a piece, it appears here."
                  : "Only pieces Sunnex Clothing has shared with you."}
              </CardDescription>
            </CardHeader>
            {dashboard.sharedDesigns.length > 0 ? (
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {dashboard.sharedDesigns.map((design) => (
                    <li key={design.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <Link href={`/portal/designs/${design.id}`} className="hover:text-foreground">
                        {design.title}
                      </Link>
                      <span className="text-muted-foreground">
                        {designCategoryLabel(design.category)}
                        {design.collection ? ` · ${design.collection.name}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            ) : null}
          </Card>

          <Card className="border-none shadow-none ring-foreground/8">
            <CardHeader>
              <CardTitle>Order status</CardTitle>
              <CardDescription>
                {dashboard.orders.length === 0
                  ? "No garments are in progress. When the house opens a commission, it will show here."
                  : "Status for garments Sunnex Clothing is making for you."}
              </CardDescription>
            </CardHeader>
            {dashboard.orders.length > 0 ? (
              <CardContent>
                <ul className="flex flex-col gap-3">
                  {dashboard.orders.map((order) => (
                    <li key={order.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      <Link href={`/portal/orders/${order.id}`} className="hover:text-foreground">
                        {order.title}
                      </Link>
                      <span className="text-muted-foreground">
                        {orderStatusClientLabel(order.status)}
                        {` · Due ${formatHouseDate(order.dueAt)}`}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            ) : null}
          </Card>

          {record ? (
            <Card className="border-none shadow-none ring-foreground/8">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle>Your file</CardTitle>
                  {currentFit ? <Badge variant="outline">{currentFit.label}</Badge> : null}
                </div>
                <CardDescription>
                  {currentFit
                    ? `Current tape · ${formatHouseDate(currentFit.recordedAt)}`
                    : "Sunnex Clothing has not recorded a current tape chart yet."}
                </CardDescription>
              </CardHeader>
              {currentFit ? (
                <CardContent>
                  <MeasurementChart values={currentFit.values} notes={currentFit.notes} />
                </CardContent>
              ) : null}
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
