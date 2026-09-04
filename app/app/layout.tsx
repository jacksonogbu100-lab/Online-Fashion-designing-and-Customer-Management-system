import { StaffShell } from "@/components/staff/staff-shell";
import { requireStaff } from "@/lib/auth/access";
import { countUnreadNotifications } from "@/lib/notifications/queries";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireStaff();
  const unreadCount = await countUnreadNotifications(user.id);
  return (
    <StaffShell user={user} unreadCount={unreadCount}>
      {children}
    </StaffShell>
  );
}
