import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import { employeeCapacityForWeek, weeklyCapacityHours } from "@/lib/roster-capacity-planning";
import { rankWorkersForClient } from "@/lib/roster-staff-client-matching";
import { isVacantShift, type RosterGap } from "@/lib/roster-gap-analysis";
import {
  normalizeRosterShift,
  shiftDurationHours,
  shiftsForWeek,
  weekStartFromDate,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

export type FillBoardCandidate = {
  employeeId: string;
  employeeName: string;
  score: number;
  remainingHours: number;
  topHint: string;
};

export type FillBoardVacancy = {
  shift: RosterShiftRecord;
  gap: RosterGap;
  shiftHours: number;
  candidates: FillBoardCandidate[];
};

export function vacantShiftsForFillBoard(shifts: RosterShiftRecord[]): RosterShiftRecord[] {
  return shifts
    .map(normalizeRosterShift)
    .filter((s) => isVacantShift(s))
    .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`));
}

export function buildFillBoardVacancies(params: {
  shifts: RosterShiftRecord[];
  employees: EmployeeRecord[];
  clients: ClientRecord[];
  weekStart: string;
  limit?: number;
}): FillBoardVacancy[] {
  const { shifts, employees, clients, weekStart, limit = 40 } = params;
  const vacant = vacantShiftsForFillBoard(shiftsForWeek(shifts, weekStart)).slice(0, limit);
  const activeEmployees = employees.filter((e) => e.employmentStatus === "Active");
  const capacityCache = new Map<string, ReturnType<typeof employeeCapacityForWeek>>();

  function capacityForShiftWeek(shiftDate: string) {
    const shiftWeekStart = weekStartFromDate(shiftDate);
    let rows = capacityCache.get(shiftWeekStart);
    if (!rows) {
      rows = employeeCapacityForWeek(shiftWeekStart, shifts, activeEmployees);
      capacityCache.set(shiftWeekStart, rows);
    }
    return rows;
  }

  return vacant.map((shift) => {
    const shiftHours = shiftDurationHours(shift);
    const client = clients.find((c) => c.id === shift.clientId);
    const ranked = client
      ? rankWorkersForClient({
          client,
          employees: activeEmployees,
          rosterShifts: shifts,
          excludeShiftId: shift.id,
        })
      : [];

    const capacityByEmployee = new Map(
      capacityForShiftWeek(shift.shiftDate).map((row) => [row.employeeId, row])
    );

    const candidates: FillBoardCandidate[] = ranked.slice(0, 8).map((row) => {
      const cap = capacityByEmployee.get(row.employeeId);
      return {
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        score: row.score,
        remainingHours: cap?.remainingHours ?? weeklyCapacityHours(
          activeEmployees.find((e) => e.id === row.employeeId)!
        ),
        topHint: row.hints[0]?.message ?? "",
      };
    }).filter((c) => c.remainingHours >= shiftHours - 0.01);

    const gap: RosterGap = {
      code: "VACANT_SHIFT",
      severity: shift.status === "Published" ? "error" : "warning",
      message:
        shift.status === "Published"
          ? `Published shift on ${shift.shiftDate} has no worker assigned.`
          : `Vacant shift on ${shift.shiftDate} — assign a worker before publishing.`,
      clientId: shift.clientId,
      shiftId: shift.id,
      shiftDate: shift.shiftDate,
      weekStart: weekStartFromDate(shift.shiftDate),
      serviceBookingId: shift.serviceBookingId || undefined,
    };

    return { shift, gap, shiftHours, candidates };
  });
}
