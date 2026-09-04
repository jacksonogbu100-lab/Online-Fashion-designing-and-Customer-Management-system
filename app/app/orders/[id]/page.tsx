import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentList } from "@/components/appointments/week-calendar";
import { CreateQuoteButton } from "@/components/billing/quote-form";
import {
  AllocateMaterialButton,
  CopyBomButton,
  OrderMaterialForm,
  RemoveOrderMaterialButton,
} from "@/components/materials/order-material-form";
import { MeasurementChart } from "@/components/measurements/measurement-chart";
import { OrderCancelForm } from "@/components/orders/cancel-form";
import { OrderNoteForm } from "@/components/orders/note-form";
import { OrderStatusForm } from "@/components/orders/status-form";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { isCreativeRole } from "@/lib/auth/roles";
import {
  documentKindLabel,
  documentStatusLabel,
  isBillableOrderStatus,
} from "@/lib/billing/format";
import { listDocumentsForOrder } from "@/lib/billing/queries";
import { formatHouseDate, formatHouseDateTime } from "@/lib/clients/format";
import { formatQuantity, isLowStock, toQuantityInput } from "@/lib/materials/format";
import { listMaterialsForSelect, listOrderMaterials } from "@/lib/materials/queries";
import {
  formatRupees,
  isTerminalOrderStatus,
  orderEventTitle,
  orderPriorityLabel,
  orderStatusLabel,
} from "@/lib/orders/format";
import { getOrderForStaff } from "@/lib/orders/queries";
import { listAppointmentsForOrder } from "@/lib/appointments/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Order",
};

