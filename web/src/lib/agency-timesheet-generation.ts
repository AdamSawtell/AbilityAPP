import type { AgencyShiftRequestRecord } from "@/lib/agency-shift-request";
import type { BusinessPartnerRecord } from "@/lib/business-partner";
import {
  agencyLineVendorCost,
  createAgencyTimesheet,
  emptyAgencyTimesheetLine,
  normalizeAgencyTimesheet,
  sumAgencyTimesheetLineHours,
  sumAgencyTimesheetVendorCost,
  type AgencyTimesheetLine,
  type AgencyTimesheetRecord,
} from "@/lib/agency-timesheet";
import { normalizeRosterShift, shiftDurationHours, type RosterShiftRecord } from "@/lib/roster-shift";

export type AgencyTimesheetGenerationPreviewRow = {
  vendorBpId: string;
  shiftCount: number;
  totalHours: number;
  estimatedCost: number;
};

export type AgencyTimesheetGenerationPreview = {
  periodStart: string;
  periodEnd: string;
  eligibleShiftCount: number;
  alreadyLinkedCount: number;
  rows: AgencyTimesheetGenerationPreviewRow[];
};

export type AgencyTimesheetGenerationResult = {
  created: AgencyTimesheetRecord[];
  updated: AgencyTimesheetRecord[];
  skippedAlreadyLinked: number;
  skippedLockedPeriod: number;
};

function shiftInPeriod(shift: RosterShiftRecord, periodStart: string, periodEnd: string): boolean {
  return shift.shiftDate >= periodStart && shift.shiftDate <= periodEnd;
}

function isEligibleAgencyShift(shift: RosterShiftRecord): boolean {
  const normalized = normalizeRosterShift(shift);
  return (
    normalized.coverageSource === "agency" &&
    Boolean(normalized.agencyWorkerId?.trim()) &&
    Boolean(normalized.vendorBpId?.trim()) &&
    normalized.status === "Completed"
  );
}

export function linkedAgencyRosterShiftIds(timesheets: AgencyTimesheetRecord[]): Set<string> {
  const ids = new Set<string>();
  for (const sheet of timesheets) {
    for (const line of sheet.lines) {
      if (line.rosterShiftId?.trim()) ids.add(line.rosterShiftId);
    }
  }
  return ids;
}

function defaultVendorHourlyRate(vendor: BusinessPartnerRecord | undefined): number {
  const rate = vendor?.agencyHourlyRate;
  return Number.isFinite(rate) && rate! > 0 ? rate! : 0;
}

function lineFromAgencyShift(
  shift: RosterShiftRecord,
  lineNo: number,
  hourlyRate: number,
  agencyShiftRequests: AgencyShiftRequestRecord[]
): AgencyTimesheetLine {
  const normalized = normalizeRosterShift(shift);
  const hours = shiftDurationHours(normalized);
  const request =
    agencyShiftRequests.find((r) => r.id === normalized.agencyRequestId) ??
    agencyShiftRequests.find((r) => r.rosterShiftId === normalized.id);
  return {
    ...emptyAgencyTimesheetLine(lineNo),
    id: `atl-${normalized.id}`,
    lineNo,
    rosterShiftId: normalized.id,
    agencyShiftRequestId: request?.id ?? normalized.agencyRequestId ?? "",
    agencyWorkerId: normalized.agencyWorkerId,
    clientId: normalized.clientId,
    locationId: normalized.locationId,
    shiftDate: normalized.shiftDate,
    startTime: normalized.startTime,
    endTime: normalized.endTime,
    hours,
    vendorHourlyRate: hourlyRate,
    vendorCost: agencyLineVendorCost(hours, hourlyRate),
    notes: normalized.notes,
  };
}

export function previewAgencyTimesheetGeneration(
  rosterShifts: RosterShiftRecord[],
  agencyTimesheets: AgencyTimesheetRecord[],
  businessPartners: BusinessPartnerRecord[],
  periodStart: string,
  periodEnd: string
): AgencyTimesheetGenerationPreview {
  const linked = linkedAgencyRosterShiftIds(agencyTimesheets);
  const byVendor = new Map<string, { shiftCount: number; totalHours: number; estimatedCost: number }>();
  let eligibleShiftCount = 0;
  let alreadyLinkedCount = 0;

  for (const shift of rosterShifts) {
    if (!shiftInPeriod(shift, periodStart, periodEnd)) continue;
    if (!isEligibleAgencyShift(shift)) continue;
    if (linked.has(shift.id)) {
      alreadyLinkedCount += 1;
      continue;
    }
    const normalized = normalizeRosterShift(shift);
    const vendor = businessPartners.find((p) => p.id === normalized.vendorBpId);
    const hours = shiftDurationHours(normalized);
    const rate = defaultVendorHourlyRate(vendor);
    const cost = agencyLineVendorCost(hours, rate);
    eligibleShiftCount += 1;
    const row = byVendor.get(normalized.vendorBpId) ?? { shiftCount: 0, totalHours: 0, estimatedCost: 0 };
    row.shiftCount += 1;
    row.totalHours = Math.round((row.totalHours + hours) * 100) / 100;
    row.estimatedCost = Math.round((row.estimatedCost + cost) * 100) / 100;
    byVendor.set(normalized.vendorBpId, row);
  }

  const rows = [...byVendor.entries()]
    .map(([vendorBpId, stats]) => ({ vendorBpId, ...stats }))
    .sort((a, b) => a.vendorBpId.localeCompare(b.vendorBpId));

  return { periodStart, periodEnd, eligibleShiftCount, alreadyLinkedCount, rows };
}

