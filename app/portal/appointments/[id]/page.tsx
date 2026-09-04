import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { requireClient } from "@/lib/auth/access";
import { formatStudioRange } from "@/lib/appointments/datetime";
import {
  appointmentStatusClientLabel,
  appointmentTypeLabel,
} from "@/lib/appointments/format";
import { getOwnAppointmentForPortal } from "@/lib/appointments/queries";

export const metadata = {
  title: "Appointment",
};

export default async function PortalAppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClient();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const appointment = await getOwnAppointmentForPortal(id);

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href="/portal/appointments"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Your appointments
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="font-heading text-4xl font-medium tracking-tight">
            {appointmentTypeLabel(appointment.type)}
          </h1>
          <Badge>{appointmentStatusClientLabel(appointment.status)}</Badge>
        </div>
        <p className="mt-3 text-muted-foreground">
          {formatStudioRange(appointment.startsAt, appointment.endsAt)}
          {` · ${appointment.location}`}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        With {appointment.staff.name}
        {appointment.order ? ` · ${appointment.order.title}` : ""}
      </p>
    </div>
  );
}
