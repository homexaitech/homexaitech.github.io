import type { Recurrence } from "./types";

// Curated IANA zones for the team. The viewer's own zone is prepended at runtime
// if it isn't already here (see timezoneOptions()).
export const COMMON_TIMEZONES: { value: string; label: string }[] = [
  { value: "America/Los_Angeles", label: "Los Angeles (Pacific)" },
  { value: "America/Denver", label: "Denver (Mountain)" },
  { value: "America/Chicago", label: "Chicago (Central)" },
  { value: "America/New_York", label: "New York (Eastern)" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Berlin", label: "Berlin / Paris" },
  { value: "Asia/Shanghai", label: "Shanghai / Beijing" },
  { value: "Asia/Kolkata", label: "India (Kolkata)" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Australia/Sydney", label: "Sydney" },
];

export function localTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

// The viewer's zone first, then the curated list (de-duplicated).
export function timezoneOptions(): { value: string; label: string }[] {
  const local = localTimezone();
  const has = COMMON_TIMEZONES.some((t) => t.value === local);
  return has
    ? COMMON_TIMEZONES
    : [{ value: local, label: `${local} (your timezone)` }, ...COMMON_TIMEZONES];
}

// Offset (minutes) of `tz` at the given instant: (wall time in tz) − UTC.
function offsetMinutes(date: Date, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(date).map((x) => [x.type, x.value]),
  );
  const hour = p.hour === "24" ? 0 : Number(p.hour);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    hour,
    Number(p.minute),
    Number(p.second),
  );
  return (asUtc - date.getTime()) / 60000;
}

// "YYYY-MM-DDTHH:mm" interpreted as wall time in `tz` → UTC ISO string.
export function zonedWallToUtc(wall: string, tz: string): string {
  const provisional = new Date(wall + ":00Z"); // treat wall as if UTC
  let utc = new Date(provisional.getTime() - offsetMinutes(provisional, tz) * 60000);
  // One refinement pass handles DST boundaries.
  utc = new Date(provisional.getTime() - offsetMinutes(utc, tz) * 60000);
  return utc.toISOString();
}

// UTC ISO → "YYYY-MM-DDTHH:mm" wall time in `tz` (for the datetime-local input).
export function utcToZonedWall(iso: string, tz: string): string {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const p = Object.fromEntries(
    dtf.formatToParts(new Date(iso)).map((x) => [x.type, x.value]),
  );
  const hour = p.hour === "24" ? "00" : p.hour;
  return `${p.year}-${p.month}-${p.day}T${hour}:${p.minute}`;
}

// Render a UTC instant in the VIEWER's local timezone, with the zone abbrev.
export function formatInLocal(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

// Next occurrence at or after `now` for a (possibly recurring) meeting. For
// non-recurring meetings returns the anchor instant (which may be in the past).
export function nextOccurrence(
  iso: string,
  recurrence: Recurrence,
  now: number,
): Date {
  const anchor = new Date(iso);
  if (recurrence === "none" || anchor.getTime() >= now) return anchor;
  if (recurrence === "monthly") {
    let d = new Date(anchor);
    while (d.getTime() < now) d = addMonths(d, 1);
    return d;
  }
  const stepDays =
    recurrence === "daily" ? 1 : recurrence === "weekly" ? 7 : 14;
  const stepMs = stepDays * 24 * 60 * 60 * 1000;
  const steps = Math.ceil((now - anchor.getTime()) / stepMs);
  return new Date(anchor.getTime() + steps * stepMs);
}
