/** AB-0033 — Pay period definitions and generated period instances. */
import { addDaysIso, weekStartFromDate } from "@/lib/roster-shift";
import { ORGANIZATION_ID } from "@/lib/organization";

export type PayPeriodStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PayPeriodFrequency = "weekly" | "fortnightly" | "monthly";

export type PayPeriodInstanceStatus = "open" | "locked" | "closed";

/**
 * How a pay period's labour cost is attributed to a calendar (accounting) month
 * when a fortnight straddles a month boundary.
 *
 * - `accrual` — match each shift to the month the work was performed (its shift
 *   date). AASB / GAAP accrual-matching standard; default. A single fortnight can
 *   split across two months.
 * - `period_end` — assign the whole pay period to the month its end date falls in.
 * - `pay_date` — assign the whole pay period to the month it is paid (period end
 *   + pay date offset). Cash-basis style management reporting.
 */
export type PayPeriodMonthAllocationMethod = "accrual" | "period_end" | "pay_date";

export const PAY_PERIOD_MONTH_ALLOCATION_OPTIONS: {
  value: PayPeriodMonthAllocationMethod;
  label: string;
  description: string;
}[] = [
  {
    value: "accrual",
    label: "Accrual (work performed) — recommended",
    description:
      "Match each shift to the month the work happened. AASB/GAAP accrual standard; a fortnight can split across two months.",
  },
  {
    value: "period_end",
    label: "Period end date",
    description: "Assign the whole pay period to the month its end date falls in.",
  },
  {
    value: "pay_date",
    label: "Pay date (cash basis)",
    description: "Assign the whole pay period to the month it is paid (period end + pay date offset).",
  },
];

export const PAY_PERIOD_START_DAY_LABELS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const PAY_PERIOD_FREQUENCY_OPTIONS: { value: PayPeriodFrequency; label: string; days: number }[] = [
  { value: "weekly", label: "Weekly (7 days)", days: 7 },
  { value: "fortnightly", label: "Fortnightly (14 days)", days: 14 },
  { value: "monthly", label: "Monthly (calendar month)", days: 28 },
];

export type PayPeriodDefinitionRecord = {
  id: string;
  organizationId: string;
  name: string;
  frequency: PayPeriodFrequency | string;
  periodLengthDays: number;
  startDay: PayPeriodStartDay | number;
  anchorDate: string;
  labelPattern: string;
  /** Days after period end before roster/timesheet edits lock automatically. */
  editGraceDays: number;
  /** How a pay period's cost maps to a calendar month for financial close. */
  monthAllocationMethod: PayPeriodMonthAllocationMethod;
  /** Days after period end that wages are paid (used by the pay_date method). */
  payDateOffsetDays: number;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
};

export type PayPeriodInstanceRecord = {
  id: string;
  definitionId: string;
  periodNumber: string;
  periodIndex: number;
  startDate: string;
  endDate: string;
  status: PayPeriodInstanceStatus | string;
  closedAt: string;
  closedBy: string;
  closeNotes: string;
};

export function frequencyToLengthDays(frequency: PayPeriodFrequency | string): number {
  const match = PAY_PERIOD_FREQUENCY_OPTIONS.find((row) => row.value === frequency);
  return match?.days ?? 14;
}

