import Link from "next/link";

import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/access";
import { homeForRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const user = await getCurrentUser();
  const primaryHref = user ? homeForRole(user.role) : "/login";
  const primaryLabel = user
    ? user.role === "client"
      ? "Open your portal"
      : "Enter Sunnex Clothing"
    : "Enter Sunnex Clothing";

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-6 md:px-10">
        <Brand />
        {user ? (
          <Link
            href={primaryHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {user.name}
          </Link>
        ) : (
          <Link
            href="/login"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Sign in
          </Link>
        )}
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-12 px-6 pb-24 md:px-10">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.28em] text-muted-foreground uppercase">
            Case study
          </p>
          <h1 className="mt-4 font-heading text-5xl leading-[1.05] font-medium tracking-tight text-balance md:text-7xl">
            Sunnex Clothing — clients, fit, and design in one house.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            This system is built around Sunnex Clothing, a Mumbai denim and
            casualwear house. Staff keep client files, tape charts, original
            designs, and production work together — for the brand, not as a
            public shop.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={primaryHref} className={cn(buttonVariants({ size: "lg" }))}>
              {primaryLabel}
            </Link>
          </div>
        </div>

        <ul className="grid gap-6 border-t border-border/80 pt-10 sm:grid-cols-3">
          <li>
            <p className="font-heading text-xl">Clients</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Profiles, notes, and measurement history for every person Sunnex
              Clothing dresses.
            </p>
          </li>
          <li>
            <p className="font-heading text-xl">Designs</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Denim and casual collections, sketches, and construction notes
              kept with the commission.
            </p>
          </li>
          <li>
            <p className="font-heading text-xl">The workroom</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Orders, fittings, materials, and invoices without leaving the
              house.
            </p>
          </li>
        </ul>
      </main>
    </div>
  );
}
