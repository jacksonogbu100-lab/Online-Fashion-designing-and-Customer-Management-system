import { MarkAllReadButton, OpenNotificationButton } from "@/components/notifications/actions";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatHouseDateTime } from "@/lib/clients/format";
import { notificationKindLabel } from "@/lib/notifications/format";
import type { NotificationKind } from "@/lib/notifications/schemas";

export function NotificationList({
  notifications,
  emptyTitle,
  emptyDescription,
}: {
  notifications: {
    id: string;
    kind: NotificationKind;
    title: string;
    body: string | null;
    readAt: Date | null;
    createdAt: Date;
  }[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (notifications.length === 0) {
    return (
      <Card className="border-none shadow-none ring-foreground/8">
        <CardHeader>
          <CardTitle>{emptyTitle}</CardTitle>
          <CardDescription>{emptyDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const unread = notifications.some((item) => !item.readAt);

  return (
    <div className="flex flex-col gap-4">
      {unread ? <MarkAllReadButton /> : null}
      <ul className="flex flex-col gap-2">
        {notifications.map((item) => (
          <li key={item.id}>
            <Card className="border-none shadow-none ring-foreground/8">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <OpenNotificationButton notificationId={item.id} title={item.title} />
                  <Badge variant="outline">{notificationKindLabel(item.kind)}</Badge>
                  {!item.readAt ? <Badge>New</Badge> : null}
                </div>
                <CardDescription>
                  {formatHouseDateTime(item.createdAt)}
                  {item.body ? ` · ${item.body}` : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
