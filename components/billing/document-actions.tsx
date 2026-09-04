"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  convertQuoteToInvoiceAction,
  sendDocumentAction,
  voidDocumentAction,
  type BillingFormState,
} from "@/lib/billing/actions";
import type { DocumentKind, DocumentStatus } from "@/lib/billing/schemas";

const initialState: BillingFormState = {};

export function SendDocumentButton({ documentId }: { documentId: string }) {
  const action = sendDocumentAction.bind(null, documentId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}

export function ConvertQuoteButton({ documentId }: { documentId: string }) {
  const action = convertQuoteToInvoiceAction.bind(null, documentId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Opening invoice…" : "Convert to invoice"}
      </Button>
    </form>
  );
}

export function VoidDocumentForm({
  documentId,
  kind,
  status,
}: {
  documentId: string;
  kind: DocumentKind;
  status: DocumentStatus;
}) {
  const action = voidDocumentAction.bind(null, documentId);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (status === "void") {
    return null;
  }

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Void this ${kind}? The record and any payments stay in the book.`,
          )
        ) {
          event.preventDefault();
        }
      }}
      className="flex flex-col gap-3"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="voidReason">Void reason</Label>
        <Textarea id="voidReason" name="voidReason" required placeholder="Wrong total, replaced by a new quote…" />
        {state.fieldErrors?.voidReason ? (
          <p className="text-xs text-destructive" role="alert">
            {state.fieldErrors.voidReason}
          </p>
        ) : null}
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="destructive" className="w-fit" disabled={pending}>
        {pending ? "Voiding…" : "Void"}
      </Button>
    </form>
  );
}
