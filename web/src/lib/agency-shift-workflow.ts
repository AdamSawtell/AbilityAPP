import {
  createAgencyShiftRequest,
  normalizeAgencyShiftRequest,
  openAgencyRequestForShift,
  type AgencyShiftRequestRecord,
} from "@/lib/agency-shift-request";
import { agencyWorkerDisplayName, type AgencyWorkerRecord } from "@/lib/agency-worker";
import type { BusinessPartnerRecord } from "@/lib/business-partner";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import {
  checkSiteOrientation,
  createSiteOrientation,
  latestOrientationForWorker,
  type SiteOrientationRecord,
  type SiteOrientationWorkerType,
} from "@/lib/site-orientation";
import {
  formatDayHeading,
  formatShiftTimeRange,
  normalizeRosterShift,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

export type AgencyShiftPack = {
  subject: string;
  body: string;
  mailtoUrl: string;
};

export function lastAgencyWorkedAtLocation(
  shifts: RosterShiftRecord[],
  agencyWorkerId: string,
  locationId: string,
  beforeDate: string
): string | undefined {
  const dates = shifts
    .filter(
      (s) =>
        normalizeRosterShift(s).agencyWorkerId === agencyWorkerId &&
        normalizeRosterShift(s).locationId === locationId &&
        normalizeRosterShift(s).shiftDate < beforeDate &&
        normalizeRosterShift(s).status !== "Cancelled"
    )
    .map((s) => normalizeRosterShift(s).shiftDate)
    .sort();
  return dates.length ? dates[dates.length - 1] : undefined;
}

export function buildAgencyShiftPack(input: {
  request: AgencyShiftRequestRecord;
  shift: RosterShiftRecord;
  vendor: BusinessPartnerRecord;
  client?: ClientRecord;
  location?: LocationRecord;
  worker?: AgencyWorkerRecord;
}): AgencyShiftPack {
  const shift = normalizeRosterShift(input.shift);
  const clientName = input.client?.name || input.client?.searchKey || "Participant";
  const locationName = input.location?.name || input.location?.searchKey || "Site";
  const when = `${formatDayHeading(shift.shiftDate)} ${formatShiftTimeRange(shift.startTime, shift.endTime)}`;
  const workerLine = input.worker
    ? `Proposed worker: ${agencyWorkerDisplayName(input.worker)}`
    : "Proposed worker: (to be confirmed by agency)";

  const subject = `Shift pack ${input.request.documentNo} — ${clientName} ${when}`;
  const body = [
    `Agency shift request ${input.request.documentNo}`,
    "",
    `Vendor: ${input.vendor.name}`,
    `Client: ${clientName}`,
    `Location: ${locationName}`,
    `When: ${when}`,
    `Shift ref: ${shift.shiftRef}`,
    "",
    input.request.skillsRequired ? `Skills required: ${input.request.skillsRequired}` : "",
    workerLine,
    "",
    "Please confirm the assigned worker and return any continuity notes.",
    "",
    input.request.continuityNotes ? `Continuity notes: ${input.request.continuityNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const to = input.vendor.email?.trim() || "";
  const mailtoUrl = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return { subject, body, mailtoUrl };
}

export function requestAgencyCoverage(input: {
  shift: RosterShiftRecord;
  vendorBpId: string;
  skillsRequired?: string;
  notes?: string;
  actor: string;
  existingRequests: AgencyShiftRequestRecord[];
}): AgencyShiftRequestRecord {
  const open = openAgencyRequestForShift(input.existingRequests, input.shift.id);
  if (open) return normalizeAgencyShiftRequest(open);

  return createAgencyShiftRequest(
    {
      rosterShiftId: input.shift.id,
      vendorBpId: input.vendorBpId,
      skillsRequired: input.skillsRequired ?? "",
      notes: input.notes ?? "",
      createdBy: input.actor,
      updatedBy: input.actor,
    },
    input.existingRequests
  );
}

export function proposeAgencyWorker(input: {
  request: AgencyShiftRequestRecord;
  agencyWorkerId: string;
  actor: string;
}): AgencyShiftRequestRecord {
  return normalizeAgencyShiftRequest({
    ...input.request,
    agencyWorkerId: input.agencyWorkerId,
    status: "Worker proposed",
    updatedBy: input.actor,
  });
}

export function sendAgencyShiftPack(input: {
  request: AgencyShiftRequestRecord;
  actor: string;
  now?: string;
}): AgencyShiftRequestRecord {
  const now = input.now ?? new Date().toISOString();
  return normalizeAgencyShiftRequest({
    ...input.request,
    status: "Sent",
    sentAt: now,
    updatedBy: input.actor,
  });
}

export type ConfirmAgencyResult = {
  request: AgencyShiftRequestRecord;
  shift: RosterShiftRecord;
  orientation: ReturnType<typeof checkSiteOrientation>;
};

export function confirmAgencyShift(input: {
  request: AgencyShiftRequestRecord;
  shift: RosterShiftRecord;
  agencyWorker: AgencyWorkerRecord;
  orientations: SiteOrientationRecord[];
  allShifts: RosterShiftRecord[];
  actor: string;
  now?: string;
  blockOnOrientation?: boolean;
}): { ok: boolean; error?: string; result?: ConfirmAgencyResult } {
  const shift = normalizeRosterShift(input.shift);
  if (!shift.locationId?.trim()) {
    return { ok: false, error: "Shift has no location — cannot confirm agency worker." };
  }
  if (input.agencyWorker.vendorBpId !== input.request.vendorBpId) {
    return { ok: false, error: "Selected worker does not belong to the requested vendor." };
  }

  const lastWorked = lastAgencyWorkedAtLocation(
    input.allShifts,
    input.agencyWorker.id,
    shift.locationId,
    shift.shiftDate
  );
  const orientation = checkSiteOrientation(
    input.orientations,
    "agency",
    input.agencyWorker.id,
    shift.locationId,
    shift.shiftDate,
    lastWorked
  );

  if (!orientation.ok && input.blockOnOrientation !== false) {
    return { ok: false, error: orientation.message };
  }

  const now = input.now ?? new Date().toISOString();
  const request = normalizeAgencyShiftRequest({
    ...input.request,
    agencyWorkerId: input.agencyWorker.id,
    status: "Confirmed",
    confirmedAt: now,
    updatedBy: input.actor,
  });

  const updatedShift = normalizeRosterShift({
    ...shift,
    coverageSource: "agency",
    agencyWorkerId: input.agencyWorker.id,
    vendorBpId: input.request.vendorBpId,
    agencyRequestId: request.id,
    employeeId: "",
    updatedBy: input.actor,
  });

  return {
    ok: true,
    result: { request, shift: updatedShift, orientation },
  };
}

export function completeAgencyShift(input: {
  request: AgencyShiftRequestRecord;
  shift: RosterShiftRecord;
  actor: string;
  now?: string;
}): { request: AgencyShiftRequestRecord; shift: RosterShiftRecord } {
  const now = input.now ?? new Date().toISOString();
  const request = normalizeAgencyShiftRequest({
    ...input.request,
    status: "Completed",
    completedAt: now,
    updatedBy: input.actor,
  });
  const shift = normalizeRosterShift({
    ...normalizeRosterShift(input.shift),
    status: "Completed",
    updatedBy: input.actor,
  });
  return { request, shift };
}

export function recordSiteOrientation(input: {
  workerType: SiteOrientationWorkerType;
  workerId: string;
  locationId: string;
  orientedAt: string;
  acknowledgedBy: string;
  notes?: string;
  actor: string;
  existing: SiteOrientationRecord[];
}): SiteOrientationRecord {
  return createSiteOrientation(
    {
      workerType: input.workerType,
      workerId: input.workerId,
      locationId: input.locationId,
      orientedAt: input.orientedAt,
      acknowledgedBy: input.acknowledgedBy,
      notes: input.notes,
      createdBy: input.actor,
      updatedBy: input.actor,
    },
    input.existing
  );
}
