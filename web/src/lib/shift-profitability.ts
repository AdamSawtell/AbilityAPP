/** AB-0031 — Shift cost vs income and profitability (SCHADS planning baseline). */
import { isShiftBillable } from "@/lib/buddy-shift";
import type { EmployeeRecord } from "@/lib/employee";
import {
  SCHADS_EMPLOYMENT_LOADING,
  SCHADS_PLANNING_LEVELS,
  defaultSchadsLevelForCategory,
  schadsHourlyRate,
} from "@/lib/schads-cost-prediction";
import { assignedWorkerIdsForShift } from "@/lib/roster-session";
import { normalizeRosterShift, shiftDurationHours, type RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";

/** Default NDIS daytime support price cap (planning baseline 2025-26). */
export const DEFAULT_NDIS_DAYTIME_RATE = 70.23;

export type ShiftCostBreakdown = {
  baseRate: number;
  penaltyMultiplier: number;
  casualLoading: number;
  grossWage: number;
  superRate: number;
  superAmount: number;
  totalCost: number;
  hours: number;
  levelLabel: string;
};

export type ShiftProfitability = {
  shiftId: string;
  shiftDate: string;
  employeeId: string;
  hours: number;
  cost: number;
  income: number;
  margin: number;
  marginPct: number | null;
  breakdown: ShiftCostBreakdown;
};

function parseIsoDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00`);
}

function shiftDayType(shiftDate: string): "weekday" | "saturday" | "sunday" {
  const day = parseIsoDate(shiftDate).getDay();
  if (day === 6) return "saturday";
  if (day === 0) return "sunday";
  return "weekday";
}

function eveningPenaltyApplies(startTime: string, endTime: string): boolean {
  const startM = /^(\d{1,2}):(\d{2})/.exec(startTime.trim());
  const endM = /^(\d{1,2}):(\d{2})/.exec(endTime.trim());
  if (!startM || !endM) return false;
  const startMin = Number(startM[1]) * 60 + Number(startM[2]);
  const endMin = Number(endM[1]) * 60 + Number(endM[2]);
  const eveningStart = 20 * 60;
  return startMin >= eveningStart || endMin > eveningStart;
}

export function penaltyMultiplierForShift(shift: Pick<RosterShiftRecord, "shiftDate" | "startTime" | "endTime">): number {
  const dayType = shiftDayType(shift.shiftDate);
  let multiplier = 1;
  if (dayType === "saturday") multiplier = Math.max(multiplier, 1.5);
  if (dayType === "sunday") multiplier = Math.max(multiplier, 1.75);
  if (eveningPenaltyApplies(shift.startTime, shift.endTime)) multiplier = Math.max(multiplier, 1.15);
  return multiplier;
}

export function employeeSchadsLevelKey(employee: EmployeeRecord, shiftType?: string): string {
  const fromProfile = employee.schadsClassificationLevel?.trim();
  if (fromProfile) return fromProfile;
  return defaultSchadsLevelForCategory(shiftType || "Standard");
}

export function calculateShiftCostBreakdown(
  shift: RosterShiftRecord,
  employee: EmployeeRecord
): ShiftCostBreakdown {
  const normalized = normalizeRosterShift(shift);
  const hours = shiftDurationHours(normalized);
  const levelKey = employeeSchadsLevelKey(employee, normalized.shiftType);
  const level = SCHADS_PLANNING_LEVELS[levelKey] ?? SCHADS_PLANNING_LEVELS["level-2.1"];
  const employmentType = employee.employmentType || "Casual";
  const casualLoading = SCHADS_EMPLOYMENT_LOADING[employmentType] ?? SCHADS_EMPLOYMENT_LOADING.Casual;
  const baseRate = level.weekdayHourly;
  const penaltyMultiplier = penaltyMultiplierForShift(normalized);
  const grossWage = Math.round(baseRate * casualLoading * penaltyMultiplier * hours * 100) / 100;
  const superRate = Number(employee.superRate ?? 12) / 100;
  const superAmount = Math.round(grossWage * superRate * 100) / 100;
  const totalCost = Math.round((grossWage + superAmount) * 100) / 100;
  return {
    baseRate,
    penaltyMultiplier,
    casualLoading,
    grossWage,
    superRate: superRate * 100,
    superAmount,
    totalCost,
    hours,
    levelLabel: level.label,
  };
}

export function estimateShiftIncome(
  shift: RosterShiftRecord,
  bookings: ServiceBookingRecord[] = [],
  hourlyRate = DEFAULT_NDIS_DAYTIME_RATE
): number {
  const normalized = normalizeRosterShift(shift);
  if (normalized.billingClassification === "non_billable_internal_cost") return 0;
  if (!isShiftBillable(normalized)) {
    if (normalized.costAllocation === "non_billable") return 0;
  }
  const booking = bookings.find((b) => b.id === normalized.serviceBookingId);
  const hours = shiftDurationHours(normalized);
  if (booking?.lines?.length) {
    const line = booking.lines[0];
    const rate = parseFloat(String(line.price ?? "").replace(/,/g, ""));
    if (Number.isFinite(rate) && rate > 0) return Math.round(rate * hours * 100) / 100;
  }
  if (normalized.estimatedHourlyCost && normalized.estimatedHourlyCost > 0) {
    return Math.round(normalized.estimatedHourlyCost * hours * 100) / 100;
  }
  return Math.round(hourlyRate * hours * 100) / 100;
}

export function calculateShiftProfitability(
  shift: RosterShiftRecord,
  employee: EmployeeRecord,
  bookings: ServiceBookingRecord[] = []
): ShiftProfitability {
  const normalized = normalizeRosterShift(shift);
  const breakdown = calculateShiftCostBreakdown(normalized, employee);
  const income = estimateShiftIncome(normalized, bookings);
  const margin = Math.round((income - breakdown.totalCost) * 100) / 100;
  const marginPct = income > 0 ? Math.round((margin / income) * 1000) / 10 : null;
  return {
    shiftId: normalized.id,
    shiftDate: normalized.shiftDate,
    employeeId: employee.id,
    hours: breakdown.hours,
    cost: breakdown.totalCost,
    income,
    margin,
    marginPct,
    breakdown,
  };
}

export function enrichShiftWithProfitability(
  shift: RosterShiftRecord,
  employees: EmployeeRecord[],
  bookings: ServiceBookingRecord[] = []
): RosterShiftRecord {
  const normalized = normalizeRosterShift(shift);
  const workerId = assignedWorkerIdsForShift(normalized)[0] ?? normalized.employeeId?.trim();
  const employee = employees.find((e) => e.id === workerId);
  if (!employee) {
    return {
      ...normalized,
      calculatedCost: normalized.calculatedCost ?? undefined,
      calculatedIncome: normalized.calculatedIncome ?? undefined,
      calculatedMargin: normalized.calculatedMargin ?? undefined,
    };
  }
  const result = calculateShiftProfitability(normalized, employee, bookings);
  return {
    ...normalized,
    calculatedCost: result.cost,
    calculatedIncome: result.income,
    calculatedMargin: result.margin,
  };
}

export type PeriodProfitabilitySummary = {
  periodStart: string;
  periodEnd: string;
  shiftCount: number;
  totalHours: number;
  totalCost: number;
  totalIncome: number;
  totalMargin: number;
  marginPct: number | null;
  lossMakingShifts: number;
};

export function summarizePeriodProfitability(
  shifts: RosterShiftRecord[],
  employees: EmployeeRecord[],
  bookings: ServiceBookingRecord[],
  periodStart: string,
  periodEnd: string
): PeriodProfitabilitySummary {
  let shiftCount = 0;
  let totalHours = 0;
  let totalCost = 0;
  let totalIncome = 0;
  let lossMakingShifts = 0;

  for (const raw of shifts) {
    const shift = normalizeRosterShift(raw);
    if (shift.status === "Cancelled") continue;
    if (shift.shiftDate < periodStart || shift.shiftDate > periodEnd) continue;
    const workerId = assignedWorkerIdsForShift(shift)[0] ?? shift.employeeId?.trim();
    const employee = employees.find((e) => e.id === workerId);
    if (!employee) continue;
    const row = calculateShiftProfitability(shift, employee, bookings);
    shiftCount += 1;
    totalHours += row.hours;
    totalCost += row.cost;
    totalIncome += row.income;
    if (row.margin < 0) lossMakingShifts += 1;
  }

  totalHours = Math.round(totalHours * 100) / 100;
  totalCost = Math.round(totalCost * 100) / 100;
  totalIncome = Math.round(totalIncome * 100) / 100;
  const totalMargin = Math.round((totalIncome - totalCost) * 100) / 100;
  const marginPct = totalIncome > 0 ? Math.round((totalMargin / totalIncome) * 1000) / 10 : null;

  return {
    periodStart,
    periodEnd,
    shiftCount,
    totalHours,
    totalCost,
    totalIncome,
    totalMargin,
    marginPct,
    lossMakingShifts,
  };
}

export function formatMarginCurrency(value: number): string {
  const prefix = value < 0 ? "-$" : "$";
  return `${prefix}${Math.abs(value).toFixed(2)}`;
}

export const SCHADS_LEVEL_OPTIONS = Object.entries(SCHADS_PLANNING_LEVELS).map(([value, row]) => ({
  value,
  label: row.label,
}));
