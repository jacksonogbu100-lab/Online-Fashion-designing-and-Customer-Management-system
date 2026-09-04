"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatHouseDate } from "@/lib/clients/format";
import {
  createOrderAction,
  updateOrderAction,
  type OrderFormState,
} from "@/lib/orders/actions";
import { orderPriorityLabel } from "@/lib/orders/format";
import { orderPriorities, type OrderPriority } from "@/lib/orders/schemas";
import { cn } from "@/lib/utils";

const initialState: OrderFormState = {};

type OrderFormValues = {
  id: string;
  title: string;
  clientId: string;
  designId: string;
  measurementProfileId: string;
  dueAt: string;
  priceEstimateInr: string;
  priority: OrderPriority;
  notes: string;
};

export function OrderForm({
  order,
  clients,
  designs,
  profiles,
  defaults,
}: {
  order?: OrderFormValues;
  clients: { id: string; displayName: string }[];
  designs: { id: string; title: string; clientId: string | null }[];
  profiles: {
    id: string;
    clientId: string;
    label: string;
    isCurrent: boolean;
    recordedAt: Date;
  }[];
  defaults?: {
    title?: string;
    clientId?: string;
    designId?: string;
  };
}) {
  const action = order ? updateOrderAction.bind(null, order.id) : createOrderAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [clientId, setClientId] = useState(order?.clientId ?? defaults?.clientId ?? "");
  const cancelHref = order ? `/app/orders/${order.id}` : "/app/orders";

  const visibleDesigns = useMemo(
    () => designs.filter((design) => !design.clientId || design.clientId === clientId),
    [designs, clientId],
  );
  const visibleProfiles = useMemo(
    () => profiles.filter((profile) => profile.clientId === clientId),
    [profiles, clientId],
  );

  return (
    <form action={formAction} className="flex max-w-3xl flex-col gap-6">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <Field label="Title" htmlFor="title" error={state.fieldErrors?.title}>
        <Input
          id="title"
          name="title"
          required
          defaultValue={order?.title ?? defaults?.title}
          placeholder="Slim indigo jean"
          aria-invalid={state.fieldErrors?.title ? true : undefined}
        />
      </Field>

      {order ? (
        <input type="hidden" name="clientId" value={order.clientId} />
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

      <Field label="Design" htmlFor="designId" error={state.fieldErrors?.designId}>
        <Select
          id="designId"
          key={`design-${clientId}`}
          name="designId"
          defaultValue={order?.designId ?? defaults?.designId ?? ""}
          disabled={!clientId}
          aria-invalid={state.fieldErrors?.designId ? true : undefined}
        >
          <option value="">No design attached</option>
          {visibleDesigns.map((design) => (
            <option key={design.id} value={design.id}>
              {design.title}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Fit snapshot"
        htmlFor="measurementProfileId"
        error={state.fieldErrors?.measurementProfileId}
      >
        <Select
          id="measurementProfileId"
          key={`fit-${clientId}`}
          name="measurementProfileId"
          defaultValue={order?.measurementProfileId ?? ""}
          disabled={!clientId}
          aria-invalid={state.fieldErrors?.measurementProfileId ? true : undefined}
        >
          <option value="">
            {order ? "Keep the saved snapshot" : "Use the current tape, if any"}
          </option>
          {visibleProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.label}
              {profile.isCurrent ? " · current" : ""}
              {` · ${formatHouseDate(profile.recordedAt)}`}
            </option>
          ))}
        </Select>
      </Field>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          name="snapshotFit"
          defaultChecked={!order}
          className="mt-0.5 size-4 accent-primary"
        />
        <span>
          {order
            ? "Replace the saved tape snapshot with the profile above (or the current tape)."
            : "Copy the selected tape onto this order so later edits do not rewrite history."}
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Due" htmlFor="dueAt" error={state.fieldErrors?.dueAt}>
          <Input
            id="dueAt"
            name="dueAt"
            type="date"
            defaultValue={order?.dueAt}
            aria-invalid={state.fieldErrors?.dueAt ? true : undefined}
          />
        </Field>
        <Field
          label="Estimate (₹)"
          htmlFor="priceEstimateInr"
          error={state.fieldErrors?.priceEstimateInr}
        >
          <Input
            id="priceEstimateInr"
            name="priceEstimateInr"
            inputMode="numeric"
            placeholder="18500"
            defaultValue={order?.priceEstimateInr}
            aria-invalid={state.fieldErrors?.priceEstimateInr ? true : undefined}
          />
        </Field>
        <Field label="Priority" htmlFor="priority">
          <Select id="priority" name="priority" defaultValue={order?.priority ?? "normal"}>
            {orderPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {orderPriorityLabel(priority)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Workroom notes" htmlFor="notes" error={state.fieldErrors?.notes}>
        <Textarea
          id="notes"
          name="notes"
          defaultValue={order?.notes}
          placeholder="Internal notes. Clients never see this."
        />
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : order ? "Save order" : "Open order"}
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
