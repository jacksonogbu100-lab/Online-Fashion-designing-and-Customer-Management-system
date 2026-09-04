export const STUDIO_TIME_ZONE = "Asia/Kolkata";
export const STUDIO_OFFSET = "+05:30";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function studioDate(
  year: number,
  month: number,
  day: number,
  hour = 0,
  minute = 0,
): Date {
  return new Date(
    `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00${STUDIO_OFFSET}`,
  );
}

export function studioParts(value: Date) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(value).map((part) => [part.type, part.value]),
  );

  return {
    weekday: parts.weekday ?? "Mon",
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function parseStudioDateTime(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}:00${STUDIO_OFFSET}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toStudioDateTimeInput(value: Date): string {
  const parts = studioParts(value);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

export function parseWeekParam(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = studioDate(
      Number(value.slice(0, 4)),
      Number(value.slice(5, 7)),
      Number(value.slice(8, 10)),
    );
    if (!Number.isNaN(date.getTime())) {
      return startOfStudioWeek(date);
    }
  }
  return startOfStudioWeek(new Date());
}

export function startOfStudioWeek(value: Date): Date {
  const parts = studioParts(value);
  const weekdayIndex = WEEKDAYS.indexOf(parts.weekday as (typeof WEEKDAYS)[number]);
  const offset = weekdayIndex === -1 ? 0 : weekdayIndex;
  const utc = studioDate(parts.year, parts.month, parts.day).getTime() - offset * 86_400_000;
  const monday = new Date(utc);
  const mondayParts = studioParts(monday);
  return studioDate(mondayParts.year, mondayParts.month, mondayParts.day);
}

export function addStudioDays(value: Date, days: number): Date {
  const shifted = new Date(value.getTime() + days * 86_400_000);
  const parts = studioParts(shifted);
  return studioDate(parts.year, parts.month, parts.day);
}

export function studioDayRange(value = new Date()): { start: Date; end: Date } {
  const parts = studioParts(value);
  const start = studioDate(parts.year, parts.month, parts.day);
  return { start, end: addStudioDays(start, 1) };
}

export function studioWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, index) => addStudioDays(weekStart, index));
}

export function weekParam(value: Date): string {
  const parts = studioParts(value);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatStudioDate(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatStudioWeekday(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIME_ZONE,
    weekday: "short",
  }).format(value);
}

export function formatStudioTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: STUDIO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(value);
}

export function formatStudioDateTime(value: Date): string {
  return `${formatStudioDate(value)} · ${formatStudioTime(value)}`;
}

export function formatStudioRange(startsAt: Date, endsAt: Date): string {
  return `${formatStudioDate(startsAt)} · ${formatStudioTime(startsAt)}–${formatStudioTime(endsAt)}`;
}

export function isSameStudioDay(left: Date, right: Date): boolean {
  const a = studioParts(left);
  const b = studioParts(right);
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

export function defaultDurationMinutes(
  type: "consultation" | "measurement" | "fitting" | "pickup",
): number {
  switch (type) {
    case "consultation":
      return 30;
    case "measurement":
      return 45;
    case "fitting":
      return 45;
    case "pickup":
      return 20;
  }
}

export function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * 60_000);
}

export function suggestedStartInput(dateParam?: string): string {
  if (dateParam && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateParam)) {
    return dateParam;
  }
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return `${dateParam}T11:00`;
  }
  const parts = studioParts(new Date());
  const nextHour = Math.min(parts.hour + 1, 18);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(Math.max(nextHour, 10))}:00`;
}