function findAgencyTimesheetForPeriod(
  timesheets: AgencyTimesheetRecord[],
  vendorBpId: string,
  periodStart: string,
  periodEnd: string
): AgencyTimesheetRecord | undefined {
  return timesheets.find(
    (sheet) =>
      sheet.vendorBpId === vendorBpId &&
      sheet.periodStart === periodStart &&
      sheet.periodEnd === periodEnd
  );
}

function findDraftAgencyTimesheet(
  timesheets: AgencyTimesheetRecord[],
  vendorBpId: string,
  periodStart: string,
  periodEnd: string
): AgencyTimesheetRecord | undefined {
  const sheet = findAgencyTimesheetForPeriod(timesheets, vendorBpId, periodStart, periodEnd);
  return sheet?.status === "Draft" ? sheet : undefined;
}

export function generateAgencyTimesheetsFromShifts(
  rosterShifts: RosterShiftRecord[],
  agencyTimesheets: AgencyTimesheetRecord[],
  businessPartners: BusinessPartnerRecord[],
  agencyShiftRequests: AgencyShiftRequestRecord[],
  periodStart: string,
  periodEnd: string,
  actorName = "SuperUser"
): AgencyTimesheetGenerationResult {
  const linked = linkedAgencyRosterShiftIds(agencyTimesheets);
  const shiftsByVendor = new Map<string, RosterShiftRecord[]>();
  let skippedAlreadyLinked = 0;

  for (const shift of rosterShifts) {
    if (!shiftInPeriod(shift, periodStart, periodEnd)) continue;
    if (!isEligibleAgencyShift(shift)) continue;
    if (linked.has(shift.id)) {
      skippedAlreadyLinked += 1;
      continue;
    }
    const vendorBpId = normalizeRosterShift(shift).vendorBpId;
    const list = shiftsByVendor.get(vendorBpId) ?? [];
    list.push(shift);
    shiftsByVendor.set(vendorBpId, list);
  }

  const created: AgencyTimesheetRecord[] = [];
  const updated: AgencyTimesheetRecord[] = [];
  let working = [...agencyTimesheets];
  let skippedLockedPeriod = 0;

  for (const [vendorBpId, shifts] of shiftsByVendor) {
    const existingPeriod = findAgencyTimesheetForPeriod(working, vendorBpId, periodStart, periodEnd);
    if (existingPeriod && existingPeriod.status !== "Draft") {
      skippedLockedPeriod += shifts.length;
      continue;
    }

    const vendor = businessPartners.find((p) => p.id === vendorBpId);
    const hourlyRate = defaultVendorHourlyRate(vendor);

    shifts.sort((a, b) =>
      `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`)
    );
    const newLines = shifts.map((shift, index) =>
      lineFromAgencyShift(shift, index + 1, hourlyRate, agencyShiftRequests)
    );

    const existingDraft = findDraftAgencyTimesheet(working, vendorBpId, periodStart, periodEnd);
    if (existingDraft) {
      const startLineNo = existingDraft.lines.length + 1;
      const appended = newLines.map((line, index) => ({ ...line, lineNo: startLineNo + index }));
      const mergedLines = [...existingDraft.lines, ...appended];
      const next = normalizeAgencyTimesheet({
        ...existingDraft,
        lines: mergedLines,
        totalHours: sumAgencyTimesheetLineHours(mergedLines),
        totalVendorCost: sumAgencyTimesheetVendorCost(mergedLines),
        updatedBy: actorName,
      });
      working = working.map((sheet) => (sheet.id === next.id ? next : sheet));
      updated.push(next);
      continue;
    }

    const next = createAgencyTimesheet(
      {
        vendorBpId,
        periodStart,
        periodEnd,
        status: "Draft",
        totalHours: sumAgencyTimesheetLineHours(newLines),
        totalVendorCost: sumAgencyTimesheetVendorCost(newLines),
        notes: "",
        lines: newLines,
        createdBy: actorName,
        updatedBy: actorName,
      },
      working
    );
    working = [...working, next];
    created.push(next);
  }

  return { created, updated, skippedAlreadyLinked, skippedLockedPeriod };
}
