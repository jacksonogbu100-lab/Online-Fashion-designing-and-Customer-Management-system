import Link from "next/link";
import { notFound } from "next/navigation";

import { MeasurementProfileForm } from "@/components/measurements/profile-form";
import { requireStaff } from "@/lib/auth/access";
import { toDateInputValue } from "@/lib/measurements/format";
import { getMeasurementProfileForStaff } from "@/lib/measurements/queries";

export const metadata = {
  title: "Edit measurement profile",
};

export default async function EditMeasurementProfilePage({
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
      <div>
        <Link
          href={`/app/clients/${client.id}/measurements/${profile.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {profile.label}
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Edit {profile.label}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Use this to correct a mistype. A new fitting date belongs on a new
          profile.
        </p>
      </div>
      <MeasurementProfileForm
        clientId={client.id}
        profileId={profile.id}
        defaults={{
          label: profile.label,
          recordedAt: toDateInputValue(profile.recordedAt),
          notes: profile.notes ?? "",
          values: profile.values,
        }}
      />
    </div>
  );
}
