import Link from "next/link";

import { AppointmentForm } from "@/components/appointments/appointment-form";
import { requireStaff } from "@/lib/auth/access";
import {
  addMinutes,
  defaultDurationMinutes,
  parseStudioDateTime,
  suggestedStartInput,
  toStudioDateTimeInput,
} from "@/lib/appointments/datetime";
import {
  getAppointmentFormPrefill,
  listClientsForAppointments,
  listOrdersForAppointmentForm,
  listStaffForAppointments,
} from "@/lib/appointments/queries";

export const metadata = {
  title: "Book sitting",
};

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{
    clientId?: string;
    orderId?: string;
    date?: string;
    week?: string;
  }>;
}) {
  const user = await requireStaff();
  const params = await searchParams;
  const prefill = await getAppointmentFormPrefill({
    clientId: params.clientId,
    orderId: params.orderId,
  });
  const defaultClientId = prefill.order?.clientId ?? prefill.client?.id;
  const startsAt = suggestedStartInput(params.date);
  const startDate = parseStudioDateTime(startsAt);
  const endsAt = startDate
    ? toStudioDateTimeInput(addMinutes(startDate, defaultDurationMinutes("fitting")))
    : "";

  const [clients, orders, staff] = await Promise.all([
    listClientsForAppointments(defaultClientId),
    listOrdersForAppointmentForm(),
    listStaffForAppointments(),
  ]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <Link
          href={params.week ? `/app/calendar?week=${params.week}` : "/app/calendar"}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Calendar
        </Link>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Book sitting
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A client and a house person, on the studio calendar. Attach an order when
          the sitting is for a garment in production.
        </p>
      </div>
      <AppointmentForm
        clients={clients}
        orders={orders}
        staff={staff}
        defaults={{
          type: params.orderId ? "fitting" : "consultation",
          clientId: defaultClientId,
          orderId: prefill.order?.id,
          staffId: user.id,
          startsAt,
          endsAt,
          location: "Studio",
        }}
      />
    </div>
  );
}
