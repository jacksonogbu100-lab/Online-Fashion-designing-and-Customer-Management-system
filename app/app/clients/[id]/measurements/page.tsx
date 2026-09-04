import Link from "next/link";
import { notFound } from "next/navigation";

import { ClientRecordTitle, ClientSubnav } from "@/components/clients/client-subnav";
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
import { filledMeasurementCount } from "@/lib/measurements/format";
import { listMeasurementProfilesForStaff } from "@/lib/measurements/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Measurements",
};

export default async function ClientMeasurementsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const { client, profiles } = await listMeasurementProfilesForStaff(id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ClientRecordTitle client={client} />
        <Link
          href={`/app/clients/${client.id}/measurements/new`}
          className={cn(buttonVariants())}
        >
          New profile
        </Link>
      </div>

      <ClientSubnav clientId={client.id} active="measurements" />

      <p className="text-muted-foreground">
        Each fitting keeps its own tape chart. The current profile is what the
        workroom should cut from.
      </p>

      {profiles.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No fit profiles yet</CardTitle>
            <CardDescription>
              Take the first set in the workroom. Later fittings become new
              records so history is never overwritten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href={`/app/clients/${client.id}/measurements/new`}
              className={cn(buttonVariants({ variant: "outline" }), "w-fit")}
            >
              Take first tape
            </Link>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-3">
          {profiles.map((profile) => (
            <li key={profile.id}>
              <Link
                href={`/app/clients/${client.id}/measurements/${profile.id}`}
                className="block"
              >
                <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{profile.label}</CardTitle>
                      {profile.isCurrent ? (
                        <Badge>Current</Badge>
                      ) : (
                        <Badge variant="outline">Historic</Badge>
                      )}
                    </div>
                    <CardDescription>
                      {formatHouseDate(profile.recordedAt)}
                      {` · ${filledMeasurementCount(profile.values)} measurements`}
                      {profile.notes ? " · Has notes" : ""}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
