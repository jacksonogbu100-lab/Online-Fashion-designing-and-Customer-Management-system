import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentList } from "@/components/appointments/week-calendar";
import { ClientRecordTitle, ClientSubnav } from "@/components/clients/client-subnav";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { getClientForStaff } from "@/lib/clients/queries";
import { listAppointmentsForClient } from "@/lib/appointments/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Client appointments",
};

export default async function ClientAppointmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const client = await getClientForStaff(id);
  const appointments = await listAppointmentsForClient(client.id);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ClientRecordTitle client={client} />
        <Link
          href={`/app/calendar/new?clientId=${client.id}`}
          className={cn(buttonVariants())}
        >
          Book sitting
        </Link>
      </div>

      <ClientSubnav clientId={client.id} active="appointments" />

      {appointments.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>No sittings yet</CardTitle>
            <CardDescription>
              Book a consultation, measurement, fitting, or pickup for {client.displayName}.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <AppointmentList
          appointments={appointments}
          empty=""
          hrefFor={(appointmentId) => `/app/calendar/${appointmentId}`}
        />
      )}
    </div>
  );
}
