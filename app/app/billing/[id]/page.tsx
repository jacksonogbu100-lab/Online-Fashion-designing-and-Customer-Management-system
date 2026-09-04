import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ConvertQuoteButton,
  SendDocumentButton,
  VoidDocumentForm,
} from "@/components/billing/document-actions";
import { DocumentView } from "@/components/billing/document-view";
import { PaymentForm } from "@/components/billing/payment-form";
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
import { documentKindLabel, documentStatusLabel } from "@/lib/billing/format";
import { getDocumentForStaff } from "@/lib/billing/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Document",
};

export default async function BillingDocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const document = await getDocumentForStaff(id);
  const isDraft = document.status === "draft";
  const canPay =
    document.kind === "invoice" &&
    (document.status === "sent" || document.status === "paid");
  const canConvert =
    document.kind === "quote" && document.status === "sent" && !document.invoice;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/app/billing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Billing
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-4xl font-medium tracking-tight">
              {document.reference}
            </h1>
            <Badge variant="outline">{documentKindLabel(document.kind)}</Badge>
            <Badge variant={document.status === "void" ? "destructive" : "default"}>
              {documentStatusLabel(document.status)}
            </Badge>
          </div>
          <p className="mt-3 text-muted-foreground">
            <Link href={`/app/orders/${document.order.id}`} className="hover:text-foreground">
              {document.order.reference}
            </Link>
            {` · `}
            <Link
              href={`/app/clients/${document.order.client.id}`}
              className="hover:text-foreground"
            >
              {document.order.client.displayName}
            </Link>
            {document.invoice ? (
              <>
                {` · Invoice `}
                <Link
                  href={`/app/billing/${document.invoice.id}`}
                  className="hover:text-foreground"
                >
                  {document.invoice.reference}
                </Link>
              </>
            ) : null}
            {document.sourceQuote ? (
              <>
                {` · Quote `}
                <Link
                  href={`/app/billing/${document.sourceQuote.id}`}
                  className="hover:text-foreground"
                >
                  {document.sourceQuote.reference}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft ? (
            <Link
              href={`/app/billing/${document.id}/edit`}
              className={cn(buttonVariants())}
            >
              Edit
            </Link>
          ) : null}
          <Link
            href={`/app/billing/${document.id}/print`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Print
          </Link>
        </div>
      </div>

      <DocumentView document={document} totals={document.totals} variant="staff" heading={false} />

      {isDraft ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Send</CardTitle>
            <CardDescription>
              A sent {document.kind} is frozen. Quotes can then become invoices. Invoices can take payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SendDocumentButton documentId={document.id} />
          </CardContent>
        </Card>
      ) : null}

      {canConvert ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
            <CardDescription>
              Copy these lines into a draft invoice. Review it, then send it to the client.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConvertQuoteButton documentId={document.id} />
          </CardContent>
        </Card>
      ) : null}

      {canPay ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Record payment</CardTitle>
            <CardDescription>
              Cash, transfer, or card taken at the studio. Paid cannot go over the total without an overpay note.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm documentId={document.id} />
          </CardContent>
        </Card>
      ) : null}

      {document.status !== "void" ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Void</CardTitle>
            <CardDescription>
              The document stays in the book with its lines and payments. Nothing is deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoidDocumentForm
              documentId={document.id}
              kind={document.kind}
              status={document.status}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
