import type { AppointmentStatus, AppointmentType } from "@/lib/appointments/schemas";

export function appointmentTypeLabel(type: AppointmentType): string {
  switch (type) {
    case "consultation":
      return "Consultation";
    case "measurement":
      return "Measurement";
    case "fitting":
      return "Fitting";
    case "pickup":
      return "Pickup";
  }
}

export function appointmentStatusLabel(status: AppointmentStatus): string {
  switch (status) {
    case "scheduled":
      return "Scheduled";
    case "completed":
      return "Completed";
    case "no_show":
      return "No-show";
    case "cancelled":
      return "Cancelled";
  }
}

export function appointmentStatusClientLabel(status: AppointmentStatus): string {
  switch (status) {
    case "scheduled":
      return "Booked";
    case "completed":
      return "Done";
    case "no_show":
      return "Missed";
    case "cancelled":
      return "Cancelled";
  }
}

export function isOpenAppointmentStatus(status: AppointmentStatus): boolean {
  return status === "scheduled";
}
