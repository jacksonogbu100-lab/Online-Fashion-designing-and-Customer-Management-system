import { NotificationList } from "@/components/notifications/list";
import { requireStaff } from "@/lib/auth/access";
import { listNotificationsForCurrentUser } from "@/lib/notifications/queries";

export const metadata = {
  title: "Notifications",
};

export default async function StaffNotificationsPage() {
  await requireStaff();
  const notifications = await listNotificationsForCurrentUser();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          House
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight">
          Notifications
        </h1>
        <p className="mt-3 text-muted-foreground">
          Sittings on your calendar, and other house alerts. Nothing here is emailed.
        </p>
      </div>
      <NotificationList
        notifications={notifications}
        emptyTitle="No alerts yet"
        emptyDescription="When a sitting is booked for you, it will appear here. Order and invoice alerts go to the client portal."
      />
    </div>
  );
}
