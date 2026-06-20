import { addDaysIso, formatDayHeading, type RosterShiftRecord } from "@/lib/roster-shift";
import { canWorkerCheckIn, canWorkerCheckOut } from "@/lib/roster-shift-checkin";

export type MyShiftsView = "today" | "upcoming" | "all";

export function localTodayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shiftNeedsWorkerAction(shift: RosterShiftRecord, employeeId: string): boolean {
  return canWorkerCheckIn(shift, employeeId).ok || canWorkerCheckOut(shift, employeeId).ok;
}

export function dayGroupLabel(shiftDate: string, today = localTodayIso()): string {
  const date = shiftDate.slice(0, 10);
  if (date === today) return "Today";
  if (date === addDaysIso(today, 1)) return "Tomorrow";
  if (date === addDaysIso(today, -1)) return "Yesterday";
  return formatDayHeading(date);
}

export function filterMyShiftsView(
  shifts: RosterShiftRecord[],
  view: MyShiftsView,
  employeeId: string,
  today = localTodayIso()
): RosterShiftRecord[] {
  if (view === "all") return shifts;
  if (view === "today") {
    const yesterday = addDaysIso(today, -1);
    return shifts.filter((s) => {
      const date = s.shiftDate.slice(0, 10);
      if (date === today) return true;
      return date === yesterday && shiftNeedsWorkerAction(s, employeeId);
    });
  }
  return shifts.filter((s) => s.shiftDate.slice(0, 10) > today);
}

export type MyShiftDayGroup = {
  date: string;
  label: string;
  shifts: RosterShiftRecord[];
};

export function groupShiftsByDate(
  shifts: RosterShiftRecord[],
  today = localTodayIso()
): MyShiftDayGroup[] {
  const byDate = new Map<string, RosterShiftRecord[]>();
  for (const shift of shifts) {
    const date = shift.shiftDate.slice(0, 10);
    const list = byDate.get(date) ?? [];
    list.push(shift);
    byDate.set(date, list);
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayShifts]) => ({
      date,
      label: dayGroupLabel(date, today),
      shifts: dayShifts,
    }));
}

/** First shift the worker should check out or check in (today and overdue yesterday). */
export function nextMyShiftAction(
  shifts: RosterShiftRecord[],
  employeeId: string,
  today = localTodayIso()
): RosterShiftRecord | null {
  const yesterday = addDaysIso(today, -1);
  const candidates = shifts.filter((s) => {
    const date = s.shiftDate.slice(0, 10);
    if (date === today) return true;
    return date === yesterday && shiftNeedsWorkerAction(s, employeeId);
  });
  for (const shift of candidates) {
    if (canWorkerCheckOut(shift, employeeId).ok) return shift;
  }
  for (const shift of candidates) {
    if (canWorkerCheckIn(shift, employeeId).ok) return shift;
  }
  return null;
}

export function countMyShiftsView(
  shifts: RosterShiftRecord[],
  employeeId: string,
  today = localTodayIso()
): Record<MyShiftsView, number> {
  return {
    today: filterMyShiftsView(shifts, "today", employeeId, today).length,
    upcoming: shifts.filter((s) => s.shiftDate.slice(0, 10) > today).length,
    all: shifts.length,
  };
}
