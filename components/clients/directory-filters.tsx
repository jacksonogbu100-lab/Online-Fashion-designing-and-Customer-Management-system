import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ClientDirectoryFilter } from "@/lib/clients/schemas";
import { cn } from "@/lib/utils";

export function ClientDirectoryFilters({
  query,
  filter,
}: {
  query: string;
  filter: ClientDirectoryFilter;
}) {
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor="client-search">Search</Label>
        <Input
          id="client-search"
          name="q"
          defaultValue={query}
          placeholder="Name or email"
        />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-48">
        <Label htmlFor="client-status">Status</Label>
        <Select id="client-status" name="status" defaultValue={filter}>
          <option value="open">Leads and active</option>
          <option value="lead">Leads</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </Select>
      </div>
      <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
        Filter
      </button>
      {query || filter !== "open" ? (
        <Link href="/app/clients" className={cn(buttonVariants({ variant: "ghost" }))}>
          Clear
        </Link>
      ) : null}
    </form>
  );
}
