import type { RosterShiftRecord } from "@/lib/roster-shift";
import {
  detectRosterShiftConflicts,
  type RosterConflictContext,
} from "@/lib/roster-shift-conflicts";

export type RosterShiftIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

function timeMinutes(value: string): number | null {
  const part = value?.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(part)) return null;
  const [h, m] = part.split(":").map(Number);
  return h * 60 + m;
}

export function validateRosterShift(
  record: RosterShiftRecord,
  conflictContext?: RosterConflictContext
): RosterShiftIssue[] {
  const issues: RosterShiftIssue[] = [];

  if (!record.clientId?.trim()) {
    issues.push({
      code: "CLIENT_REQUIRED",
      message: "Link a client before saving this shift.",
      severity: "error",
    });
  }

  if (!record.employeeId?.trim()) {
    if (record.status === "Published" || record.status === "Completed") {
      issues.push({
        code: "EMPLOYEE_REQUIRED",
        message: "Assign a worker before publishing this shift.",
        severity: "error",
      });
    } else {
      issues.push({
        code: "VACANT_SHIFT",
        message: "Vacant shift — assign a worker before publishing.",
        severity: "warning",
      });
    }
  }

  if (!record.shiftDate?.trim()) {
    issues.push({
      code: "DATE_REQUIRED",
      message: "Enter a shift date.",
      severity: "error",
    });
  }

  const start = timeMinutes(record.startTime);
  const end = timeMinutes(record.endTime);
  if (start !== null && end !== null && end <= start) {
    issues.push({
      code: "TIME_RANGE_INVALID",
      message: "End time must be after start time.",
      severity: "error",
    });
  }

  if (!record.locationId?.trim()) {
    issues.push({
      code: "LOCATION_RECOMMENDED",
      message: "Link a support location so coordinators know where support is delivered.",
      severity: "warning",
    });
  }

  if (conflictContext) {
    issues.push(...detectRosterShiftConflicts(record, conflictContext));
  }

  return issues;
}

export function rosterShiftSaveBlocked(issues: RosterShiftIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
