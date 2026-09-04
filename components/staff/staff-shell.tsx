"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon } from "lucide-react";

import { Brand } from "@/components/brand";
import { NotificationBell } from "@/components/notifications/bell";
import { SignOutButton } from "@/components/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { roleLabel, type StaffRole } from "@/lib/auth/roles";
import type { SessionUser } from "@/lib/auth/session-user";
import { visibleStaffNav, type StaffNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

function isActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string;
  role: StaffRole;
  onNavigate?: () => void;
}) {
  const groups = visibleStaffNav(role);

  return (
    <nav className="flex flex-col gap-6">
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col gap-1">
          <p className="px-3 text-[11px] tracking-[0.2em] text-sidebar-foreground/45 uppercase">
            {group.title}
          </p>
          {group.items.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              active={isActive(pathname, item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: StaffNavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
      )}
    >
      {item.label}
    </Link>
  );
}

function SidebarBody({
  pathname,
  user,
  onNavigate,
}: {
  pathname: string;
  user: SessionUser & { role: StaffRole };
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-5 py-6">
        <Link href="/app" onClick={onNavigate} className="inline-block">
          <Brand inverted />
        </Link>
        <p className="mt-2 text-xs tracking-[0.16em] text-sidebar-foreground/50 uppercase">
          House
        </p>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-6">
        <NavLinks pathname={pathname} role={user.role} onNavigate={onNavigate} />
      </div>
      <div className="px-5 py-5">
        <Separator className="mb-4 bg-sidebar-border" />
        <p className="text-sm text-sidebar-foreground">{user.name}</p>
        <p className="mt-1 text-xs text-sidebar-foreground/50">{user.email}</p>
      </div>
    </div>
  );
}

export function StaffShell({
  user,
  unreadCount,
  children,
}: {
  user: SessionUser & { role: StaffRole };
  unreadCount: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-full bg-background">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 bg-sidebar print:hidden md:block">
        <SidebarBody pathname={pathname} user={user} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between gap-3 border-b border-border/80 bg-background/85 px-4 backdrop-blur-sm print:hidden md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <MobileNav pathname={pathname} user={user} />
            <Brand />
          </div>
          <div className="hidden md:block">
            <p className="text-sm text-muted-foreground">House workspace</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell href="/app/notifications" unreadCount={unreadCount} />
            <Badge variant="outline">{roleLabel(user.role)}</Badge>
            <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground sm:inline">
              {user.name}
            </span>
            <SignOutButton />
          </div>
        </header>
        <main className="flex-1 px-4 py-8 md:px-8 print:px-0 print:py-0">{children}</main>
      </div>
    </div>
  );
}

function MobileNav({
  pathname,
  user,
}: {
  pathname: string;
  user: SessionUser & { role: StaffRole };
}) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="outline" size="icon-sm" aria-label="Open menu" />
        }
      >
        <MenuIcon />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
        showCloseButton={false}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Studio navigation</SheetTitle>
        </SheetHeader>
        <SidebarBody pathname={pathname} user={user} />
      </SheetContent>
    </Sheet>
  );
}
