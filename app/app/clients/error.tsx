"use client";

import { Button } from "@/components/ui/button";

export default function ClientsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Could not load clients
      </h1>
      <p className="text-muted-foreground">
        The house book failed to open. Try again in a moment.
      </p>
      <Button type="button" variant="outline" className="w-fit" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
