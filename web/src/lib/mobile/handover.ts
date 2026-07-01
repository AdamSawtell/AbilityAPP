import { workerLineForEmployee } from "@/lib/roster-session";
import type { RosterShiftRecord } from "@/lib/roster-shift";

/** Prior worker checkout notes at the same support location before this shift. */
export function priorHandoverNotes(
  shift: RosterShiftRecord,
  allShifts: RosterShiftRecord[],
  currentEmployeeId: string
): string {
  const locationId = shift.locationId?.trim();
  const clientId = shift.clientId?.trim();
  if (!locationId && !clientId) return "";

  const shiftStartKey = `${shift.shiftDate}${shift.startTime}`;
  const candidates = allShifts
    .filter((row) => {
      if (row.id === shift.id) return false;
      if (row.status === "Cancelled" || row.status === "Draft") return false;
      if (locationId && row.locationId?.trim() === locationId) return true;
      if (clientId && row.clientId?.trim() === clientId) return true;
      return false;
    })
    .filter((row) => `${row.shiftDate}${row.startTime}` < shiftStartKey)
    .sort((a, b) => `${b.shiftDate}${b.startTime}`.localeCompare(`${a.shiftDate}${a.startTime}`));

  const prior = candidates[0];
  if (!prior) return "";

  const priorWorkerIds = new Set(
    (prior.workerLines ?? [])
      .map((line) => line.employeeId?.trim())
      .filter((id): id is string => Boolean(id))
  );
  if (prior.employeeId?.trim()) priorWorkerIds.add(prior.employeeId.trim());
  priorWorkerIds.delete(currentEmployeeId.trim());

  for (const workerId of priorWorkerIds) {
    const line = workerLineForEmployee(prior.workerLines, workerId);
    const notes = line?.notes?.trim();
    if (notes && line?.checkedOutAt?.trim()) return notes;
  }

  if (prior.checkInNotes?.trim() && prior.checkedOutAt?.trim()) {
    return prior.checkInNotes.trim();
  }

  return "";
}
