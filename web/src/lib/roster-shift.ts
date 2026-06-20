/** Roster shift — one worker assignment for a client on a date/time window. */
export type RosterShiftRecord = {
  id: string;
  shiftRef: string;
  clientId: string;
  employeeId: string;
  locationId: string;
  serviceBookingId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: string;
  status: string;
  notes: string;
  recurrenceGroupId: string;
  createdBy: string;
  updatedBy: string;
};

export const rosterShiftDropdowns = {
  shiftType: ["Standard", "Sleepover", "Active overnight", "Group"],
  status: ["Draft", "Published", "Completed", "Cancelled"],
};

export const initialRosterShifts: RosterShiftRecord[] = [
  {
    id: "rs-bern-mon-am",
    shiftRef: "BERN-MON-AM",
    clientId: "bp-bern",
    employeeId: "emp-isla",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-06",
    startTime: "09:00",
    endTime: "15:00",
    shiftType: "Standard",
    status: "Published",
    notes: "SIL morning — linked to booking 50145",
    recurrenceGroupId: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-wed-pm",
    shiftRef: "BERN-WED-PM",
    clientId: "bp-bern",
    employeeId: "emp-gabriela",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-08",
    startTime: "14:00",
    endTime: "20:00",
    shiftType: "Standard",
    status: "Published",
    notes: "Community access afternoon",
    recurrenceGroupId: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
  {
    id: "rs-bern-fri-am",
    shiftRef: "BERN-FRI-AM",
    clientId: "bp-bern",
    employeeId: "emp-isla",
    locationId: "loc-glenelg-sil",
    serviceBookingId: "sb-50145",
    shiftDate: "2025-10-10",
    startTime: "08:00",
    endTime: "12:00",
    shiftType: "Standard",
    status: "Published",
    notes: "",
    recurrenceGroupId: "",
    createdBy: "Isla Robinson",
    updatedBy: "Isla Robinson",
  },
];

export function normalizeRosterShift(record: RosterShiftRecord): RosterShiftRecord {
  return {
    ...record,
    shiftRef: record.shiftRef ?? "",
    clientId: record.clientId ?? "",
    employeeId: record.employeeId ?? "",
    locationId: record.locationId ?? "",
    serviceBookingId: record.serviceBookingId ?? "",
    shiftDate: record.shiftDate ?? "",
    startTime: record.startTime?.slice(0, 5) ?? "",
    endTime: record.endTime?.slice(0, 5) ?? "",
    shiftType: record.shiftType || "Standard",
    status: record.status || "Published",
    notes: record.notes ?? "",
    recurrenceGroupId: record.recurrenceGroupId ?? "",
  };
}

export function createRosterShift(
  partial: RosterShiftRecord,
  existing: RosterShiftRecord[]
): RosterShiftRecord {
  const id = partial.id?.trim() || `rs-${Date.now()}`;
  const used = new Set(existing.map((r) => r.shiftRef).filter(Boolean));
  let shiftRef = partial.shiftRef?.trim() || `SHIFT-${existing.length + 1}`;
  if (used.has(shiftRef)) shiftRef = `${shiftRef}-${existing.length + 1}`;
  return normalizeRosterShift({
    ...partial,
    id,
    shiftRef,
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}

export function formatDayHeading(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  return d.toLocaleDateString("en-AU", { weekday: "short", day: "numeric", month: "short" });
}

export function formatShiftTimeRange(startTime: string, endTime: string): string {
  const start = startTime?.slice(0, 5) || "—";
  const end = endTime?.slice(0, 5) || "—";
  return `${start} – ${end}`;
}

/** Monday-based week start for a given ISO date. */
export function weekStartFromDate(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate.slice(0, 10);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function shiftsForWeek(shifts: RosterShiftRecord[], weekStart: string): RosterShiftRecord[] {
  const end = addDaysIso(weekStart, 6);
  return shifts.filter((s) => s.shiftDate >= weekStart && s.shiftDate <= end);
}

function parseTimeMinutes(value: string): number {
  const part = value?.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(part)) return 0;
  const [h, m] = part.split(":").map(Number);
  return h * 60 + m;
}

export function shiftDurationHours(shift: RosterShiftRecord): number {
  const start = parseTimeMinutes(shift.startTime);
  const end = parseTimeMinutes(shift.endTime);
  if (end <= start) return 0;
  return (end - start) / 60;
}

export function forwardWeekStarts(anchorWeekStart: string, weekCount: number): string[] {
  const count = Math.max(1, Math.min(12, weekCount));
  return Array.from({ length: count }, (_, i) => addDaysIso(anchorWeekStart, i * 7));
}
