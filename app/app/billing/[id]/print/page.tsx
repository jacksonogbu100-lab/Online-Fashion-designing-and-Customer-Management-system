import Link from "next/link";
import { notFound } from "next/navigation";

import { DocumentView } from "@/components/billing/document-view";
import { Brand } from "@/components/brand";
import { PrintButton } from "@/components/measurements/print-button";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/access";
import { documentKindLabel } from "@/lib/billing/format";
import { getDocumentForStaff } from "@/lib/billing/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Print document",
};

export default async function BillingPrintPage({
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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link
          href={`/app/billing/${document.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to {document.reference}
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          {document.status === "draft" ? (
            <Link
              href={`/app/billing/${document.id}/edit`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Edit
            </Link>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Brand />
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          {documentKindLabel(document.kind)}
        </p>
      </div>

      <DocumentView document={document} totals={document.totals} variant="staff" />
    </div>
  );
}
