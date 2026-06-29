import type { SupabaseClient } from "@supabase/supabase-js";
import { ORGANIZATION_ID } from "@/lib/organization";
import { isFillWorkerLine, isLeavePayWorkerLine } from "@/lib/roster-session";
import { getOrganizationTimezone, getSystemSettings, serviceClient } from "@/lib/session-audit/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { RosterShiftRow } from "@/lib/supabase/mappers";
import type { RosterShiftWorkerLineRow } from "@/lib/supabase/roster-session-mappers";
import { rosterShiftWorkerLineFromRow } from "@/lib/supabase/roster-session-mappers";
import {
  hoursBetween,
  organizationLocalDateTimeToUtc,
  organizationTodayIso,
} from "@/lib/system-timezone";

export const LEAVE_SELF_SERVICE_MINIMUM_HOURS_KEY = "leave_self_service_minimum_hours";
export const DEFAULT_LEAVE_SELF_SERVICE_MINIMUM_HOURS = 76;
export const MAX_LEAVE_SELF_SERVICE_MINIMUM_HOURS = 8760;

export const LEAVE_SELF_SERVICE_SETTINGS = {
  title: "Leave self-service notice",
  description:
    "How far in advance staff must submit leave online. Inside this window they must phone HR or their manager instead.",
  fieldLabel: "Minimum notice (hours)",
  fieldHint:
    "Staff can submit leave from My workplace until this many hours before their first affected roster shift (or the leave start date when no shift is booked). Set to 0 to disable the online cutoff.",
} as const;

export function parseLeaveSelfServiceMinimumHours(value: string | undefined | null): number {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_LEAVE_SELF_SERVICE_MINIMUM_HOURS;
  return Math.min(parsed, MAX_LEAVE_SELF_SERVICE_MINIMUM_HOURS);
}

export function normalizeLeaveSelfServiceMinimumHours(value: number): number {
  if (!Number.isFinite(value) || value < 0) return DEFAULT_LEAVE_SELF_SERVICE_MINIMUM_HOURS;
  return Math.min(Math.round(value), MAX_LEAVE_SELF_SERVICE_MINIMUM_HOURS);
}

export async function getLeaveSelfServiceMinimumHours(): Promise<number> {
  const settings = await getSystemSettings();
  return parseLeaveSelfServiceMinimumHours(settings[LEAVE_SELF_SERVICE_MINIMUM_HOURS_KEY]);
}

export function leaveSelfServiceBlockedMessage(minimumHours: number, contactPhone: string): string {
  const phoneHint = contactPhone.trim()
    ? ` Call ${contactPhone.trim()} or speak to your manager.`
    : " Contact your manager or HR by phone.";
  return `Leave starting within ${minimumHours} hours must be requested by phone — online submit is not available this close to your shift.${phoneHint}`;
}

async function loadOrganizationContactPhone(): Promise<string> {
  if (!isSupabaseConfigured()) return "";
  const { data } = await serviceClient()
    .from("app_organization")
    .select("phone, primary_contact_phone")
    .eq("id", ORGANIZATION_ID)
    .maybeSingle();
  const row = data as { phone?: string; primary_contact_phone?: string } | null;
  return String(row?.primary_contact_phone ?? row?.phone ?? "").trim();
}

function shiftAssignedToEmployee(
  shift: Pick<RosterShiftRow, "employee_id">,
  workerLines: RosterShiftWorkerLineRow[],
  employeeId: string
): boolean {
  const id = employeeId.trim();
  if (!id) return false;
  if (String(shift.employee_id ?? "").trim() === id) return true;
  return workerLines.some((line) => {
    const normalized = rosterShiftWorkerLineFromRow(line);
    return (
      normalized.employeeId.trim() === id &&
      isFillWorkerLine(normalized) &&
      !isLeavePayWorkerLine(normalized)
    );
  });
}

async function findEarliestAffectedShiftStart(
  supabase: SupabaseClient,
  employeeId: string,
  startDate: string,
  endDate: string,
  timeZone: string
): Promise<Date | null> {
  const { data: shifts, error } = await supabase
    .from("roster_shift")
    .select("id, shift_date, start_time, employee_id")
    .gte("shift_date", startDate.slice(0, 10))
    .lte("shift_date", endDate.slice(0, 10))
    .order("shift_date")
    .order("start_time");
  if (error || !shifts?.length) return null;

  const shiftRows = shifts as RosterShiftRow[];
  const shiftIds = shiftRows.map((row) => row.id);
  const { data: workerLineRows } = await supabase
    .from("roster_shift_worker_line")
    .select("*")
    .in("roster_shift_id", shiftIds);
  const workerLinesByShift = new Map<string, RosterShiftWorkerLineRow[]>();
  for (const line of (workerLineRows ?? []) as RosterShiftWorkerLineRow[]) {
    const list = workerLinesByShift.get(line.roster_shift_id) ?? [];
    list.push(line);
    workerLinesByShift.set(line.roster_shift_id, list);
  }

  for (const shift of shiftRows) {
    const workerLines = workerLinesByShift.get(shift.id) ?? [];
    if (!shiftAssignedToEmployee(shift, workerLines, employeeId)) continue;
    return organizationLocalDateTimeToUtc(
      String(shift.shift_date),
      String(shift.start_time ?? "00:00"),
      timeZone
    );
  }
  return null;
}

export async function resolveLeaveSelfServiceAnchor(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<Date> {
  const timeZone = await getOrganizationTimezone();
  if (isSupabaseConfigured()) {
    const shiftStart = await findEarliestAffectedShiftStart(
      serviceClient(),
      employeeId,
      startDate,
      endDate,
      timeZone
    );
    if (shiftStart) return shiftStart;
  }
  return organizationLocalDateTimeToUtc(startDate.slice(0, 10), "00:00", timeZone);
}

export async function assertLeaveSelfServiceAllowed(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<void> {
  const minimumHours = await getLeaveSelfServiceMinimumHours();
  if (minimumHours <= 0) return;

  const anchor = await resolveLeaveSelfServiceAnchor(employeeId, startDate, endDate);
  const hoursUntilStart = hoursBetween(new Date(), anchor);
  if (hoursUntilStart >= minimumHours) return;

  const contactPhone = await loadOrganizationContactPhone();
  throw new Error(leaveSelfServiceBlockedMessage(minimumHours, contactPhone));
}

export function describeLeaveSelfServicePolicy(minimumHours: number, contactPhone: string): string {
  if (minimumHours <= 0) {
    return "You can submit leave online for any future dates.";
  }
  const phoneHint = contactPhone.trim() ? ` If it is closer than that, call ${contactPhone.trim()}.` : "";
  return `Submit leave at least ${minimumHours} hours before your first affected shift (or the leave start date when no shift is booked).${phoneHint}`;
}

export function organizationNowIso(timeZone: string): string {
  return organizationTodayIso(timeZone);
}
