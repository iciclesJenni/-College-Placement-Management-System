/**
 * Calendar Sync Layer — dynamic .ics (iCalendar) generation.
 *
 * Students can sync interview time blocks directly with Google Calendar,
 * Outlook, or Apple Calendar. Two paths:
 *
 *   1. `downloadIcsFile` — generates a standards-compliant .ics file
 *      (RFC 5545) that opens natively in Outlook / Apple Calendar and
 *      imports into Google Calendar.
 *   2. `googleCalendarUrl` / `outlookCalendarUrl` — one-click deep links
 *      that pre-fill Google Calendar and Outlook Web event composers.
 */

// ─── ICS primitives (RFC 5545) ───────────────────────────────────────────────

/** Format a Date as ICS UTC timestamp: 20260918T103000Z */
function icsDate(date: Date): string {
  return (
    date.getUTCFullYear().toString().padStart(4, "0") +
    String(date.getUTCMonth() + 1).padStart(2, "0") +
    String(date.getUTCDate()).padStart(2, "0") +
    "T" +
    String(date.getUTCHours()).padStart(2, "0") +
    String(date.getUTCMinutes()).padStart(2, "0") +
    String(date.getUTCSeconds()).padStart(2, "0") +
    "Z"
  );
}

/** Escape text per RFC 5545 §3.3.11 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fold long lines at 75 octets per RFC 5545 §3.1 */
function foldLine(line: string): string {
  if (line.length <= 73) return line;
  const parts: string[] = [line.slice(0, 73)];
  let rest = line.slice(73);
  while (rest.length > 0) {
    parts.push(" " + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  return parts.join("\r\n");
}

export interface CalendarEvent {
  /** Unique event identifier */
  uid: string;
  title: string;
  description?: string;
  location?: string;
  /** ISO datetime string of the start */
  startIso: string;
  /** Event duration in minutes */
  durationMinutes: number;
  /** Minutes before the event to trigger the reminder alarm (default 30) */
  reminderMinutesBefore?: number;
}

/** Build the full ICS document for one or more events. */
export function buildIcsCalendar(events: CalendarEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Placement Portal//Interview Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Placement Portal — Interviews",
  ];

  for (const ev of events) {
    const start = new Date(ev.startIso);
    const end = new Date(start.getTime() + ev.durationMinutes * 60_000);
    const stamp = new Date();

    lines.push("BEGIN:VEVENT");
    lines.push(foldLine(`UID:${ev.uid}`));
    lines.push(`DTSTAMP:${icsDate(stamp)}`);
    lines.push(`DTSTART:${icsDate(start)}`);
    lines.push(`DTEND:${icsDate(end)}`);
    lines.push(foldLine(`SUMMARY:${escapeIcsText(ev.title)}`));
    if (ev.description) lines.push(foldLine(`DESCRIPTION:${escapeIcsText(ev.description)}`));
    if (ev.location) lines.push(foldLine(`LOCATION:${escapeIcsText(ev.location)}`));
    lines.push("STATUS:CONFIRMED");
    lines.push("TRANSP:OPAQUE");

    // Reminder alarm
    const trigger = ev.reminderMinutesBefore ?? 30;
    lines.push("BEGIN:VALARM");
    lines.push(`TRIGGER:-PT${trigger}M`);
    lines.push("ACTION:DISPLAY");
    lines.push(foldLine(`DESCRIPTION:${escapeIcsText(ev.title)}`));
    lines.push("END:VALARM");

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
}

/** Generate and download an .ics file for the given events. */
export function downloadIcsFile(events: CalendarEvent[], filename: string): boolean {
  try {
    const ics = buildIcsCalendar(events);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch {
    return false;
  }
}

// ─── One-click deep links ────────────────────────────────────────────────────

function formatGcalDate(date: Date): string {
  return (
    date.getUTCFullYear().toString() +
    String(date.getUTCMonth() + 1).padStart(2, "0") +
    String(date.getUTCDate()).padStart(2, "0") +
    "T" +
    String(date.getUTCHours()).padStart(2, "0") +
    String(date.getUTCMinutes()).padStart(2, "0") +
    String(date.getUTCSeconds()).padStart(2, "0") +
    "Z"
  );
}

/** Pre-filled Google Calendar event composer link. */
export function googleCalendarUrl(ev: CalendarEvent): string {
  const start = new Date(ev.startIso);
  const end = new Date(start.getTime() + ev.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${formatGcalDate(start)}/${formatGcalDate(end)}`,
    details: ev.description ?? "",
    location: ev.location ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Pre-filled Outlook Web event composer link. */
export function outlookCalendarUrl(ev: CalendarEvent): string {
  const start = new Date(ev.startIso);
  const end = new Date(start.getTime() + ev.durationMinutes * 60_000);
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: ev.description ?? "",
    location: ev.location ?? "",
  });
  return `https://outlook.office.com/calendar/0/deeplink/compose?${params.toString()}`;
}
