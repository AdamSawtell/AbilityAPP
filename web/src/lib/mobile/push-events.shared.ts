import { assignedWorkerIdsForShift, isFillWorkerLine } from "@/lib/roster-session";
import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";

export type PushEmitKind = "critical_shift" | "shift_changed" | "rostering_reply";

type ShiftSnapshot = {
  id: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  locationId: string;
  status: string;
  workerEmployeeIds: string[];
};

function formatShiftTime(time: string): string {
  return String(time ?? "").trim().slice(0, 5);
}

export function shiftSnapshot(shift: RosterShiftRecord): ShiftSnapshot {
  const normalized = normalizeRosterShift(shift);
  const workerEmployeeIds = (normalized.workerLines ?? [])
    .filter((line) => isFillWorkerLine(line) && line.employeeId?.trim())
    .map((line) => line.employeeId.trim());
  const primary = normalized.employeeId?.trim();
  if (primary && !workerEmployeeIds.includes(primary)) workerEmployeeIds.push(primary);
  for (const id of assignedWorkerIdsForShift(normalized)) {
    if (id && !workerEmployeeIds.includes(id)) workerEmployeeIds.push(id);
  }
  return {
    id: normalized.id,
    shiftDate: normalized.shiftDate,
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    locationId: normalized.locationId ?? "",
    status: normalized.status,
    workerEmployeeIds,
  };
}

export function rosterShiftChangedNotifiable(before: RosterShiftRecord, after: RosterShiftRecord): boolean {
  const beforeSnap = shiftSnapshot(before);
  const afterSnap = shiftSnapshot(after);
  if (afterSnap.status === "Cancelled") return afterSnap.workerEmployeeIds.length > 0;
  if (!["Published", "In progress"].includes(afterSnap.status)) return false;
  if (!afterSnap.workerEmployeeIds.length) return false;
  return (
    beforeSnap.shiftDate !== afterSnap.shiftDate ||
    beforeSnap.startTime !== afterSnap.startTime ||
    beforeSnap.endTime !== afterSnap.endTime ||
    beforeSnap.locationId !== afterSnap.locationId ||
    beforeSnap.status !== afterSnap.status ||
    beforeSnap.workerEmployeeIds.join(",") !== afterSnap.workerEmployeeIds.join(",")
  );
}

export function rosterShiftChangeSummary(before: RosterShiftRecord, after: RosterShiftRecord): string {
  const beforeSnap = shiftSnapshot(before);
  const afterSnap = shiftSnapshot(after);
  if (afterSnap.status === "Cancelled") return "Your shift was cancelled.";
  const parts: string[] = [];
  if (beforeSnap.shiftDate !== afterSnap.shiftDate) parts.push(`date is now ${afterSnap.shiftDate}`);
  if (beforeSnap.startTime !== afterSnap.startTime || beforeSnap.endTime !== afterSnap.endTime) {
    parts.push(`time is now ${formatShiftTime(afterSnap.startTime)}–${formatShiftTime(afterSnap.endTime)}`);
  }
  if (beforeSnap.locationId !== afterSnap.locationId) parts.push("location was updated");
  if (beforeSnap.status !== afterSnap.status && afterSnap.status !== "Cancelled") {
    parts.push(`status is ${afterSnap.status}`);
  }
  if (beforeSnap.workerEmployeeIds.join(",") !== afterSnap.workerEmployeeIds.join(",")) {
    parts.push("worker assignment changed");
  }
  return parts.length ? `Roster update: ${parts.join("; ")}.` : "Your shift was updated.";
}
