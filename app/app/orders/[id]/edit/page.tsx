import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderForm } from "@/components/orders/order-form";
import { requireStaff } from "@/lib/auth/access";
import { toDateInputValue } from "@/lib/measurements/format";
import {
  getOrderForStaff,
  listClientsForOrderForm,
  listDesignsForOrderForm,
  listMeasurementProfilesForOrderForm,
} from "@/lib/orders/queries";

export const metadata = {
  title: "Edit order",
};

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const order = await getOrderForStaff(id);
  const [clients, designs, profiles] = await Promise.all([
    listClientsForOrderForm(order.clientId),
    listDesignsForOrderForm(order.clientId),
    listMeasurementProfilesForOrderForm(order.clientId),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href={`/app/orders/${order.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {order.reference}
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Edit order
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {order.client.displayName}. The client on an order does not change.
        </p>
      </div>
      {order.status === "cancelled" ? (
        <p className="text-sm text-muted-foreground">
          Reopen this order before editing it.
        </p>
      ) : (
        <OrderForm
          order={{
            id: order.id,
            title: order.title,
            clientId: order.clientId,
            designId: order.designId ?? "",
            measurementProfileId: order.measurementProfileId ?? "",
            dueAt: order.dueAt ? toDateInputValue(order.dueAt) : "",
            priceEstimateInr:
              order.priceEstimateInr != null ? String(order.priceEstimateInr) : "",
            priority: order.priority,
            notes: order.notes ?? "",
          }}
          clients={clients}
          designs={designs}
          profiles={profiles}
        />
      )}
    </div>
  );
}
