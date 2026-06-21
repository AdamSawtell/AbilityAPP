import type { RosterShiftRecord } from "@/lib/roster-shift";

export const ROSTER_WEEK_CSV_HEADERS = [
  "shift_date",
  "start_time",
  "end_time",
  "shift_type",
  "status",
  "client_search_key",
  "employee_search_key",
  "location_search_key",
  "booking_document_no",
  "shift_ref",
  "notes",
] as const;

export type RosterWeekCsvContext = {
  clients: ReadonlyArray<{ id: string; searchKey: string }>;
  employees: ReadonlyArray<{ id: string; searchKey: string }>;
  locations: ReadonlyArray<{ id: string; searchKey: string }>;
  serviceBookings: ReadonlyArray<{ id: string; documentNo: string }>;
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function lookupSearchKey(
  id: string,
  rows: ReadonlyArray<{ id: string; searchKey: string }>
): string {
  if (!id.trim()) return "";
  return rows.find((row) => row.id === id)?.searchKey ?? "";
}

function lookupDocumentNo(
  id: string,
  rows: ReadonlyArray<{ id: string; documentNo: string }>
): string {
  if (!id.trim()) return "";
  return rows.find((row) => row.id === id)?.documentNo ?? "";
}

export function buildRosterWeekCsv(
  shifts: RosterShiftRecord[],
  context: RosterWeekCsvContext
): string {
  const sorted = [...shifts].sort((a, b) => {
    if (a.shiftDate !== b.shiftDate) return a.shiftDate.localeCompare(b.shiftDate);
    if (a.startTime !== b.startTime) return a.startTime.localeCompare(b.startTime);
    return a.shiftRef.localeCompare(b.shiftRef);
  });

  const lines = [ROSTER_WEEK_CSV_HEADERS.join(",")];

  for (const shift of sorted) {
    lines.push(
      [
        shift.shiftDate,
        shift.startTime,
        shift.endTime,
        shift.shiftType,
        shift.status,
        lookupSearchKey(shift.clientId, context.clients),
        lookupSearchKey(shift.employeeId, context.employees),
        lookupSearchKey(shift.locationId, context.locations),
        lookupDocumentNo(shift.serviceBookingId, context.serviceBookings),
        shift.shiftRef,
        shift.notes,
      ]
        .map((cell) => csvEscape(cell ?? ""))
        .join(",")
    );
  }

  return lines.join("\r\n");
}

export function rosterWeekCsvFilename(weekStart: string): string {
  return `roster-week-${weekStart}.csv`;
}

export function downloadRosterWeekCsv(csv: string, filename: string): void {
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
