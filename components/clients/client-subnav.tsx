import Link from "next/link";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { clientStatusLabel } from "@/lib/clients/format";
import type { ClientStatus } from "@/lib/clients/schemas";
import { cn } from "@/lib/utils";

export function ClientRecordTitle({
  client,
}: {
  client: { id: string; displayName: string; status: ClientStatus };
}) {
  return (
    <div>
      <Link
        href="/app/clients"
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← Clients
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <h1 className="font-heading text-4xl font-medium tracking-tight">
          {client.displayName}
        </h1>
        <Badge variant="outline">{clientStatusLabel(client.status)}</Badge>
      </div>
    </div>
  );
}

export function ClientSubnav({
  clientId,
  active,
}: {
  clientId: string;
  active: "overview" | "measurements" | "orders" | "appointments";
}) {
  return (
    <nav className="flex gap-1 border-b border-border/80">
      <TabLink href={`/app/clients/${clientId}`} active={active === "overview"}>
        Overview
      </TabLink>
      <TabLink
        href={`/app/clients/${clientId}/measurements`}
        active={active === "measurements"}
      >
        Measurements
      </TabLink>
      <TabLink href={`/app/clients/${clientId}/orders`} active={active === "orders"}>
        Orders
      </TabLink>
      <TabLink
        href={`/app/clients/${clientId}/appointments`}
        active={active === "appointments"}
      >
        Appointments
      </TabLink>
    </nav>
  );
}

function TabLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}
