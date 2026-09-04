import Link from "next/link";

import { Brand } from "@/components/brand";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/access";
import { homeForRole } from "@/lib/auth/roles";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "No access",
};

export default async function ForbiddenPage() {
  const user = await getCurrentUser();
  const home = user ? homeForRole(user.role) : "/login";

  return (
    <div className="flex min-h-full flex-col">
      <header className="px-6 py-6 md:px-10">
        <Link href="/">
          <Brand />
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-6 pb-20">
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Restricted
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          This door is not yours
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          You are signed in, but this part of the house belongs to another role.
          Staff work at Sunnex Clothing. Clients use the portal.
        </p>
        <Link href={home} className={cn(buttonVariants({ size: "lg" }), "mt-8 w-fit")}>
          Return to your area
        </Link>
      </main>
    </div>
  );
}
