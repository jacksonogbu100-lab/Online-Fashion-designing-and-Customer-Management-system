import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentView } from "@/components/billing/document-view";
import { PrintButton } from "@/components/measurements/print-button";
import { requireClient } from "@/lib/auth/access";
import { getOwnInvoiceForPortal } from "@/lib/billing/queries";

export const metadata = {
  title: "Invoice",
};

export default async function PortalInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClient();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const invoice = await getOwnInvoiceForPortal(id);

  return (
    <div className="flex max-w-3xl flex-col gap-8 print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link
          href="/portal/billing"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Your invoices
        </Link>
        <PrintButton />
      </div>
      <DocumentView document={invoice} totals={invoice.totals} variant="portal" />
      <p className="print:hidden text-sm text-muted-foreground">
        <Link href={`/portal/orders/${invoice.order.id}`} className="hover:text-foreground">
          View the order
        </Link>
      </p>
    </div>
  );
}
