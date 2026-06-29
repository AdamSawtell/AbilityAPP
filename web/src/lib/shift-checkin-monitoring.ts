import type { RosterShiftRecord } from "@/lib/roster-shift";
import { assignedWorkerIdsForShift, workerLineForEmployee } from "@/lib/roster-session";
import {
  DEFAULT_ORGANIZATION_TIMEZONE,
  organizationLocalDateTimeToUtc,
} from "@/lib/system-timezone";

export const SHIFT_LATE_CHECKIN_GRACE_KEY = "shift_late_checkin_grace_minutes";
export const SHIFT_MISSED_CHECKIN_KEY = "shift_missed_checkin_minutes";
export const SHIFT_MISSED_CHECKOUT_GRACE_KEY = "shift_missed_checkout_grace_minutes";
export const SHIFT_HOURS_VARIANCE_KEY = "shift_hours_variance_threshold";

export const DEFAULT_SHIFT_LATE_CHECKIN_GRACE_MINUTES = 10;
export const DEFAULT_SHIFT_MISSED_CHECKIN_MINUTES = 20;
export const DEFAULT_SHIFT_MISSED_CHECKOUT_GRACE_MINUTES = 30;
export const DEFAULT_SHIFT_HOURS_VARIANCE_THRESHOLD = 0.25;

export const MAX_SHIFT_MONITORING_MINUTES = 24 * 60;
export const MAX_SHIFT_HOURS_VARIANCE = 8;

/** Escalation fallback role when the worker has no resolvable reports-to manager. */
export const SHIFT_ESCALATION_FALLBACK_ROLE_ID = "role-coordinator";

export type ShiftCheckinMonitoringSettings = {
  lateCheckinGraceMinutes: number;
  missedCheckinMinutes: number;
  missedCheckoutGraceMinutes: number;
  hoursVarianceThreshold: number;
};

export const SHIFT_CHECKIN_MONITORING_FIELDS = {
  title: "Shift check-in monitoring",
  description:
    "Grace periods and escalation timing for shift check-in / check-out, plus the hours variance that blocks timesheet approval. Escalations create a task for the worker's manager and a Home alert for coordinators.",
  lateCheckin: {
    label: "Late check-in grace (minutes)",
    hint: "Minutes after the shift start before a worker is flagged as a late check-in.",
  },
  missedCheckin: {
    label: "Missed check-in escalation (minutes)",
    hint: "Minutes after the shift start with no check-in before the shift escalates to the manager.",
  },
  missedCheckout: {
    label: "Missed check-out grace (minutes)",
    hint: "Minutes after the shift end with no check-out before a forgotten check-out is flagged.",
  },
  variance: {
    label: "Hours variance threshold (hours)",
    hint: "Difference between actual (check-in to check-out) and rostered hours that blocks timesheet approval. Default 0.25 (15 minutes).",
  },
} as const;

function clampMinutes(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.min(Math.round(value), MAX_SHIFT_MONITORING_MINUTES);
}

function clampHours(value: number, fallback: number): number {
  if (!Number.isFinite(value) || value < 0) return fallback;
  return Math.min(Math.round(value * 100) / 100, MAX_SHIFT_HOURS_VARIANCE);
}

function parseMinutes(raw: string | undefined | null, fallback: number): number {
  return clampMinutes(Number.parseInt(String(raw ?? "").trim(), 10), fallback);
}

export function parseShiftCheckinMonitoringSettings(
  settings: Record<string, string>
): ShiftCheckinMonitoringSettings {
  return {
    lateCheckinGraceMinutes: parseMinutes(
      settings[SHIFT_LATE_CHECKIN_GRACE_KEY],
      DEFAULT_SHIFT_LATE_CHECKIN_GRACE_MINUTES
    ),
    missedCheckinMinutes: parseMinutes(
      settings[SHIFT_MISSED_CHECKIN_KEY],
      DEFAULT_SHIFT_MISSED_CHECKIN_MINUTES
    ),
    missedCheckoutGraceMinutes: parseMinutes(
      settings[SHIFT_MISSED_CHECKOUT_GRACE_KEY],
      DEFAULT_SHIFT_MISSED_CHECKOUT_GRACE_MINUTES
    ),
    hoursVarianceThreshold: (() => {
      const parsed = Number.parseFloat(String(settings[SHIFT_HOURS_VARIANCE_KEY] ?? "").trim());
      return clampHours(parsed, DEFAULT_SHIFT_HOURS_VARIANCE_THRESHOLD);
    })(),
  };
}

export function normalizeShiftMonitoringMinutes(value: number, fallback: number): number {
  return clampMinutes(value, fallback);
}

export function normalizeShiftHoursVariance(value: number): number {
  return clampHours(value, DEFAULT_SHIFT_HOURS_VARIANCE_THRESHOLD);
}

export type ShiftEscalationKind = "late_checkin" | "missed_checkin" | "missed_checkout";

