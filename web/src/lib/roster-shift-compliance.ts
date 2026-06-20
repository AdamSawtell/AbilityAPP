import type { RosterShiftRecord } from "@/lib/roster-shift";
import {
  detectRosterShiftConflicts,
  detectRecurringRosterConflicts,
  type RosterConflictContext,
} from "@/lib/roster-shift-conflicts";

export type RosterShiftIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export type RosterValidationMode = "draft" | "publish";

export function rosterValidationMode(record: RosterShiftRecord): RosterValidationMode {
  return record.status === "Published" || record.status === "Completed" ? "publish" : "draft";
}

function timeMinutes(value: string): number | null {
  const part = value?.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(part)) return null;
  const [h, m] = part.split(":").map(Number);
  return h * 60 + m;
}

export function validateRosterShift(
  record: RosterShiftRecord,
  conflictContext?: RosterConflictContext,
  mode: RosterValidationMode = rosterValidationMode(record)
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
    for (const issue of detectRosterShiftConflicts(record, conflictContext)) {
      if (mode === "publish" && issue.severity === "warning") {
        issues.push({ ...issue, severity: "error" });
      } else {
        issues.push(issue);
      }
    }
  }

  return issues;
}

export type RosterShiftBatchValidation = {
  blocked: boolean;
  errors: string[];
};

/** Hard-enforcement gate for bulk save / publish paths. */
export function validateRosterShiftBatch(
  records: RosterShiftRecord[],
  existing: RosterShiftRecord[]
): RosterShiftBatchValidation {
  if (!records.length) return { blocked: false, errors: [] };

  const batchIds = new Set(records.map((r) => r.id));
  const conflictMap = detectRecurringRosterConflicts(records, existing);
  const errors: string[] = [];

  for (const record of records) {
    const mode = rosterValidationMode(record);
    const peers = [
      ...existing.filter((r) => r.id !== record.id && !batchIds.has(r.id)),
      ...records.filter((r) => r.id !== record.id),
    ];
    for (const issue of validateRosterShift(record, { existing: peers, batchIds }, mode)) {
      if (issue.code === "TIME_RANGE_INVALID") continue;
      if (issue.severity === "error") errors.push(`${record.shiftDate}: ${issue.message}`);
    }
    for (const issue of conflictMap.get(record.id) ?? []) {
      const severity = mode === "publish" && issue.severity === "warning" ? "error" : issue.severity;
      if (severity === "error") errors.push(`${record.shiftDate}: ${issue.message}`);
    }
  }

  return { blocked: errors.length > 0, errors: [...new Set(errors)] };
}

export function rosterShiftSaveBlocked(issues: RosterShiftIssue[]): boolean {
  return issues.some((i) => i.severity === "error");
}
