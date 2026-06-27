import { addDaysIso, normalizeRosterShift, weekStartFromDate, type RosterShiftRecord } from "@/lib/roster-shift";

/** Monday = 0 … Sunday = 6 (offset from week start). */
export const RECURRENCE_WEEKDAY_OPTIONS = [
  { offset: 0, label: "Mon" },
  { offset: 1, label: "Tue" },
  { offset: 2, label: "Wed" },
  { offset: 3, label: "Thu" },
  { offset: 4, label: "Fri" },
  { offset: 5, label: "Sat" },
  { offset: 6, label: "Sun" },
] as const;

export function weekdayOffsetFromDate(isoDate: string): number {
  const weekStart = weekStartFromDate(isoDate);
  const target = isoDate.slice(0, 10);
  for (let offset = 0; offset < 7; offset += 1) {
    if (addDaysIso(weekStart, offset) === target) return offset;
  }
  return 0;
}

/** Expand a template shift across weekly weekday offsets for `weekCount` weeks (including anchor week). */
export function expandWeeklyRecurrence(
  template: RosterShiftRecord,
  weekdayOffsets: number[],
  weekCount: number
): RosterShiftRecord[] {
  const normalized = normalizeRosterShift(template);
  const groupId = normalized.recurrenceGroupId?.trim() || `rg-${Date.now()}`;
  const anchorWeek = weekStartFromDate(normalized.shiftDate);
  const weeks = Math.max(1, weekCount);
  const offsets = [...new Set(weekdayOffsets)].sort((a, b) => a - b);
  const results: RosterShiftRecord[] = [];

  for (let w = 0; w < weeks; w += 1) {
    const weekStart = addDaysIso(anchorWeek, w * 7);
    for (const offset of offsets) {
      const shiftDate = addDaysIso(weekStart, offset);
      if (shiftDate < normalized.shiftDate.slice(0, 10)) continue;
      const isAnchor = shiftDate === normalized.shiftDate.slice(0, 10);
      const shiftId = isAnchor && normalized.id ? normalized.id : `${groupId}-${shiftDate}`;
      // Child line ids are primary keys, so each generated shift needs its own
      // client/worker line ids — reusing the template's ids collides on save.
      const clientLines = (normalized.clientLines ?? []).map((cl, i) =>
        isAnchor ? cl : { ...cl, id: `rscl-${shiftId}-${i + 1}`, lineNo: i + 1 }
      );
      const workerLines = (normalized.workerLines ?? []).map((wl, i) =>
        isAnchor ? wl : { ...wl, id: `rswl-${shiftId}-${i + 1}`, lineNo: i + 1 }
      );
      results.push(
        normalizeRosterShift({
          ...normalized,
          id: shiftId,
          shiftDate,
          recurrenceGroupId: groupId,
          shiftRef: normalized.shiftRef || `SHIFT-${shiftDate}`,
          clientLines,
          workerLines,
        })
      );
    }
  }

  return results;
}
