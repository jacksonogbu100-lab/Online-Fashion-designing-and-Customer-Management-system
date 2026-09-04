import { z } from "zod";

export const appointmentTypes = [
  "consultation",
  "measurement",
  "fitting",
  "pickup",
] as const;
export type AppointmentType = (typeof appointmentTypes)[number];

export const appointmentStatuses = [
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];

export const appointmentWriteSchema = z.object({
  type: z.enum(appointmentTypes),
  clientId: z.string().trim().min(1, "Choose a client."),
  orderId: z.string().trim(),
  staffId: z.string().trim().min(1, "Choose who is with the client."),
  startsAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose a start time."),
  endsAt: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Choose an end time."),
  location: z.string().trim().min(1, "Say where this happens.").max(120),
  notes: z.string().trim().max(2000),
});

export function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}
