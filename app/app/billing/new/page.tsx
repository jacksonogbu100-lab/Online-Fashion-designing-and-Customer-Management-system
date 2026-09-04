import Link from "next/link";

import { CreateQuoteForm } from "@/components/billing/quote-form";
import { requireStaff } from "@/lib/auth/access";
import { isBillableOrderStatus } from "@/lib/billing/format";
import { getOrderForQuote, listBillableOrdersForSelect } from "@/lib/billing/queries";

export const metadata = {
  title: "New quote",
};

export default async function NewQuotePage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const orders = await listBillableOrdersForSelect();
  const requested = params.orderId ? await getOrderForQuote(params.orderId) : null;
  const defaultOrderId =
    requested && isBillableOrderStatus(requested.status) ? requested.id : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/app/billing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Billing
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          New quote
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Quotes start from a confirmed order. Send the quote, then convert it to an invoice.
        </p>
      </div>
      {requested && !isBillableOrderStatus(requested.status) ? (
        <p className="text-sm text-destructive">
          {requested.reference} is still {requested.status}. Confirm the order before quoting.
        </p>
      ) : null}
      <CreateQuoteForm orders={orders} defaultOrderId={defaultOrderId} />
    </div>
  );
}
