import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { DesignDirectoryFilter } from "@/lib/designs/schemas";
import { cn } from "@/lib/utils";

export function DesignDirectoryFilters({
  query,
  filter,
}: {
  query: string;
  filter: DesignDirectoryFilter;
}) {
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor="design-search">Search</Label>
        <Input
          id="design-search"
          name="q"
          defaultValue={query}
          placeholder="Title or description"
        />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-52">
        <Label htmlFor="design-status">Status</Label>
        <Select id="design-status" name="status" defaultValue={filter}>
          <option value="open">Open work</option>
          <option value="concept">Concept</option>
          <option value="in_development">In development</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </Select>
      </div>
      <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
        Filter
      </button>
      {query || filter !== "open" ? (
        <Link href="/app/designs" className={cn(buttonVariants({ variant: "ghost" }))}>
          Clear
        </Link>
      ) : null}
    </form>
  );
}
