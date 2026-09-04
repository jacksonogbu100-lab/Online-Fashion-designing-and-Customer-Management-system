"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { uploadDesignImageAction } from "@/lib/designs/actions";
import { designImageKindLabel } from "@/lib/designs/format";
import { designImageKinds } from "@/lib/designs/schemas";

export function DesignImageUpload({ designId }: { designId: string }) {
  const action = uploadDesignImageAction.bind(null, designId);
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4">
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="design-image">Image</Label>
          <input
            id="design-image"
            name="file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            required
            className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="image-kind">Kind</Label>
          <Select id="image-kind" name="kind" defaultValue="sketch">
            {designImageKinds.map((kind) => (
              <option key={kind} value={kind}>
                {designImageKindLabel(kind)}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Button type="submit" variant="outline" className="w-fit" disabled={pending}>
        {pending ? "Uploading…" : "Add image"}
      </Button>
    </form>
  );
}
