import type { EmployeeRecord } from "@/lib/employee";
import {
  forwardWeekStarts,
  normalizeRosterShift,
  shiftDurationHours,
  shiftsForWeek,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

/** Default weekly capacity by employment type (SCHADS planning baseline). */
export const DEFAULT_WEEKLY_CAPACITY_HOURS: Record<string, number> = {
  "Full-time": 38,
  "Part-time": 24,
  Casual: 38,
  Contractor: 38,
  Volunteer: 8,
};

export type WeekCapacitySummary = {
  weekStart: string;
  demandHours: number;
  staffedHours: number;
  unstaffedHours: number;
  supplyHours: number;
  utilizationPct: number;
  surplusHours: number;
  overCapacityWorkers: number;
};

export type EmployeeWeekCapacity = {
  employeeId: string;
  weekStart: string;
  capacityHours: number;
  rosteredHours: number;
  remainingHours: number;
  overCapacity: boolean;
};

export function weeklyCapacityHours(employee: EmployeeRecord): number {
  if (employee.employmentStatus !== "Active") return 0;
  return DEFAULT_WEEKLY_CAPACITY_HOURS[employee.employmentType] ?? 38;
}

export function activeRosterEmployees(employees: EmployeeRecord[]): EmployeeRecord[] {
  return employees.filter((e) => e.employmentStatus === "Active");
}

export function summarizeWeekCapacity(
  weekStart: string,
  shifts: RosterShiftRecord[],
  employees: EmployeeRecord[]
): WeekCapacitySummary {
  const weekShifts = shiftsForWeek(shifts.map(normalizeRosterShift), weekStart).filter(
    (s) => s.status !== "Cancelled"
  );
  let demandHours = 0;
  let staffedHours = 0;
  for (const shift of weekShifts) {
    const hours = shiftDurationHours(shift);
    demandHours += hours;
    if (shift.employeeId?.trim()) staffedHours += hours;
  }
  const unstaffedHours = Math.max(0, demandHours - staffedHours);
  const active = activeRosterEmployees(employees);
  const supplyHours = active.reduce((sum, e) => sum + weeklyCapacityHours(e), 0);
  const utilizationPct = supplyHours > 0 ? Math.round((staffedHours / supplyHours) * 1000) / 10 : 0;
  const surplusHours = Math.round((supplyHours - staffedHours) * 10) / 10;

  const employeeRows = employeeCapacityForWeek(weekStart, shifts, employees);
  const overCapacityWorkers = employeeRows.filter((r) => r.overCapacity).length;

  return {
    weekStart,
    demandHours: Math.round(demandHours * 10) / 10,
    staffedHours: Math.round(staffedHours * 10) / 10,
    unstaffedHours: Math.round(unstaffedHours * 10) / 10,
    supplyHours: Math.round(supplyHours * 10) / 10,
    utilizationPct,
    surplusHours,
    overCapacityWorkers,
  };
}

export function employeeCapacityForWeek(
  weekStart: string,
  shifts: RosterShiftRecord[],
  employees: EmployeeRecord[]
): EmployeeWeekCapacity[] {
  const weekShifts = shiftsForWeek(shifts.map(normalizeRosterShift), weekStart).filter(
    (s) => s.status !== "Cancelled" && s.employeeId?.trim()
  );
  const hoursByEmployee = new Map<string, number>();
  for (const shift of weekShifts) {
    const id = shift.employeeId.trim();
    hoursByEmployee.set(id, (hoursByEmployee.get(id) ?? 0) + shiftDurationHours(shift));
  }

  const employeeById = new Map(employees.map((e) => [e.id, e]));
  const rosteredIds = [...hoursByEmployee.keys()];
  const activeIds = employees.filter((e) => e.employmentStatus === "Active").map((e) => e.id);
  const ids = [...new Set([...activeIds, ...rosteredIds])];

  return ids
    .map((employeeId) => {
      const employee = employeeById.get(employeeId);
      const capacityHours = employee ? weeklyCapacityHours(employee) : 0;
      const rosteredHours = Math.round((hoursByEmployee.get(employeeId) ?? 0) * 10) / 10;
      const remainingHours = Math.round((capacityHours - rosteredHours) * 10) / 10;
      return {
        employeeId,
        weekStart,
        capacityHours,
        rosteredHours,
        remainingHours,
        overCapacity: rosteredHours > capacityHours,
      };
    })
    .filter((row) => row.capacityHours > 0 || row.rosteredHours > 0)
    .sort((a, b) => b.rosteredHours - a.rosteredHours);
}

export function buildCapacityPlan(
  anchorWeekStart: string,
  weekCount: number,
  shifts: RosterShiftRecord[],
  employees: EmployeeRecord[]
): { weeks: WeekCapacitySummary[]; employees: EmployeeRecord[] } {
  const weeks = forwardWeekStarts(anchorWeekStart, weekCount).map((weekStart) =>
    summarizeWeekCapacity(weekStart, shifts, employees)
  );
  return { weeks, employees: activeRosterEmployees(employees) };
}
