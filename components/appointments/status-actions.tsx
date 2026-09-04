"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  cancelAppointmentAction,
  completeAppointmentAction,
  markAppointmentNoShowAction,
} from "@/lib/appointments/actions";
import type { AppointmentStatus } from "@/lib/appointments/schemas";

export function AppointmentStatusActions({
  appointmentId,
  status,
}: {
  appointmentId: string;
  status: AppointmentStatus;
}) {
  if (status !== "scheduled") {
    return (
      <p className="text-sm text-muted-foreground">
        This sitting is closed. Book a new one if they need to come back.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <StatusButton
        appointmentId={appointmentId}
        action={completeAppointmentAction}
        label="Mark completed"
        pendingLabel="Saving…"
      />
      <StatusButton
        appointmentId={appointmentId}
        action={markAppointmentNoShowAction}
        label="Mark no-show"
        pendingLabel="Saving…"
        variant="outline"
      />
      <StatusButton
        appointmentId={appointmentId}
        action={cancelAppointmentAction}
        label="Cancel sitting"
        pendingLabel="Cancelling…"
        variant="destructive"
        confirm="Cancel this sitting? The record stays on the calendar."
      />
    </div>
  );
}

function StatusButton({
  appointmentId,
  action,
  label,
  pendingLabel,
  variant = "default",
  confirm,
}: {
  appointmentId: string;
  action: (
    appointmentId: string,
    prev: { error?: string },
    formData: FormData,
  ) => Promise<{ error?: string }>;
  label: string;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive";
  confirm?: string;
}) {
  const bound = action.bind(null, appointmentId);
  const [state, formAction, pending] = useActionState(bound, {});

  return (
    <form
      action={formAction}
      onSubmit={
        confirm
          ? (event) => {
              if (!window.confirm(confirm)) {
                event.preventDefault();
              }
            }
          : undefined
      }
    >
      {state.error ? (
        <p className="mb-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant={variant} disabled={pending}>
        {pending ? pendingLabel : label}
      </Button>
    </form>
  );
}
