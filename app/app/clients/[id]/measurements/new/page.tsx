import Link from "next/link";
import { notFound } from "next/navigation";

import { MeasurementProfileForm } from "@/components/measurements/profile-form";
import { requireStaff } from "@/lib/auth/access";
import { todayInputValue } from "@/lib/measurements/format";
import {
  getCurrentMeasurementProfileForStaff,
  listMeasurementProfilesForStaff,
} from "@/lib/measurements/queries";

export const metadata = {
  title: "New measurement profile",
};

export default async function NewMeasurementProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const [{ client }, current] = await Promise.all([
    listMeasurementProfilesForStaff(id),
    getCurrentMeasurementProfileForStaff(id),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href={`/app/clients/${client.id}/measurements`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Measurements
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          New profile for {client.displayName}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          This becomes a new dated record. The previous tape chart stays in the
          history.
          {current
            ? " Numbers below start from the current profile so you only change what moved."
            : ""}
        </p>
      </div>
      <MeasurementProfileForm
        clientId={client.id}
        defaults={
          current
            ? {
                label: "",
                recordedAt: todayInputValue(),
                notes: "",
                values: current.values,
              }
            : undefined
        }
      />
    </div>
  );
}