export type ShiftCheckinEscalation = {
  shiftId: string;
  shiftRef: string;
  employeeId: string;
  locationId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  kind: ShiftEscalationKind;
  minutesOver: number;
};

function shiftStartEnd(
  shift: Pick<RosterShiftRecord, "shiftDate" | "startTime" | "endTime">,
  timeZone: string
): { start: Date; end: Date } {
  const start = organizationLocalDateTimeToUtc(shift.shiftDate, shift.startTime || "00:00", timeZone);
  let end = organizationLocalDateTimeToUtc(shift.shiftDate, shift.endTime || shift.startTime || "00:00", timeZone);
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
  }
  return { start, end };
}

const ACTIVE_SHIFT_STATUSES = new Set(["Published", "Completed"]);

/**
 * Evaluate which assigned worker lines breach the configured check-in / check-out
 * grace windows. Pure: callers pass `now` and the organisation timezone.
 */
export function evaluateShiftCheckinEscalations(input: {
  shifts: RosterShiftRecord[];
  settings: ShiftCheckinMonitoringSettings;
  timeZone?: string;
  now?: Date;
  /** Only evaluate shifts on or after this date (YYYY-MM-DD) to bound the sweep. */
  fromDate?: string;
}): ShiftCheckinEscalation[] {
  const timeZone = input.timeZone || DEFAULT_ORGANIZATION_TIMEZONE;
  const now = input.now ?? new Date();
  const escalations: ShiftCheckinEscalation[] = [];

  for (const shift of input.shifts) {
    if (!ACTIVE_SHIFT_STATUSES.has(shift.status)) continue;
    if (input.fromDate && shift.shiftDate < input.fromDate) continue;
    const { start, end } = shiftStartEnd(shift, timeZone);
    if (start.getTime() > now.getTime()) continue;

    const minutesSinceStart = (now.getTime() - start.getTime()) / 60000;
    const minutesSinceEnd = (now.getTime() - end.getTime()) / 60000;

    const hasWorkerLines = Boolean(shift.workerLines?.length);
    const assignedIds = assignedWorkerIdsForShift(shift);
    const seen = new Set<string>();

    for (const employeeId of assignedIds) {
      if (!employeeId.trim() || seen.has(employeeId)) continue;
      seen.add(employeeId);

      const line = hasWorkerLines ? workerLineForEmployee(shift.workerLines, employeeId) : undefined;
      const checkedIn = Boolean(
        hasWorkerLines ? line?.checkedInAt?.trim() : shift.checkedInAt?.trim()
      );
      const checkedOut = Boolean(
        hasWorkerLines ? line?.checkedOutAt?.trim() : shift.checkedOutAt?.trim()
      );
      if (checkedOut) continue;

      if (!checkedIn) {
        if (minutesSinceStart >= input.settings.missedCheckinMinutes) {
          escalations.push({
            ...escalationBase(shift, employeeId),
            kind: "missed_checkin",
            minutesOver: Math.round(minutesSinceStart),
          });
        } else if (minutesSinceStart >= input.settings.lateCheckinGraceMinutes) {
          escalations.push({
            ...escalationBase(shift, employeeId),
            kind: "late_checkin",
            minutesOver: Math.round(minutesSinceStart),
          });
        }
        continue;
      }

      if (minutesSinceEnd >= input.settings.missedCheckoutGraceMinutes) {
        escalations.push({
          ...escalationBase(shift, employeeId),
          kind: "missed_checkout",
          minutesOver: Math.round(minutesSinceEnd),
        });
      }
    }
  }

  return escalations;
}

function escalationBase(
  shift: RosterShiftRecord,
  employeeId: string
): Omit<ShiftCheckinEscalation, "kind" | "minutesOver"> {
  return {
    shiftId: shift.id,
    shiftRef: shift.shiftRef || shift.id,
    employeeId,
    locationId: shift.locationId || "",
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
  };
}

export function shiftEscalationLabel(kind: ShiftEscalationKind): string {
  switch (kind) {
    case "missed_checkin":
      return "Missed check-in";
    case "late_checkin":
      return "Late check-in";
    case "missed_checkout":
      return "Missed check-out";
  }
}

export function shiftEscalationSeverity(kind: ShiftEscalationKind): "critical" | "warning" {
  return kind === "missed_checkin" ? "critical" : "warning";
}

export function describeShiftEscalation(
  escalation: Pick<ShiftCheckinEscalation, "kind" | "minutesOver" | "shiftRef">,
  workerName: string
): string {
  const who = workerName.trim() || "Worker";
  const mins = escalation.minutesOver;
  switch (escalation.kind) {
    case "missed_checkin":
      return `${who} has not checked in to ${escalation.shiftRef} — ${mins} min past shift start.`;
    case "late_checkin":
      return `${who} is ${mins} min late checking in to ${escalation.shiftRef}.`;
    case "missed_checkout":
      return `${who} has not checked out of ${escalation.shiftRef} — ${mins} min past shift end.`;
  }
}
