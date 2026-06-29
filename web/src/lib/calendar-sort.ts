/** Minutes from midnight for HH:MM (24h); null when missing or invalid. */
export function timeToMinutes(time: string | undefined): number | null {
  if (!time?.trim()) return null;
  const parts = time.trim().split(":");
  if (parts.length < 2) return null;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Fallback: parse the first HH:MM before a dash in titles like "Shift 07:00 – 15:00". */
export function startMinutesFromTitle(title: string): number | null {
  const match = title.match(/(\d{1,2}:\d{2})\s*[–-]/);
  return match ? timeToMinutes(match[1]) : null;
}

export function eventStartMinutes(event: { title: string; startTime?: string }): number | null {
  return timeToMinutes(event.startTime) ?? startMinutesFromTitle(event.title);
}

/** Sort by date, then start time (earliest first), then title. Timed events precede all-day items. */
export function compareCalendarEvents<T extends { date: string; title: string; startTime?: string }>(
  a: T,
  b: T
): number {
  const dateCmp = a.date.localeCompare(b.date);
  if (dateCmp !== 0) return dateCmp;

  const ta = eventStartMinutes(a);
  const tb = eventStartMinutes(b);
  if (ta !== null && tb !== null) return ta - tb || a.title.localeCompare(b.title);
  if (ta !== null) return -1;
  if (tb !== null) return 1;
  return a.title.localeCompare(b.title);
}

export function sortCalendarEvents<T extends { date: string; title: string; startTime?: string }>(
  events: T[]
): T[] {
  return [...events].sort(compareCalendarEvents);
}

export function calendarEventsByDate<T extends { date: string; title: string; startTime?: string }>(
  events: T[]
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const event of sortCalendarEvents(events)) {
    const list = map.get(event.date) ?? [];
    list.push(event);
    map.set(event.date, list);
  }
  return map;
}
