import { isBuddyShift } from "@/lib/buddy-shift";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { RosterShiftIssue } from "@/lib/roster-shift-compliance";

function timeMinutes(value: string): number | null {
  const part = value?.slice(0, 5);
  if (!/^\d{2}:\d{2}$/.test(part)) return null;
  const [h, m] = part.split(":").map(Number);
  return h * 60 + m;
}

function shiftsOverlap(a: RosterShiftRecord, b: RosterShiftRecord): boolean {
  if (a.shiftDate !== b.shiftDate) return false;
  if (a.status === "Cancelled" || b.status === "Cancelled") return false;

  const aStart = timeMinutes(a.startTime);
  const aEnd = timeMinutes(a.endTime);
  const bStart = timeMinutes(b.startTime);
  const bEnd = timeMinutes(b.endTime);
  if (aStart === null || aEnd === null || bStart === null || bEnd === null) return false;

  return aStart < bEnd && bStart < aEnd;
}

function activePeers(
  record: RosterShiftRecord,
  all: RosterShiftRecord[],
  excludeIds: Set<string>
): RosterShiftRecord[] {
  return all.filter(
    (other) =>
      other.id !== record.id &&
      !excludeIds.has(other.id) &&
      other.status !== "Cancelled" &&
      other.shiftDate === record.shiftDate
  );
}

export type RosterConflictContext = {
  existing: RosterShiftRecord[];
  /** When saving a recurring batch, exclude sibling rows from mutual checks. */
  batchIds?: Set<string>;
};

export function detectRosterShiftConflicts(
  record: RosterShiftRecord,
  context: RosterConflictContext
): RosterShiftIssue[] {
  const issues: RosterShiftIssue[] = [];
  if (record.status === "Cancelled") return issues;

  const batchIds = context.batchIds ?? new Set<string>();
  const peers = activePeers(record, context.existing, batchIds);

  for (const other of peers) {
    if (!shiftsOverlap(record, other)) continue;

    if (record.employeeId && other.employeeId === record.employeeId) {
      issues.push({
        code: "EMPLOYEE_DOUBLE_BOOKED",
        message: `Worker is already rostered ${other.startTime.slice(0, 5)}–${other.endTime.slice(0, 5)} on this date (shift ${other.shiftRef || other.id}).`,
        severity: "error",
      });
      break;
    }

    if (record.clientId && other.clientId === record.clientId) {
      // Buddy / shadow shifts intentionally overlap the primary shift for the
      // same client, so the pair must not be flagged as a client double-book.
      if (isBuddyShift(record) || isBuddyShift(other)) continue;
      issues.push({
        code: "CLIENT_DOUBLE_BOOKED",
        message: `Client already has support ${other.startTime.slice(0, 5)}–${other.endTime.slice(0, 5)} on this date (shift ${other.shiftRef || other.id}).`,
        severity: "warning",
      });
      break;
    }
  }

  return issues;
}

export function detectRecurringRosterConflicts(
  records: RosterShiftRecord[],
  existing: RosterShiftRecord[]
): Map<string, RosterShiftIssue[]> {
  const batchIds = new Set(records.map((r) => r.id));
  const combined = [...existing.filter((r) => !batchIds.has(r.id)), ...records];
  const byId = new Map<string, RosterShiftIssue[]>();

  for (const record of records) {
    const issues = detectRosterShiftConflicts(record, { existing: combined, batchIds });
    if (issues.length) byId.set(record.id, issues);
  }

  return byId;
}
