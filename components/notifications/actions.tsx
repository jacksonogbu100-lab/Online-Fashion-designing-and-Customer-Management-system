"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  markAllNotificationsReadAction,
  openNotificationAction,
  sendAppointmentReminderAction,
} from "@/lib/notifications/actions";

export function MarkAllReadButton() {
  const [state, formAction, pending] = useActionState(markAllNotificationsReadAction, {});

  return (
    <form action={formAction}>
      {state.error ? (
        <p className="mb-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Marking…" : "Mark all read"}
      </Button>
    </form>
  );
}

export function OpenNotificationButton({
  notificationId,
  title,
}: {
  notificationId: string;
  title: string;
}) {
  const action = openNotificationAction.bind(null, notificationId);

  return (
    <form action={action}>
      <button
        type="submit"
        className="text-left text-sm font-medium hover:text-foreground"
      >
        {title}
      </button>
    </form>
  );
}

export function SendAppointmentReminderButton({ appointmentId }: { appointmentId: string }) {
  const action = sendAppointmentReminderAction.bind(null, appointmentId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "Sending…" : "Send portal reminder"}
      </Button>
    </form>
  );
}
