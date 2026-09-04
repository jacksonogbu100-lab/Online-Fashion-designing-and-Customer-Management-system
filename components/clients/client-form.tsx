"use client";

import { useActionState } from "react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  type ClientFormState,
  createClientAction,
  updateClientAction,
} from "@/lib/clients/actions";
import { clientStatusLabel } from "@/lib/clients/format";
import { clientStatuses } from "@/lib/clients/schemas";
import { cn } from "@/lib/utils";

type PortalUserOption = {
  id: string;
  name: string;
  email: string;
};

type ClientFormValues = {
  id?: string;
  displayName: string;
  email: string;
  phone: string;
  addressLine1: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  styleNotes: string;
  status: "lead" | "active" | "archived";
  portalUserId: string;
};

const initialState: ClientFormState = {};

export function ClientForm({
  client,
  portalUsers,
}: {
  client?: ClientFormValues;
  portalUsers: PortalUserOption[];
}) {
  const action = client?.id
    ? updateClientAction.bind(null, client.id)
    : createClientAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const cancelHref = client?.id ? `/app/clients/${client.id}` : "/app/clients";

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="displayName" error={state.fieldErrors?.displayName}>
          <Input
            id="displayName"
            name="displayName"
            required
            defaultValue={client?.displayName}
            aria-invalid={state.fieldErrors?.displayName ? true : undefined}
          />
        </Field>
        <Field label="Email" htmlFor="email" error={state.fieldErrors?.email}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email}
            aria-invalid={state.fieldErrors?.email ? true : undefined}
          />
        </Field>
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={client?.phone} />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={client?.status ?? "lead"}>
            {clientStatuses.map((status) => (
              <option key={status} value={status}>
                {clientStatusLabel(status)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Address" htmlFor="addressLine1" className="sm:col-span-2">
          <Input
            id="addressLine1"
            name="addressLine1"
            defaultValue={client?.addressLine1}
          />
        </Field>
        <Field label="City" htmlFor="city">
          <Input id="city" name="city" defaultValue={client?.city} />
        </Field>
        <Field label="Region" htmlFor="region">
          <Input id="region" name="region" defaultValue={client?.region} />
        </Field>
        <Field label="Postal code" htmlFor="postalCode">
          <Input id="postalCode" name="postalCode" defaultValue={client?.postalCode} />
        </Field>
        <Field label="Country" htmlFor="country">
          <Input id="country" name="country" defaultValue={client?.country} />
        </Field>
      </div>

      <Field label="Style notes" htmlFor="styleNotes">
        <Textarea
          id="styleNotes"
          name="styleNotes"
          defaultValue={client?.styleNotes}
          placeholder="Silhouette, fabrics, colours, occasions…"
        />
      </Field>

      <Field label="Portal login" htmlFor="portalUserId">
        <Select
          id="portalUserId"
          name="portalUserId"
          defaultValue={client?.portalUserId ?? ""}
        >
          <option value="">None yet</option>
          {portalUsers.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name} · {person.email}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : client?.id ? "Save client" : "Add client"}
        </Button>
        <Link
          href={cancelHref}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
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
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
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
