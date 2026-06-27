/** AB-0033 — Pay period definitions and generated period instances. */
import { addDaysIso, weekStartFromDate } from "@/lib/roster-shift";
import { ORGANIZATION_ID } from "@/lib/organization";

export type PayPeriodStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type PayPeriodFrequency = "weekly" | "fortnightly" | "monthly";

export type PayPeriodInstanceStatus = "open" | "locked" | "closed";

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
