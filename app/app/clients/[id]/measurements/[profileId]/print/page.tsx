import Link from "next/link";
import { notFound } from "next/navigation";

import { Brand } from "@/components/brand";
import { MeasurementChart } from "@/components/measurements/measurement-chart";
import { PrintButton } from "@/components/measurements/print-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { requireStaff } from "@/lib/auth/access";
import { formatHouseDate } from "@/lib/clients/format";
import { getMeasurementProfileForStaff } from "@/lib/measurements/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Workroom sheet",
};

export default async function MeasurementPrintPage({
  params,
}: {
  params: Promise<{ id: string; profileId: string }>;
}) {
  await requireStaff();
  const { id, profileId } = await params;
  if (!id || !profileId) {
    notFound();
  }

  const { client, profile } = await getMeasurementProfileForStaff(id, profileId);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link
          href={`/app/clients/${client.id}/measurements/${profile.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to profile
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <Link
            href={`/app/clients/${client.id}/measurements/${profile.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit
          </Link>
        </div>
      </div>

      <header className="flex flex-col gap-3 border-b border-foreground/20 pb-6">
        <Brand />
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Workroom sheet
        </p>
        <h1 className="font-heading text-4xl font-medium tracking-tight">
          {client.displayName}
        </h1>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>{profile.label}</span>
          <span>·</span>
          <span>{formatHouseDate(profile.recordedAt)}</span>
          {profile.isCurrent ? <Badge>Current</Badge> : <Badge variant="outline">Historic</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {[client.phone, client.email, [client.city, client.country].filter(Boolean).join(", ")]
            .filter(Boolean)
            .join(" · ") || "No contact on file"}
        </p>
      </header>

      <MeasurementChart values={profile.values} notes={profile.notes} variant="workroom" />
    </div>
  );
}
