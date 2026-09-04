import Link from "next/link";

import { ClientDirectoryFilters } from "@/components/clients/directory-filters";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireStaff } from "@/lib/auth/access";
import { clientStatusLabel, formatHouseDate } from "@/lib/clients/format";
import { listClientsForStaff, parseDirectoryFilter } from "@/lib/clients/queries";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Clients",
};

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireStaff();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const filter = parseDirectoryFilter(params.status);
  const clients = await listClientsForStaff({ query, filter });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
            House book
          </p>
          <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
            Clients
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Everyone Sunnex Clothing dresses. Archived names stay in the book
            but stay out of the daily list.
          </p>
        </div>
        <Link href="/app/clients/new" className={cn(buttonVariants())}>
          Add client
        </Link>
      </div>

      <ClientDirectoryFilters query={query} filter={filter} />

      {clients.length === 0 ? (
        <EmptyDirectory query={query} filter={filter} />
      ) : (
        <ul className="flex flex-col gap-3">
          {clients.map((client) => (
            <li key={client.id}>
              <Link href={`/app/clients/${client.id}`} className="block">
                <Card className="border-none shadow-none ring-foreground/8 transition-colors hover:bg-muted/60">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{client.displayName}</CardTitle>
                      <Badge variant="outline">
                        {clientStatusLabel(client.status)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {client.email ?? "No email"}
                      {client.phone ? ` · ${client.phone}` : ""}
                      {` · Updated ${formatHouseDate(client.updatedAt)}`}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyDirectory({
  query,
  filter,
}: {
  query: string;
  filter: string;
}) {
  const searching = Boolean(query) || filter !== "open";

  return (
    <Card className="border-none shadow-none ring-foreground/8">
      <CardHeader>
        <CardTitle>{searching ? "No matching clients" : "No clients yet"}</CardTitle>
        <CardDescription>
          {searching
            ? "Try another name or email, or include archived records."
            : "Add the first person the house will dress."}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
