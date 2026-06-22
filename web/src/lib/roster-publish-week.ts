import {
  rosterShiftSaveBlocked,
  validateRosterShift,
  buildRosterQualificationMaps,
} from "@/lib/roster-shift-compliance";
import { normalizeRosterShift, shiftsForWeek, type RosterShiftRecord } from "@/lib/roster-shift";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";

export type PublishWeekBlockedShift = {
  id: string;
  shiftRef: string;
  message: string;
};

export type PublishWeekPreview = {
  ready: RosterShiftRecord[];
  blocked: PublishWeekBlockedShift[];
  skippedVacant: number;
  skippedNotDraft: number;
};

export function previewPublishWeek(
  weekStart: string,
  allShifts: RosterShiftRecord[],
  actor: string,
  qualificationInput?: { clients: ClientRecord[]; employees: EmployeeRecord[] }
): PublishWeekPreview {
  const normalized = allShifts.map(normalizeRosterShift);
  const week = shiftsForWeek(normalized, weekStart);
  const ready: RosterShiftRecord[] = [];
  const blocked: PublishWeekBlockedShift[] = [];
  let skippedVacant = 0;
  let skippedNotDraft = 0;
  const qualification = qualificationInput
    ? buildRosterQualificationMaps(qualificationInput.clients, qualificationInput.employees)
    : undefined;

  for (const shift of week) {
    if (shift.status !== "Draft") {
      skippedNotDraft += 1;
      continue;
    }
    if (!shift.employeeId?.trim()) {
      skippedVacant += 1;
      continue;
    }

    const published = normalizeRosterShift({
      ...shift,
      status: "Published",
      updatedBy: actor,
    });
    const issues = validateRosterShift(
      published,
      { existing: normalized },
      "publish",
      qualification,
      normalized
    ).filter((issue) => issue.code !== "TIME_RANGE_INVALID");
    if (rosterShiftSaveBlocked(issues)) {
      blocked.push({
        id: shift.id,
        shiftRef: shift.shiftRef || shift.id,
        message: issues.find((i) => i.severity === "error")?.message ?? "Cannot publish this shift.",
      });
    } else {
      ready.push(published);
    }
  }

  return { ready, blocked, skippedVacant, skippedNotDraft };
}
