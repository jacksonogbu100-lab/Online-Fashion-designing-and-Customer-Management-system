"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Brand } from "@/components/brand";
import { NotificationBell } from "@/components/notifications/bell";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { roleLabel } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session-user";
import { portalNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function PortalShell({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser;
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b border-border/80">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Brand />
            <p className="mt-1 text-xs tracking-[0.18em] text-muted-foreground uppercase">
              Client portal
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <NotificationBell href="/portal/notifications" unreadCount={unreadCount} />
            <Badge variant="outline">{roleLabel(user.role)}</Badge>
            <span className="text-sm text-muted-foreground">{user.name}</span>
            <SignOutButton />
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 pb-3">
          {portalNav.map((item) => {
            const active =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">{children}</main>
    </div>
  );
}
