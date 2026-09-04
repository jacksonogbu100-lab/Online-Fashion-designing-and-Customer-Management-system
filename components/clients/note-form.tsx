"use client";

import { useActionState } from "react";

import { addClientNoteAction, type NoteFormState } from "@/lib/clients/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: NoteFormState = {};

export function ClientNoteForm({ clientId }: { clientId: string }) {
  const action = addClientNoteAction.bind(null, clientId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Label htmlFor="note-body">Add a note</Label>
      <Textarea
        id="note-body"
        name="body"
        required
        placeholder="Fitting conversation, fabric preference, next step…"
      />
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save note"}
      </Button>
    </form>
  );
}
