/** AB-0032 — Employee contracted minimum hours per pay period. */
import type { EmployeeRecord } from "@/lib/employee";
import type { PayPeriodInstanceRecord } from "@/lib/pay-period";
import { assignedWorkerIdsForShift, isFillWorkerLine } from "@/lib/roster-session";
import { normalizeRosterShift, shiftDurationHours, type RosterShiftRecord } from "@/lib/roster-shift";

export type ContractedHoursPeriod = "week" | "fortnight" | "month";

export const CONTRACTED_HOURS_PERIOD_OPTIONS: { value: ContractedHoursPeriod; label: string }[] = [
  { value: "fortnight", label: "Per fortnight (pay period)" },
  { value: "week", label: "Per week" },
  { value: "month", label: "Per calendar month" },
];

export function normalizeContractedHoursPeriod(value: unknown): ContractedHoursPeriod {
  if (value === "week" || value === "month") return value;
  return "fortnight";
}

export function defaultContractedHoursForEmployee(employee: EmployeeRecord): number {
  const type = employee.employmentType?.trim().toLowerCase() ?? "";
  if (type.includes("casual") || type.includes("contractor") || type.includes("volunteer")) return 0;
  if (employee.contractedHoursPerPeriod != null && employee.contractedHoursPerPeriod !== "") {
    const n = Number(employee.contractedHoursPerPeriod);
    if (Number.isFinite(n) && n > 0) return n;
  }
  const weekly = parseFloat(String(employee.standardHoursPerWeek ?? "").replace(/,/g, ""));
  if (Number.isFinite(weekly) && weekly > 0) {
    const period = normalizeContractedHoursPeriod(employee.contractedHoursPeriod);
    if (period === "week") return weekly;
    if (period === "month") return Math.round(weekly * (52 / 12) * 10) / 10;
    return Math.round(weekly * 2 * 10) / 10;
  }
  if (type.includes("full")) return 76;
  if (type.includes("part")) return 0;
  return 0;
}

export function contractedHoursRequired(employee: EmployeeRecord): boolean {
  const type = employee.employmentType?.trim().toLowerCase() ?? "";
  return type.includes("part") || type.includes("full");
}

export function rosteredHoursForEmployeeInRange(
  employeeId: string,
  rangeStart: string,
  rangeEnd: string,
  shifts: RosterShiftRecord[]
): number {
  const id = employeeId.trim();
  let total = 0;
  for (const shift of shifts.map(normalizeRosterShift)) {
    if (shift.status === "Cancelled") continue;
    if (shift.shiftDate < rangeStart || shift.shiftDate > rangeEnd) continue;
    const workerIds = assignedWorkerIdsForShift(shift);
    if (!workerIds.includes(id)) continue;
    total += shiftDurationHours(shift);
  }
  return Math.round(total * 100) / 100;
}

export type EmployeeContractedSummary = {
  employeeId: string;
  employeeName: string;
  employmentType: string;
  contractedHours: number;
  rosteredHours: number;
  shortfallHours: number;
  metContract: boolean;
  priorityCandidate: boolean;
};

export function summarizeEmployeeContractedHours(
  employee: EmployeeRecord,
  payPeriod: PayPeriodInstanceRecord,
  shifts: RosterShiftRecord[]
): EmployeeContractedSummary {
  const contractedHours = defaultContractedHoursForEmployee(employee);
  const rosteredHours = rosteredHoursForEmployeeInRange(
    employee.id,
    payPeriod.startDate,
    payPeriod.endDate,
    shifts
  );
  const shortfallHours =
    contractedHours > 0 ? Math.max(0, Math.round((contractedHours - rosteredHours) * 100) / 100) : 0;
  return {
    employeeId: employee.id,
    employeeName: employee.name,
    employmentType: employee.employmentType,
    contractedHours,
    rosteredHours,
    shortfallHours,
    metContract: contractedHours <= 0 || shortfallHours <= 0,
    priorityCandidate: shortfallHours > 0,
  };
}

export function employeesWithContractShortfall(
  employees: EmployeeRecord[],
  payPeriod: PayPeriodInstanceRecord,
  shifts: RosterShiftRecord[]
): EmployeeContractedSummary[] {
  return employees
    .filter((e) => e.employmentStatus === "Active")
    .map((employee) => summarizeEmployeeContractedHours(employee, payPeriod, shifts))
    .filter((row) => row.contractedHours > 0 && row.shortfallHours > 0)
    .sort((a, b) => b.shortfallHours - a.shortfallHours);
}

export function contractedHoursPriorityScore(
  employee: EmployeeRecord,
  payPeriod: PayPeriodInstanceRecord,
  shifts: RosterShiftRecord[]
): number {
  const summary = summarizeEmployeeContractedHours(employee, payPeriod, shifts);
  return summary.shortfallHours;
}

/** Sort key for marketplace / find-and-fill — higher = more urgent contracted shortfall. */
export function compareContractedHoursPriority(
  employeeA: EmployeeRecord,
  employeeB: EmployeeRecord,
  payPeriod: PayPeriodInstanceRecord,
  shifts: RosterShiftRecord[]
): number {
  return (
    contractedHoursPriorityScore(employeeB, payPeriod, shifts) -
    contractedHoursPriorityScore(employeeA, payPeriod, shifts)
  );
}

export function formatContractedHoursIndicator(summary: EmployeeContractedSummary): string {
  if (summary.contractedHours <= 0) return "";
  return `Rostered ${summary.rosteredHours} of ${summary.contractedHours} contracted hrs`;
}
