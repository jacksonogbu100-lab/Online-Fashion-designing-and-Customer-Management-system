import Link from "next/link";
import { notFound } from "next/navigation";

import { MeasurementChart } from "@/components/measurements/measurement-chart";
import { SetCurrentButton } from "@/components/measurements/set-current-button";
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
import { formatHouseDate } from "@/lib/clients/format";
import { getMeasurementProfileForStaff } from "@/lib/measurements/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Measurement profile",
};

export default async function MeasurementProfilePage({
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
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/app/clients/${client.id}/measurements`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Measurements
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-4xl font-medium tracking-tight">
              {profile.label}
            </h1>
            {profile.isCurrent ? (
              <Badge>Current</Badge>
            ) : (
              <Badge variant="outline">Historic</Badge>
            )}
          </div>
          <p className="mt-3 text-muted-foreground">
            {client.displayName} · Recorded {formatHouseDate(profile.recordedAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/clients/${client.id}/measurements/${profile.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit
          </Link>
          <Link
            href={`/app/clients/${client.id}/measurements/${profile.id}/print`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Workroom sheet
          </Link>
          {profile.isCurrent ? null : (
            <SetCurrentButton clientId={client.id} profileId={profile.id} />
          )}
        </div>
      </div>

      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>Tape chart</CardTitle>
          <CardDescription>
            {profile.isCurrent
              ? "This is the set the workroom should cut from."
              : "Historic. Set it current if a later fitting should not be used."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MeasurementChart values={profile.values} notes={profile.notes} />
        </CardContent>
      </Card>
    </div>
  );
}
