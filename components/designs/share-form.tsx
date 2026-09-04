"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { setDesignShareAction } from "@/lib/designs/actions";

export function DesignShareForm({
  designId,
  sharedWithClient,
  hasClient,
}: {
  designId: string;
  sharedWithClient: boolean;
  hasClient: boolean;
}) {
  const action = setDesignShareAction.bind(null, designId);
  const [state, formAction, pending] = useActionState(action, {});

  if (!hasClient) {
    return (
      <p className="text-sm text-muted-foreground">
        Link a client on this design before it can appear in the portal.
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="sharedWithClient"
          defaultChecked={sharedWithClient}
          className="size-4 accent-primary"
        />
        Share with the linked client in the portal
      </label>
      <Button type="submit" variant="outline" size="sm" className="w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save sharing"}
      </Button>
    </form>
  );
}
