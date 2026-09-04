import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  formatStudioRange,
  formatStudioTime,
  formatStudioWeekday,
  studioParts,
} from "@/lib/appointments/datetime";
import {
  appointmentStatusLabel,
  appointmentTypeLabel,
} from "@/lib/appointments/format";
import type { AppointmentStatus, AppointmentType } from "@/lib/appointments/schemas";

type CalendarAppointment = {
  id: string;
  type: AppointmentType;
  status: AppointmentStatus;
  startsAt: Date;
  endsAt: Date;
  client: { displayName: string };
  staff: { name: string };
};

export function WeekCalendar({
  days,
  appointments,
  weekQuery,
}: {
  days: Date[];
  appointments: CalendarAppointment[];
  weekQuery: string;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((day) => {
        const parts = studioParts(day);
        const dayAppointments = appointments.filter((appointment) => {
          const start = studioParts(appointment.startsAt);
          return (
            start.year === parts.year &&
            start.month === parts.month &&
            start.day === parts.day
          );
        });

        return (
          <section key={weekQuery + parts.day} className="flex min-h-56 flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                {formatStudioWeekday(day)} {parts.day}
              </h2>
              <Link
                href={`/app/calendar/new?date=${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T11:00&week=${weekQuery}`}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Book
              </Link>
            </div>
            {dayAppointments.length === 0 ? (
              <p className="rounded-lg bg-muted/50 px-3 py-4 text-sm text-muted-foreground">
                Free
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {dayAppointments.map((appointment) => (
                  <li key={appointment.id}>
                    <Link
                      href={`/app/calendar/${appointment.id}?week=${weekQuery}`}
                      className="block rounded-lg bg-muted/50 px-3 py-2 transition-colors hover:bg-muted"
                    >
                      <p className="text-xs text-muted-foreground">
                        {formatStudioTime(appointment.startsAt)}–{formatStudioTime(appointment.endsAt)}
                      </p>
                      <p className="text-sm font-medium">{appointment.client.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {appointmentTypeLabel(appointment.type)} · {appointment.staff.name}
                      </p>
                      {appointment.status !== "scheduled" ? (
                        <Badge variant="outline" className="mt-1">
                          {appointmentStatusLabel(appointment.status)}
                        </Badge>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function AppointmentList({
  appointments,
  empty,
  hrefFor,
}: {
  appointments: {
    id: string;
    type: AppointmentType;
    status: AppointmentStatus;
    startsAt: Date;
    endsAt: Date;
    location: string;
    staff: { name: string };
    order?: { title: string } | null;
  }[];
  empty: string;
  hrefFor: (id: string) => string;
}) {
  if (appointments.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {appointments.map((appointment) => (
        <li key={appointment.id}>
          <Link
            href={hrefFor(appointment.id)}
            className="flex flex-col gap-1 rounded-lg px-1 py-2 hover:bg-muted/60"
          >
            <span className="text-sm font-medium">
              {appointmentTypeLabel(appointment.type)}
              {appointment.order ? ` · ${appointment.order.title}` : ""}
            </span>
            <span className="text-sm text-muted-foreground">
              {formatStudioRange(appointment.startsAt, appointment.endsAt)} · {appointment.location}
            </span>
            <span className="text-xs text-muted-foreground">
              {appointment.staff.name} · {appointmentStatusLabel(appointment.status)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