export function normalizePayPeriodDefinition(record: PayPeriodDefinitionRecord): PayPeriodDefinitionRecord {
  const frequency = (record.frequency || "fortnightly") as PayPeriodFrequency;
  const periodLengthDays =
    frequency === "monthly" ? 28 : record.periodLengthDays || frequencyToLengthDays(frequency);
  const startDay = Math.max(0, Math.min(6, Number(record.startDay ?? 0))) as PayPeriodStartDay;
  const monthAllocationMethod = PAY_PERIOD_MONTH_ALLOCATION_OPTIONS.some(
    (row) => row.value === record.monthAllocationMethod
  )
    ? (record.monthAllocationMethod as PayPeriodMonthAllocationMethod)
    : "accrual";
  return {
    ...record,
    organizationId: record.organizationId?.trim() || ORGANIZATION_ID,
    name: record.name?.trim() || "Pay period",
    frequency,
    periodLengthDays,
    startDay,
    anchorDate: record.anchorDate?.slice(0, 10) || weekStartFromDate(new Date().toISOString().slice(0, 10)),
    labelPattern: record.labelPattern?.trim() || "PP {start}–{end}",
    editGraceDays: Math.max(0, Number(record.editGraceDays ?? 0)),
    monthAllocationMethod,
    payDateOffsetDays: Math.max(0, Number(record.payDateOffsetDays ?? 7)),
    isActive: record.isActive !== false,
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function normalizePayPeriodInstance(record: PayPeriodInstanceRecord): PayPeriodInstanceRecord {
  const status = record.status === "locked" || record.status === "closed" ? record.status : "open";
  return {
    ...record,
    periodNumber: record.periodNumber?.trim() || "",
    periodIndex: Number(record.periodIndex ?? 0),
    startDate: record.startDate?.slice(0, 10) ?? "",
    endDate: record.endDate?.slice(0, 10) ?? "",
    status,
    closedAt: record.closedAt ?? "",
    closedBy: record.closedBy ?? "",
    closeNotes: record.closeNotes ?? "",
  };
}

function parseIsoDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T12:00:00`);
}

function localIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function mondayIndexFromDate(iso: string): number {
  const d = parseIsoDate(iso);
  return (d.getDay() + 6) % 7;
}

export function anchorAlignsWithStartDay(anchorDate: string, startDay: number): boolean {
  return mondayIndexFromDate(anchorDate) === startDay;
}

function endOfCalendarMonth(iso: string): string {
  const d = parseIsoDate(iso);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 12);
  return localIso(end);
}

function startOfNextCalendarMonth(iso: string): string {
  const d = parseIsoDate(iso);
  const next = new Date(d.getFullYear(), d.getMonth() + 1, 1, 12);
  return localIso(next);
}

function monthlyPeriodForIndex(definition: PayPeriodDefinitionRecord, periodIndex: number): {
  startDate: string;
  endDate: string;
} {
  const anchor = parseIsoDate(definition.anchorDate);
  const start = new Date(anchor.getFullYear(), anchor.getMonth() + periodIndex, anchor.getDate(), 12);
  const startDate = localIso(start);
  return { startDate, endDate: endOfCalendarMonth(startDate) };
}

function fixedPeriodForIndex(definition: PayPeriodDefinitionRecord, periodIndex: number): {
  startDate: string;
  endDate: string;
} {
  const length = definition.periodLengthDays || frequencyToLengthDays(definition.frequency);
  const startDate = addDaysIso(definition.anchorDate, periodIndex * length);
  return { startDate, endDate: addDaysIso(startDate, length - 1) };
}

export function formatPayPeriodLabel(
  definition: PayPeriodDefinitionRecord,
  startDate: string,
  endDate: string
): string {
  const fmt = (iso: string) => {
    const d = parseIsoDate(iso);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };
  return (definition.labelPattern || "PP {start}–{end}")
    .replace("{start}", fmt(startDate))
    .replace("{end}", fmt(endDate))
    .replace("{startIso}", startDate)
    .replace("{endIso}", endDate);
}

export function payPeriodInstanceId(definitionId: string, periodIndex: number): string {
  return `ppi-${definitionId}-${periodIndex}`;
}

export function generatePayPeriodInstances(
  definition: PayPeriodDefinitionRecord,
  options?: { pastCount?: number; futureCount?: number; existing?: PayPeriodInstanceRecord[] }
): PayPeriodInstanceRecord[] {
  const def = normalizePayPeriodDefinition(definition);
  const past = Math.max(0, options?.pastCount ?? 6);
  const future = Math.max(1, options?.futureCount ?? 26);
  const existingByIndex = new Map(
    (options?.existing ?? []).map((row) => [row.periodIndex, normalizePayPeriodInstance(row)])
  );
  const instances: PayPeriodInstanceRecord[] = [];

  for (let periodIndex = -past; periodIndex <= future; periodIndex += 1) {
    const range =
      def.frequency === "monthly"
        ? monthlyPeriodForIndex(def, periodIndex)
        : fixedPeriodForIndex(def, periodIndex);
    const prior = existingByIndex.get(periodIndex);
    instances.push(
      normalizePayPeriodInstance({
        id: prior?.id ?? payPeriodInstanceId(def.id, periodIndex),
        definitionId: def.id,
        periodNumber: prior?.periodNumber || `PP-${periodIndex >= 0 ? periodIndex + 1 : periodIndex}`,
        periodIndex,
        startDate: range.startDate,
        endDate: range.endDate,
        status: prior?.status ?? "open",
        closedAt: prior?.closedAt ?? "",
        closedBy: prior?.closedBy ?? "",
        closeNotes: prior?.closeNotes ?? "",
      })
    );
  }

  return instances.sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function findPayPeriodInstanceForDate(
  instances: PayPeriodInstanceRecord[],
  date: string
): PayPeriodInstanceRecord | undefined {
  const day = date.slice(0, 10);
  return instances
    .map(normalizePayPeriodInstance)
    .find((row) => row.startDate <= day && row.endDate >= day);
}

export function findCurrentPayPeriodInstance(
  instances: PayPeriodInstanceRecord[],
  asOf: Date | string = new Date()
): PayPeriodInstanceRecord | undefined {
  const day = typeof asOf === "string" ? asOf.slice(0, 10) : asOf.toISOString().slice(0, 10);
  return findPayPeriodInstanceForDate(instances, day);
}

export function activePayPeriodDefinition(
  definitions: PayPeriodDefinitionRecord[]
): PayPeriodDefinitionRecord | undefined {
  return definitions.find((row) => row.isActive) ?? definitions[0];
}

export function payPeriodInstancesForDefinition(
  instances: PayPeriodInstanceRecord[],
  definitionId?: string
): PayPeriodInstanceRecord[] {
  if (!definitionId) return [];
  return instances
    .filter((row) => row.definitionId === definitionId)
    .map(normalizePayPeriodInstance)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function payPeriodRange(instance: PayPeriodInstanceRecord): {
  periodStart: string;
  periodEnd: string;
} {
  const row = normalizePayPeriodInstance(instance);
  return { periodStart: row.startDate, periodEnd: row.endDate };
}

export function findAdjacentPayPeriodInstance(
  instances: PayPeriodInstanceRecord[],
  definitionId: string,
  currentId: string,
  direction: -1 | 1
): PayPeriodInstanceRecord | undefined {
  const ordered = payPeriodInstancesForDefinition(instances, definitionId);
  const index = ordered.findIndex((row) => row.id === currentId);
  if (index < 0) return undefined;
  return ordered[index + direction];
}

export function defaultPayPeriodRange(
  instances: PayPeriodInstanceRecord[],
  asOf: Date | string = new Date()
): { periodStart: string; periodEnd: string; instanceId?: string } {
  const current = findCurrentPayPeriodInstance(instances, asOf);
  if (current) {
    const range = payPeriodRange(current);
    return { ...range, instanceId: current.id };
  }
  const day = typeof asOf === "string" ? asOf.slice(0, 10) : asOf.toISOString().slice(0, 10);
  const end = parseIsoDate(day);
  const start = new Date(end);
  start.setDate(start.getDate() - 13);
  return { periodStart: localIso(start), periodEnd: day };
}

export function findNextPayPeriodInstance(
  instances: PayPeriodInstanceRecord[],
  asOf = new Date()
): PayPeriodInstanceRecord | undefined {
  const day = asOf.toISOString().slice(0, 10);
  return instances
    .map(normalizePayPeriodInstance)
    .filter((row) => row.startDate > day)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
}

export function isPayPeriodInstanceClosed(instance: PayPeriodInstanceRecord): boolean {
  return normalizePayPeriodInstance(instance).status === "closed";
}

export function isPayPeriodInstanceLocked(instance: PayPeriodInstanceRecord): boolean {
  const status = normalizePayPeriodInstance(instance).status;
  return status === "locked" || status === "closed";
}

export function isPayPeriodEditable(
  instance: PayPeriodInstanceRecord,
  definition: PayPeriodDefinitionRecord,
  asOf = new Date()
): boolean {
  const row = normalizePayPeriodInstance(instance);
  if (row.status === "closed" || row.status === "locked") return false;
  const def = normalizePayPeriodDefinition(definition);
  if (!def.editGraceDays) return true;
  const graceEnd = addDaysIso(row.endDate, def.editGraceDays);
  return localIso(asOf) <= graceEnd;
}

export function dateInPayPeriod(date: string, instance: PayPeriodInstanceRecord): boolean {
  const day = date.slice(0, 10);
  const row = normalizePayPeriodInstance(instance);
  return row.startDate <= day && row.endDate >= day;
}

export function shiftsInPayPeriod<T extends { shiftDate: string }>(
  shifts: T[],
  instance: PayPeriodInstanceRecord
): T[] {
  const row = normalizePayPeriodInstance(instance);
  return shifts.filter((shift) => dateInPayPeriod(shift.shiftDate, row));
}

/** Pay date for a generated period instance (period end + offset). */
export function payDateForInstance(
  definition: PayPeriodDefinitionRecord,
  instance: PayPeriodInstanceRecord
): string {
  const def = normalizePayPeriodDefinition(definition);
  const row = normalizePayPeriodInstance(instance);
  return addDaysIso(row.endDate, def.payDateOffsetDays);
}

/**
 * The calendar accounting month (YYYY-MM) a single shift's labour cost is
 * attributed to, per the definition's month allocation method.
 *
 * - accrual: the month the shift was worked (its date).
 * - period_end / pay_date: the month derived from the pay period the shift
 *   falls in (its end date, or pay date). Falls back to the shift month when no
 *   matching period instance is found.
 */
export function financialMonthForShiftDate(
  definition: PayPeriodDefinitionRecord,
  instances: PayPeriodInstanceRecord[],
  shiftDate: string
): string {
  const day = shiftDate.slice(0, 10);
  const def = normalizePayPeriodDefinition(definition);
  if (def.monthAllocationMethod === "accrual") return day.slice(0, 7);
  const instance = findPayPeriodInstanceForDate(instances, day);
  if (!instance) return day.slice(0, 7);
  if (def.monthAllocationMethod === "pay_date") {
    return payDateForInstance(def, instance).slice(0, 7);
  }
  return normalizePayPeriodInstance(instance).endDate.slice(0, 7);
}

/** Pay period instances whose labour cost contributes to a calendar month. */
export function payPeriodsContributingToMonth(
  definition: PayPeriodDefinitionRecord,
  instances: PayPeriodInstanceRecord[],
  month: string
): PayPeriodInstanceRecord[] {
  const target = month.slice(0, 7);
  const def = normalizePayPeriodDefinition(definition);
  return instances
    .filter((row) => row.definitionId === def.id)
    .map(normalizePayPeriodInstance)
    .filter((row) => {
      if (def.monthAllocationMethod === "accrual") {
        return row.startDate.slice(0, 7) <= target && row.endDate.slice(0, 7) >= target;
      }
      if (def.monthAllocationMethod === "pay_date") {
        return payDateForInstance(def, row).slice(0, 7) === target;
      }
      return row.endDate.slice(0, 7) === target;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export function monthAllocationMethodLabel(method: PayPeriodMonthAllocationMethod | string): string {
  return PAY_PERIOD_MONTH_ALLOCATION_OPTIONS.find((row) => row.value === method)?.label ?? method;
}

export const initialPayPeriodDefinition: PayPeriodDefinitionRecord = normalizePayPeriodDefinition({
  id: "ppd-default",
  organizationId: ORGANIZATION_ID,
  name: "Fortnightly pay period (Mon start)",
  frequency: "fortnightly",
  periodLengthDays: 14,
  startDay: 0,
  anchorDate: "2026-06-22",
  labelPattern: "PP {start}–{end}",
  editGraceDays: 3,
  monthAllocationMethod: "accrual",
  payDateOffsetDays: 7,
  isActive: true,
  createdBy: "System",
  updatedBy: "System",
});

export function defaultPayPeriodDefinitionSeed(): PayPeriodDefinitionRecord {
  return { ...initialPayPeriodDefinition };
}

export function defaultPayPeriodInstancesSeed(
  definition = defaultPayPeriodDefinitionSeed()
): PayPeriodInstanceRecord[] {
  return generatePayPeriodInstances(definition, { pastCount: 8, futureCount: 26 });
}
