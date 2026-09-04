export const notificationKinds = [
  "order_status",
  "appointment_reminder",
  "invoice_sent",
] as const;
export type NotificationKind = (typeof notificationKinds)[number];
