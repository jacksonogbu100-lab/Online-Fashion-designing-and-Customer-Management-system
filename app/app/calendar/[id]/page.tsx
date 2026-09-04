import Link from "next/link";
import { notFound } from "next/navigation";

import { AppointmentStatusActions } from "@/components/appointments/status-actions";
import { SendAppointmentReminderButton } from "@/components/notifications/actions";
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
import { formatStudioRange, weekParam } from "@/lib/appointments/datetime";
import {
  appointmentStatusLabel,
  appointmentTypeLabel,
  isOpenAppointmentStatus,
} from "@/lib/appointments/format";
import { getAppointmentForStaff } from "@/lib/appointments/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Appointment",
};

export default async function AppointmentDetailPage({
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
  const week = weekParam(appointment.startsAt);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/app/calendar?week=${week}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Calendar
          </Link>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-4xl font-medium tracking-tight">
              {appointmentTypeLabel(appointment.type)}
            </h1>
            <Badge
              variant={appointment.status === "cancelled" ? "destructive" : "default"}
            >
              {appointmentStatusLabel(appointment.status)}
            </Badge>
          </div>
          <p className="mt-3 text-muted-foreground">
            {formatStudioRange(appointment.startsAt, appointment.endsAt)}
            {` · ${appointment.location}`}
          </p>
        </div>
        {isOpenAppointmentStatus(appointment.status) ? (
          <Link
            href={`/app/calendar/${appointment.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit
          </Link>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Client</CardTitle>
            <CardDescription>
              <Link
                href={`/app/clients/${appointment.client.id}`}
                className="hover:text-foreground"
              >
                {appointment.client.displayName}
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {appointment.order ? (
              <Link
                href={`/app/orders/${appointment.order.id}`}
                className="hover:text-foreground"
              >
                {appointment.order.reference} · {appointment.order.title}
              </Link>
            ) : (
              "No order attached"
            )}
          </CardContent>
        </Card>
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>House</CardTitle>
            <CardDescription>{appointment.staff.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <AppointmentStatusActions
              appointmentId={appointment.id}
              status={appointment.status}
            />
          </CardContent>
        </Card>
      </div>

      {isOpenAppointmentStatus(appointment.status) && appointment.client.portalUserId ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Portal reminder</CardTitle>
            <CardDescription>
              Puts a sitting alert in {appointment.client.displayName}’s portal. Nothing is emailed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SendAppointmentReminderButton appointmentId={appointment.id} />
          </CardContent>
        </Card>
      ) : null}

      {appointment.notes ? (
        <Card className="border-none shadow-none ring-foreground/8">
          <CardHeader>
            <CardTitle>Workroom notes</CardTitle>
            <CardDescription className="whitespace-pre-wrap">
              {appointment.notes}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Booked by {appointment.createdBy.name}.
      </p>
    </div>
  );
}
