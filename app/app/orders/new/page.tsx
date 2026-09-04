import Link from "next/link";

import { OrderForm } from "@/components/orders/order-form";
import { requireStaff } from "@/lib/auth/access";
import {
  getOrderFormPrefill,
  listClientsForOrderForm,
  listDesignsForOrderForm,
  listMeasurementProfilesForOrderForm,
} from "@/lib/orders/queries";

export const metadata = {
  title: "New order",
};

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string; designId?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const prefill = await getOrderFormPrefill({
    clientId: params.clientId,
    designId: params.designId,
  });
  const defaultClientId = prefill.design?.clientId ?? prefill.client?.id;
  const [clients, designs, profiles] = await Promise.all([
    listClientsForOrderForm(defaultClientId),
    listDesignsForOrderForm(),
    listMeasurementProfilesForOrderForm(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/app/orders"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Orders
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          New order
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Every commission needs a client. Attach a design and a tape snapshot when
          you have them.
        </p>
      </div>
      <OrderForm
        clients={clients}
        designs={designs}
        profiles={profiles}
        defaults={{
          title: prefill.design?.title,
          clientId: defaultClientId,
          designId: prefill.design?.id,
        }}
      />
    </div>
  );
}
