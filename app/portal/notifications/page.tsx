import { NotificationList } from "@/components/notifications/list";
import { requireClient } from "@/lib/auth/access";
import { listNotificationsForCurrentUser } from "@/lib/notifications/queries";

export const metadata = {
  title: "Notifications",
};

export default async function PortalNotificationsPage() {
  await requireClient();
  const notifications = await listNotificationsForCurrentUser();

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <p className="text-xs tracking-[0.24em] text-muted-foreground uppercase">
          Client portal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight">
          Notifications
        </h1>
        <p className="mt-3 text-muted-foreground">
          Order updates, sitting reminders, and invoices Sunnex Clothing has sent you.
        </p>
      </div>
      <NotificationList
        notifications={notifications}
        emptyTitle="No alerts yet"
        emptyDescription="When the house moves your order, sends an invoice, or reminds you of a sitting, it will appear here."
      />
    </div>
  );
}