export default async function OrderWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const order = await getOrderForStaff(id);
  const appointments = await listAppointmentsForOrder(order.id);
  const materialLines = await listOrderMaterials(order.id);
  const documents = await listDocumentsForOrder(order.id);
  const catalog = await listMaterialsForSelect();
  const availableMaterials = catalog.filter(
    (material) => !materialLines.some((line) => line.materialId === material.id),
  );
  const canEdit = order.status !== "cancelled";
  const canViewCatalog = isCreativeRole(user.role);
  const canQuote = canEdit && isBillableOrderStatus(order.status);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/app/orders"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Orders
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-4xl font-medium tracking-tight">
              {order.title}
            </h1>
            <Badge
              variant={order.status === "cancelled" ? "destructive" : "default"}
            >
              {orderStatusLabel(order.status)}
            </Badge>
            {order.priority !== "normal" ? (
              <Badge variant={order.priority === "rush" ? "destructive" : "outline"}>
                {orderPriorityLabel(order.priority)}
              </Badge>
            ) : null}
          </div>
          <p className="mt-3 text-muted-foreground">
            {order.reference}
            {` · `}
            <Link
              href={`/app/clients/${order.client.id}`}
              className="hover:text-foreground"
            >
              {order.client.displayName}
            </Link>
            {order.design ? (
              <>
                {` · `}
                <Link
                  href={`/app/designs/${order.design.id}`}
                  className="hover:text-foreground"
                >
                  {order.design.title}
                </Link>
              </>
            ) : null}
            {` · Due ${formatHouseDate(order.dueAt)}`}
            {` · ${formatRupees(order.priceEstimateInr)}`}
          </p>
        </div>
        {canEdit ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/app/calendar/new?clientId=${order.client.id}&orderId=${order.id}`}
              className={cn(buttonVariants())}
            >
              Book sitting
            </Link>
            <Link
              href={`/app/orders/${order.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit
            </Link>
          </div>
        ) : (
          <Link
            href={`/app/calendar/new?clientId=${order.client.id}&orderId=${order.id}`}
            className={cn(buttonVariants())}
          >
            Book sitting
          </Link>
        )}
      </div>

      {order.notes ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Workroom notes</CardTitle>
            <CardDescription className="whitespace-pre-wrap">
              {order.notes}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>
              Status changes are recorded on the timeline. Cancelling keeps the
              history.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {order.status !== "cancelled" ? (
              <OrderStatusForm key={order.status} orderId={order.id} status={order.status} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Reopen this order before moving it through the pipeline.
              </p>
            )}
            <OrderCancelForm key={order.status} orderId={order.id} status={order.status} />
          </CardContent>
        </Card>

        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Fit snapshot</CardTitle>
            <CardDescription>
              {order.fitSnapshot
                ? `${order.fitSnapshot.label} · copied ${formatHouseDate(new Date(order.fitSnapshot.recordedAt))}`
                : "No tape was copied onto this order."}
            </CardDescription>
          </CardHeader>
          {order.fitSnapshot ? (
            <CardContent>
              <MeasurementChart
                values={order.fitSnapshot.values}
                notes={order.fitSnapshot.notes}
              />
            </CardContent>
          ) : null}
        </Card>
      </div>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Materials</CardTitle>
          <CardDescription>
            {materialLines.length === 0
              ? "Nothing required on this job yet."
              : "What this garment needs, and how much has been pulled from stock."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {materialLines.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {materialLines.map((line) => {
                const remaining = line.quantityNeeded.minus(line.quantityAllocated);
                const allocated = remaining.lessThanOrEqualTo(0);
                const low = isLowStock(line.material.quantity, line.material.lowStockAt);
                const name = (
                  <>
                    {line.material.name}
                    {line.material.color ? ` · ${line.material.color}` : ""}
                    {low ? " · low stock" : ""}
                  </>
                );
                return (
                  <li key={line.id} className="flex flex-col gap-2 border-b border-foreground/8 pb-4 last:border-none last:pb-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                      {canViewCatalog ? (
                        <Link href={`/app/materials/${line.material.id}`} className="hover:text-foreground">
                          {name}
                        </Link>
                      ) : (
                        <span>{name}</span>
                      )}
                      <span className="text-muted-foreground">
                        Need {formatQuantity(line.quantityNeeded, line.material.unit)}
                        {` · allocated ${formatQuantity(line.quantityAllocated, line.material.unit)}`}
                      </span>
                    </div>
                    {canEdit && !allocated ? (
                      <AllocateMaterialButton
                        orderId={order.id}
                        lineId={line.id}
                        remaining={toQuantityInput(remaining)}
                        unit={line.material.unit}
                      />
                    ) : null}
                    {canEdit && line.quantityAllocated.equals(0) ? (
                      <RemoveOrderMaterialButton orderId={order.id} lineId={line.id} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : null}
          {canEdit ? (
            <div className="flex flex-col gap-4">
              <CopyBomButton orderId={order.id} hasDesign={Boolean(order.designId)} />
              {availableMaterials.length > 0 ? (
                <OrderMaterialForm
                  orderId={order.id}
                  materials={availableMaterials.map((material) => ({
                    id: material.id,
                    name: material.name,
                    kind: material.kind,
                    color: material.color,
                    quantity: material.quantity.toString(),
                    unit: material.unit,
                    lowStockAt: material.lowStockAt.toString(),
                  }))}
                />
              ) : catalog.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ask a designer to add fabrics to the house book first.
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {documents.length === 0
              ? canQuote
                ? "No quotes or invoices on this order yet."
                : "Confirm the order before quoting."
              : "Quotes and invoices for this job."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {documents.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {documents.map((document) => (
                <li key={document.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <Link href={`/app/billing/${document.id}`} className="hover:text-foreground">
                    {document.reference}
                    {` · ${documentKindLabel(document.kind)}`}
                    {` · ${documentStatusLabel(document.status)}`}
                  </Link>
                  <span className="text-muted-foreground">{formatRupees(document.totals.total)}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {canQuote ? <CreateQuoteButton orderId={order.id} /> : null}
        </CardContent>
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Sittings</CardTitle>
          <CardDescription>
            {appointments.length === 0
              ? "No consultations or fittings on this order yet."
              : "Booked against this garment."}
          </CardDescription>
        </CardHeader>
        {appointments.length > 0 ? (
          <CardContent>
            <AppointmentList
              appointments={appointments}
              empty=""
              hrefFor={(appointmentId) => `/app/calendar/${appointmentId}`}
            />
          </CardContent>
        ) : null}
      </Card>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-medium">Timeline</h2>
        {!isTerminalOrderStatus(order.status) ? <OrderNoteForm orderId={order.id} /> : null}
        {order.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {order.events.map((event) => (
              <li key={event.id}>
                <Card className="border-none shadow-none ring-foreground/8">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">
                      {orderEventTitle(event)}
                    </CardTitle>
                    <CardDescription>
                      {event.actor.name} · {formatHouseDateTime(event.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  {event.body ? (
                    <CardContent>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {event.body}
                      </p>
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="text-sm text-muted-foreground">Opened by {order.createdBy.name}.</p>
    </div>
  );
}
