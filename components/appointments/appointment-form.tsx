"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createAppointmentAction,
  updateAppointmentAction,
  type AppointmentFormState,
} from "@/lib/appointments/actions";
import {
  addMinutes,
  defaultDurationMinutes,
  parseStudioDateTime,
  toStudioDateTimeInput,
} from "@/lib/appointments/datetime";
import { appointmentTypeLabel } from "@/lib/appointments/format";
import {
  appointmentTypes,
  type AppointmentType,
} from "@/lib/appointments/schemas";
import { cn } from "@/lib/utils";

const initialState: AppointmentFormState = {};

type AppointmentFormValues = {
  id: string;
  type: AppointmentType;
  clientId: string;
  orderId: string;
  staffId: string;
  startsAt: string;
  endsAt: string;
  location: string;
  notes: string;
};

export function AppointmentForm({
  appointment,
  clients,
  orders,
  staff,
  defaults,
}: {
  appointment?: AppointmentFormValues;
  clients: { id: string; displayName: string }[];
  orders: { id: string; reference: string; title: string; clientId: string }[];
  staff: { id: string; name: string }[];
  defaults?: {
    type?: AppointmentType;
    clientId?: string;
    orderId?: string;
    staffId?: string;
    startsAt?: string;
    endsAt?: string;
    location?: string;
  };
}) {
  const action = appointment
    ? updateAppointmentAction.bind(null, appointment.id)
    : createAppointmentAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [clientId, setClientId] = useState(appointment?.clientId ?? defaults?.clientId ?? "");
  const [type, setType] = useState<AppointmentType>(
    appointment?.type ?? defaults?.type ?? "fitting",
  );
  const [startsAt, setStartsAt] = useState(
    appointment?.startsAt ?? defaults?.startsAt ?? "",
  );
  const [endsAt, setEndsAt] = useState(appointment?.endsAt ?? defaults?.endsAt ?? "");
  const cancelHref = appointment ? `/app/calendar/${appointment.id}` : "/app/calendar";

  const visibleOrders = useMemo(
    () => orders.filter((order) => order.clientId === clientId),
    [orders, clientId],
  );

  function syncEndFromStart(nextStart: string, nextType: AppointmentType) {
    const start = parseStudioDateTime(nextStart);
    if (!start) {
      return;
    }
    setEndsAt(toStudioDateTimeInput(addMinutes(start, defaultDurationMinutes(nextType))));
  }

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground">Times are India time (IST).</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="type">
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(event) => {
              const next = event.target.value as AppointmentType;
              setType(next);
              if (startsAt) {
                syncEndFromStart(startsAt, next);
              }
            }}
          >
            {appointmentTypes.map((value) => (
              <option key={value} value={value}>
                {appointmentTypeLabel(value)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="With" htmlFor="staffId" error={state.fieldErrors?.staffId}>
          <Select
            id="staffId"
            name="staffId"
            required
            defaultValue={appointment?.staffId ?? defaults?.staffId ?? ""}
            aria-invalid={state.fieldErrors?.staffId ? true : undefined}
          >
            <option value="">Choose a house person</option>
            {staff.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {appointment ? (
        <input type="hidden" name="clientId" value={appointment.clientId} />
      ) : (
        <Field label="Client" htmlFor="clientId" error={state.fieldErrors?.clientId}>
          <Select
            id="clientId"
            name="clientId"
            required
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            aria-invalid={state.fieldErrors?.clientId ? true : undefined}
          >
            <option value="">Choose a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.displayName}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label="Order" htmlFor="orderId" error={state.fieldErrors?.orderId}>
        <Select
          id="orderId"
          key={`order-${clientId}`}
          name="orderId"
          defaultValue={appointment?.orderId ?? defaults?.orderId ?? ""}
          disabled={!clientId}
          aria-invalid={state.fieldErrors?.orderId ? true : undefined}
        >
          <option value="">No order attached</option>
          {visibleOrders.map((order) => (
            <option key={order.id} value={order.id}>
              {order.reference} · {order.title}
            </option>
          ))}
        </Select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" htmlFor="startsAt" error={state.fieldErrors?.startsAt}>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(event) => {
              const next = event.target.value;
              setStartsAt(next);
              syncEndFromStart(next, type);
            }}
            aria-invalid={state.fieldErrors?.startsAt ? true : undefined}
          />
        </Field>
        <Field label="Ends" htmlFor="endsAt" error={state.fieldErrors?.endsAt}>
          <Input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            required
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            aria-invalid={state.fieldErrors?.endsAt ? true : undefined}
          />
        </Field>
      </div>

      <Field label="Where" htmlFor="location" error={state.fieldErrors?.location}>
        <Input
          id="location"
          name="location"
          required
          defaultValue={appointment?.location ?? defaults?.location ?? "Studio"}
          aria-invalid={state.fieldErrors?.location ? true : undefined}
        />
      </Field>

      <Field label="Workroom notes" htmlFor="notes" error={state.fieldErrors?.notes}>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={appointment?.notes}
          placeholder="Internal notes. Clients never see this."
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : appointment ? "Save sitting" : "Book sitting"}
        </Button>
        <Link href={cancelHref} className={cn(buttonVariants({ variant: "outline" }))}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
