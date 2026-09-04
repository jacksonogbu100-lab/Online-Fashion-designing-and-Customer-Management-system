import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { orderStatusLabel } from "@/lib/orders/format";
import { orderStatuses, type OrderDirectoryFilter } from "@/lib/orders/schemas";
import { cn } from "@/lib/utils";

export function OrderDirectoryFilters({
  query,
  filter,
}: {
  query: string;
  filter: OrderDirectoryFilter;
}) {
  return (
    <form className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Label htmlFor="order-search">Search</Label>
        <Input
          id="order-search"
          name="q"
          defaultValue={query}
          placeholder="Reference, title, or client"
        />
      </div>
      <div className="flex w-full flex-col gap-2 sm:w-52">
        <Label htmlFor="order-status">Status</Label>
        <Select id="order-status" name="status" defaultValue={filter}>
          <option value="open">Open work</option>
          {orderStatuses.map((status) => (
            <option key={status} value={status}>
              {orderStatusLabel(status)}
            </option>
          ))}
          <option value="all">All</option>
        </Select>
      </div>
      <button type="submit" className={cn(buttonVariants({ variant: "outline" }))}>
        Filter
      </button>
      {query || filter !== "open" ? (
        <Link href="/app/orders" className={cn(buttonVariants({ variant: "ghost" }))}>
          Clear
        </Link>
      ) : null}
    </form>
  );
}
