import Link from "next/link";
import { BellIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NotificationBell({
  href,
  unreadCount,
}: {
  href: string;
  unreadCount: number;
}) {
  const label =
    unreadCount > 0
      ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
      : "Notifications";

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(buttonVariants({ variant: "outline", size: "icon-sm" }), "relative")}
    >
      <BellIcon />
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
