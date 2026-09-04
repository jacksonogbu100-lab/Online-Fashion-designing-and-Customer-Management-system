import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AddDocumentLineForm, RemoveDocumentLineButton } from "@/components/billing/document-line-form";
import { DocumentMetaForm } from "@/components/billing/document-meta-form";
import { SendDocumentButton } from "@/components/billing/document-actions";
import { DocumentTotalsBlock } from "@/components/billing/document-view";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { documentKindLabel, documentLineKindLabel } from "@/lib/billing/format";
import { getDocumentForStaff } from "@/lib/billing/queries";
import { lineAmountInr } from "@/lib/billing/totals";
import { formatRupees } from "@/lib/orders/format";

export const metadata = {
  title: "Edit document",
};

export default async function EditBillingDocumentPage({
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
  if (document.status !== "draft") {
    redirect(`/app/billing/${document.id}`);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href={`/app/billing/${document.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {document.reference}
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Edit {documentKindLabel(document.kind).toLowerCase()}
        </h1>
        <p className="mt-3 text-muted-foreground">
          Drafts can change. Sending freezes the lines.
        </p>
      </div>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Title, tax, and workroom notes.</CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentMetaForm
            documentId={document.id}
            title={document.title}
            notes={document.notes ?? ""}
            taxRateBps={document.taxRateBps}
            taxInclusive={document.taxInclusive}
          />
        </CardContent>
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Lines</CardTitle>
          <CardDescription>Labour, materials, and extras in rupees.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {document.lines.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add the first line.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {document.lines.map((line) => {
                const amount = lineAmountInr(line.quantity, line.unitAmountInr);
                return (
                  <li
                    key={line.id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-foreground/8 pb-3"
                  >
                    <div className="text-sm">
                      <div>{line.description}</div>
                      <div className="text-muted-foreground">
                        {documentLineKindLabel(line.kind)}
                        {` · ${line.quantity.toString()} × ${formatRupees(line.unitAmountInr)} = ${formatRupees(amount)}`}
                      </div>
                    </div>
                    <RemoveDocumentLineButton
                      documentId={document.id}
                      lineId={line.id}
                      description={line.description}
                      amount={amount}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <AddDocumentLineForm key={document.lines.length} documentId={document.id} />
          <DocumentTotalsBlock document={document} totals={document.totals} />
        </CardContent>
      </Card>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Send</CardTitle>
          <CardDescription>
            The client will see invoices after they are sent. Quotes stay in the house until converted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SendDocumentButton documentId={document.id} />
        </CardContent>
      </Card>
    </div>
  );
}
