import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AppointmentNotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4">
      <h1 className="font-heading text-3xl font-medium tracking-tight">
        Appointment not found
      </h1>
      <p className="text-muted-foreground">
        That sitting is missing, or the link is no longer valid.
      </p>
      <Link href="/app/calendar" className={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
        Back to calendar
      </Link>
    </div>
  );
}
