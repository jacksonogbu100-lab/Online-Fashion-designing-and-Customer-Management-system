import Link from "next/link";
import { redirect } from "next/navigation";

import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth/access";
import { homeForRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Sign in",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; callbackUrl?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect(homeForRole(user.role));
  }

  const params = await searchParams;
  const requested = params.from ?? params.callbackUrl;
  const from =
    requested && requested.startsWith("/") && !requested.startsWith("//")
      ? requested
      : undefined;

  return (
    <div className="flex min-h-full flex-col">
      <header className="px-6 py-6 md:px-10">
        <Link href="/">
          <Brand />
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 pb-20">
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          House access
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Sign in
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Staff enter Sunnex Clothing. Clients enter the portal. The same
          form decides from your role.
        </p>
        <LoginForm from={from} />
      </main>
    </div>
  );
}
