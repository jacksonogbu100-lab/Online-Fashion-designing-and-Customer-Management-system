"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { setCurrentMeasurementProfileAction } from "@/lib/measurements/actions";

export function SetCurrentButton({
  clientId,
  profileId,
}: {
  clientId: string;
  profileId: string;
}) {
  const action = setCurrentMeasurementProfileAction.bind(null, clientId, profileId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Setting…" : "Set current"}
      </Button>
    </form>
  );
}
