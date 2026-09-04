import { PortalShell } from "@/components/portal/portal-shell";
import { requireClient } from "@/lib/auth/access";
import { countUnreadNotifications } from "@/lib/notifications/queries";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireClient();
  const unreadCount = await countUnreadNotifications(user.id);
  return (
    <PortalShell user={user} unreadCount={unreadCount}>
      {children}
    </PortalShell>
  );
}
