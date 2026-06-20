import { rosterOfCarePeriodHours } from "@/lib/roster-of-care-hours";
import type { RosterOfCareRecord } from "@/lib/roster-of-care";
import {
  normalizeRosterShift,
  shiftDurationHours,
  shiftsForWeek,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

export type ClientRocPlanningRow = {
  roc: RosterOfCareRecord;
  requiredWeeklyHours: number;
  rosteredWeeklyHours: number;
  gapHours: number;
};

export function clientRosterOfCares(
  rosterOfCares: RosterOfCareRecord[],
  clientId: string
): RosterOfCareRecord[] {
  return rosterOfCares
    .filter((roc) => roc.clientId === clientId && roc.status !== "Archived")
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function clientRosteredHoursInWeek(
  rosterShifts: RosterShiftRecord[],
  clientId: string,
  weekStart: string
): number {
  const hours = shiftsForWeek(rosterShifts.map(normalizeRosterShift), weekStart)
    .filter((s) => s.clientId === clientId && s.status !== "Cancelled")
    .reduce((sum, s) => sum + shiftDurationHours(s), 0);
  return Math.round(hours * 100) / 100;
}

export function summarizeClientRocPlanning(
  rosterOfCares: RosterOfCareRecord[],
  rosterShifts: RosterShiftRecord[],
  clientId: string,
  weekStart: string
): ClientRocPlanningRow[] {
  const rosteredWeeklyHours = clientRosteredHoursInWeek(rosterShifts, clientId, weekStart);
  return clientRosterOfCares(rosterOfCares, clientId).map((roc) => {
    const requiredWeeklyHours = rosterOfCarePeriodHours(roc.lines).weekly;
    return {
      roc,
      requiredWeeklyHours,
      rosteredWeeklyHours,
      gapHours: Math.round((requiredWeeklyHours - rosteredWeeklyHours) * 100) / 100,
    };
  });
}
