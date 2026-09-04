import Link from "next/link";

import { WeekCalendar } from "@/components/appointments/week-calendar";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import {
  addStudioDays,
  formatStudioDate,
  parseWeekParam,
  studioWeekDays,
  weekParam,
} from "@/lib/appointments/datetime";
import { listAppointmentsForWeek } from "@/lib/appointments/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Calendar",
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const weekStart = parseWeekParam(params.week);
  const weekEnd = addStudioDays(weekStart, 6);
  const days = studioWeekDays(weekStart);
  const appointments = await listAppointmentsForWeek(weekStart);
  const previous = weekParam(addStudioDays(weekStart, -7));
  const next = weekParam(addStudioDays(weekStart, 7));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            Studio calendar
          </p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
            Fittings
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {formatStudioDate(weekStart)} – {formatStudioDate(weekEnd)}. Times are
            India time.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/app/calendar?week=${previous}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Previous week
          </Link>
          <Link
            href={`/app/calendar?week=${next}`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Next week
          </Link>
          <Link href="/app/calendar/new" className={cn(buttonVariants())}>
            Book sitting
          </Link>
        </div>
      </div>

      {appointments.length === 0 ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Nothing booked this week</CardTitle>
            <CardDescription>
              Book a consultation, measurement, fitting, or pickup against a client.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <WeekCalendar
        days={days}
        appointments={appointments}
        weekQuery={weekParam(weekStart)}
      />
    </div>
  );
}
