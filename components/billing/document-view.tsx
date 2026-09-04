import { Badge } from "@/components/ui/badge";
import {
  documentKindLabel,
  documentLineKindLabel,
  documentStatusClientLabel,
  documentStatusLabel,
  paymentMethodLabel,
  taxRateLabel,
} from "@/lib/billing/format";
import type {
  DocumentKind,
  DocumentLineKind,
  DocumentStatus,
  PaymentMethod,
} from "@/lib/billing/schemas";
import { lineAmountInr, type DocumentTotals } from "@/lib/billing/totals";
import { formatHouseDate } from "@/lib/clients/format";
import { formatRupees } from "@/lib/orders/format";

export type DocumentViewRecord = {
  kind: DocumentKind;
  status: DocumentStatus;
  reference: string;
  title: string;
  notes: string | null;
  taxRateBps: number;
  taxInclusive: boolean;
  overpayNote: string | null;
  voidReason: string | null;
  sentAt: Date | null;
  paidAt: Date | null;
  voidedAt: Date | null;
  issuedBy: { name: string };
  order: {
    reference: string;
    title: string;
    client: {
      displayName: string;
      email: string | null;
      phone: string | null;
      city: string | null;
      country: string | null;
    };
    design: { title: string } | null;
  };
  lines: {
    id: string;
    kind: DocumentLineKind;
    description: string;
    quantity: { toString(): string };
    unitAmountInr: number;
  }[];
  payments: {
    id: string;
    amountInr: number;
    method: PaymentMethod;
    receivedAt: Date;
    notes: string | null;
    recordedBy: { name: string };
  }[];
  sourceQuote: { reference: string } | null;
};

export function DocumentView({
  document,
  totals,
  variant,
  heading = true,
}: {
  document: DocumentViewRecord;
  totals: DocumentTotals;
  variant: "staff" | "portal";
  heading?: boolean;
}) {
  const statusLabel =
    variant === "portal" && document.status !== "draft"
      ? documentStatusClientLabel(document.status)
      : documentStatusLabel(document.status);
  const client = document.order.client;
  const place = [client.city, client.country].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-8">
      {heading ? (
      <header className="flex flex-col gap-3 border-b border-foreground/20 pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-4xl font-medium tracking-tight">{document.title}</h1>
          <Badge variant="outline">{documentKindLabel(document.kind)}</Badge>
          <Badge variant={document.status === "void" ? "destructive" : "default"}>
            {statusLabel}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {document.reference}
          {document.sourceQuote ? ` · from ${document.sourceQuote.reference}` : ""}
        </p>
        <p className="text-sm">
          {client.displayName}
          {` · ${document.order.reference} ${document.order.title}`}
          {document.order.design ? ` · ${document.order.design.title}` : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          {[client.phone, client.email, place].filter(Boolean).join(" · ") || "No contact on file"}
        </p>
        <p className="text-sm text-muted-foreground">
          {document.taxInclusive
            ? `Totals include ${taxRateLabel(document.taxRateBps).toLowerCase()}`
            : `${taxRateLabel(document.taxRateBps)} added on top`}
          {variant === "staff" ? ` · Issued by ${document.issuedBy.name}` : ""}
          {document.sentAt ? ` · Sent ${formatHouseDate(document.sentAt)}` : ""}
          {document.paidAt ? ` · Paid ${formatHouseDate(document.paidAt)}` : ""}
        </p>
      </header>
      ) : null}

      {variant === "staff" && document.notes ? (
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{document.notes}</p>
      ) : null}

      {document.status === "void" && document.voidReason && variant === "staff" ? (
        <p className="text-sm text-destructive">Void: {document.voidReason}</p>
      ) : null}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-foreground/15 text-left text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Line</th>
            <th className="py-2 pr-3 font-medium">Qty</th>
            <th className="py-2 pr-3 text-right font-medium">Amount</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {document.lines.length === 0 ? (
            <tr>
              <td colSpan={4} className="py-4 text-muted-foreground">
                No lines yet.
              </td>
            </tr>
          ) : (
            document.lines.map((line) => (
              <tr key={line.id} className="border-b border-foreground/8">
                <td className="py-3 pr-3">
                  <div>{line.description}</div>
                  <div className="text-xs text-muted-foreground">
                    {documentLineKindLabel(line.kind)}
                  </div>
                </td>
                <td className="py-3 pr-3">{line.quantity.toString()}</td>
                <td className="py-3 pr-3 text-right">{formatRupees(line.unitAmountInr)}</td>
                <td className="py-3 text-right">
                  {formatRupees(lineAmountInr(line.quantity, line.unitAmountInr))}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <DocumentTotalsBlock document={document} totals={totals} />

      {document.kind === "invoice" && document.payments.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-2xl font-medium">Payments</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {document.payments.map((payment) => (
              <li key={payment.id} className="flex flex-wrap justify-between gap-2 border-b border-foreground/8 pb-2">
                <span>
                  {formatHouseDate(payment.receivedAt)} · {paymentMethodLabel(payment.method)}
                  {variant === "staff" ? ` · ${payment.recordedBy.name}` : ""}
                  {variant === "staff" && payment.notes ? ` · ${payment.notes}` : ""}
                </span>
                <span>{formatRupees(payment.amountInr)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {variant === "staff" && document.overpayNote ? (
        <p className="text-sm text-muted-foreground">Overpay: {document.overpayNote}</p>
      ) : null}
    </div>
  );
}

export function DocumentTotalsBlock({
  document,
  totals,
}: {
  document: Pick<DocumentViewRecord, "taxRateBps" | "taxInclusive" | "kind">;
  totals: DocumentTotals;
}) {
  return (
    <dl className="ml-auto flex w-full max-w-xs flex-col gap-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">
          {document.taxInclusive ? "Subtotal (incl. tax)" : "Subtotal"}
        </dt>
        <dd>{formatRupees(totals.subtotal)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">{taxRateLabel(document.taxRateBps)}</dt>
        <dd>{formatRupees(totals.tax)}</dd>
      </div>
      <div className="flex justify-between gap-4 font-medium">
        <dt>Total</dt>
        <dd>{formatRupees(totals.total)}</dd>
      </div>
      {document.kind === "invoice" ? (
        <>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Paid</dt>
            <dd>{formatRupees(totals.paid)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Remaining</dt>
            <dd>{formatRupees(totals.remaining)}</dd>
          </div>
        </>
      ) : null}
    </dl>
  );
}
