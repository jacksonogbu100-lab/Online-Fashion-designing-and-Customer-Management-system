import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireClient } from "@/lib/auth/access";
import { formatStudioRange } from "@/lib/appointments/datetime";
import {
  appointmentStatusClientLabel,
  appointmentTypeLabel,
} from "@/lib/appointments/format";
import { listOwnAppointmentsForPortal } from "@/lib/appointments/queries";

export const metadata = {
  title: "Your appointments",
};

export default async function PortalAppointmentsPage() {
  await requireClient();
  const appointments = await listOwnAppointmentsForPortal();
  const upcoming = appointments.filter(
    (appointment) =>
      appointment.status === "scheduled" && appointment.startsAt.getTime() >= Date.now() - 60_000,
  );
  const past = appointments.filter((appointment) => !upcoming.includes(appointment));

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Client portal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Your appointments
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sittings Sunnex Clothing has booked with you. Times are India time.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-medium">Upcoming</h2>
        {upcoming.length === 0 ? (
          <Card className="border-none shadow-none ring-foreground/8">
            <CardHeader>
              <CardTitle>Nothing booked</CardTitle>
              <CardDescription>
                When the house books a sitting, it will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((appointment) => (
              <li key={appointment.id}>
                <Link href={`/portal/appointments/${appointment.id}`} className="block">
                  <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">
                          {appointmentTypeLabel(appointment.type)}
                        </CardTitle>
                        <Badge variant="outline">
                          {appointmentStatusClientLabel(appointment.status)}
                        </Badge>
                      </div>
                      <CardDescription>
                        {formatStudioRange(appointment.startsAt, appointment.endsAt)}
                        {` · ${appointment.location}`}
                        {appointment.order ? ` · ${appointment.order.title}` : ""}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="font-heading text-2xl font-medium">Earlier</h2>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
            {past.map((appointment) => (
              <li key={appointment.id}>
                <Link
                  href={`/portal/appointments/${appointment.id}`}
                  className="hover:text-foreground"
                >
                  {appointmentTypeLabel(appointment.type)} ·{" "}
                  {formatStudioRange(appointment.startsAt, appointment.endsAt)} ·{" "}
                  {appointmentStatusClientLabel(appointment.status)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
