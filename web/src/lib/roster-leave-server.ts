import type { EmployeeLeaveRequestRow, EmployeeRecord } from "@/lib/employee";
import { releaseShiftsForApprovedLeave } from "@/lib/roster-leave";
import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { rosterShiftFromRow, type RosterShiftRow } from "@/lib/supabase/mappers";
import {
  rosterShiftClientLineFromRow,
  rosterShiftWorkerLineFromRow,
  type RosterShiftClientLineRow,
  type RosterShiftWorkerLineRow,
} from "@/lib/supabase/roster-session-mappers";
import { saveRosterShifts } from "@/lib/supabase/data-api";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LeaveRosterReleaseResult = {
  releasedCount: number;
  skippedAttendance: number;
  updatedShifts: RosterShiftRecord[];
};

function groupBy<T extends Record<string, unknown>>(rows: T[], key: keyof T): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const id = String(row[key] ?? "");
    const list = map.get(id) ?? [];
    list.push(row);
    map.set(id, list);
  }
  return map;
}

async function fetchRosterShiftsInDateRange(
  supabase: SupabaseClient,
  startDate: string,
  endDate: string
): Promise<RosterShiftRecord[]> {
  const [shiftRes, clientLineRes, workerLineRes] = await Promise.all([
    supabase.from("roster_shift").select("*").gte("shift_date", startDate).lte("shift_date", endDate),
    supabase.from("roster_shift_client_line").select("*").order("line_no"),
    supabase.from("roster_shift_worker_line").select("*").order("line_no"),
  ]);
  if (shiftRes.error) throw shiftRes.error;
  if (clientLineRes.error) throw clientLineRes.error;
  if (workerLineRes.error) throw workerLineRes.error;

  const shiftIds = new Set((shiftRes.data ?? []).map((row) => String((row as RosterShiftRow).id)));
  const clientLinesByShift = groupBy(
    ((clientLineRes.data ?? []) as RosterShiftClientLineRow[]).filter((row) => shiftIds.has(row.roster_shift_id)),
    "roster_shift_id"
  );
  const workerLinesByShift = groupBy(
    ((workerLineRes.data ?? []) as RosterShiftWorkerLineRow[]).filter((row) => shiftIds.has(row.roster_shift_id)),
    "roster_shift_id"
  );

  return ((shiftRes.data ?? []) as RosterShiftRow[]).map((row) =>
    normalizeRosterShift({
      ...rosterShiftFromRow(row),
      clientLines: (clientLinesByShift.get(row.id) ?? []).map((line) => rosterShiftClientLineFromRow(line)),
      workerLines: (workerLinesByShift.get(row.id) ?? []).map((line) => rosterShiftWorkerLineFromRow(line)),
    })
  );
}

/** Vacate rolled shifts in the leave date range and add planned leave-pay worker lines. */
export async function releaseRosterShiftsForApprovedLeave(
  supabase: SupabaseClient,
  employee: EmployeeRecord,
  leaveRequest: EmployeeLeaveRequestRow,
  actor: string
): Promise<LeaveRosterReleaseResult> {
  const start = leaveRequest.startDate.slice(0, 10);
  const end = leaveRequest.endDate.slice(0, 10);
  const shifts = await fetchRosterShiftsInDateRange(supabase, start, end);
  const result = releaseShiftsForApprovedLeave(shifts, employee, leaveRequest, actor);
  const beforeById = new Map(shifts.map((shift) => [shift.id, shift]));
  const updatedShifts = result.shifts.filter((shift) => {
    const before = beforeById.get(shift.id);
    return before && JSON.stringify(before) !== JSON.stringify(shift);
  });

  if (updatedShifts.length) {
    await saveRosterShifts(supabase, updatedShifts);
  }

  return {
    releasedCount: result.releasedCount,
    skippedAttendance: result.skippedAttendance,
    updatedShifts,
  };
}
