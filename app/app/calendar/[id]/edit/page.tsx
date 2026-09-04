import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { requireStaff } from "@/lib/auth/access";
import { toStudioDateTimeInput } from "@/lib/appointments/datetime";
import {
  getAppointmentForStaff,
  listClientsForAppointments,
  listOrdersForAppointmentForm,
  listStaffForAppointments,
} from "@/lib/appointments/queries";

export const metadata = {
  title: "Edit sitting",
};

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();
  const { id } = await params;
  if (!id) {
    notFound();
  }

  const appointment = await getAppointmentForStaff(id);
  const [clients, orders, staff] = await Promise.all([
    listClientsForAppointments(appointment.clientId),
    listOrdersForAppointmentForm(appointment.clientId),
    listStaffForAppointments(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href={`/app/calendar/${appointment.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {appointment.client.displayName}
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Edit sitting
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The client on a sitting does not change. Times are India time.
        </p>
      </div>
      {appointment.status !== "scheduled" ? (
        <p className="text-sm text-muted-foreground">
          Closed sittings stay as they are. Book a new one if needed.
        </p>
      ) : (
        <AppointmentForm
          appointment={{
            id: appointment.id,
            type: appointment.type,
            clientId: appointment.clientId,
            orderId: appointment.orderId ?? "",
            staffId: appointment.staffId,
            startsAt: toStudioDateTimeInput(appointment.startsAt),
            endsAt: toStudioDateTimeInput(appointment.endsAt),
            location: appointment.location,
            notes: appointment.notes ?? "",
          }}
          clients={clients}
          orders={orders}
          staff={staff}
        />
      )}
    </div>
  );
}
