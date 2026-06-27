import { detectRecurringRosterConflicts } from "@/lib/roster-shift-conflicts";
import { validateRosterShift } from "@/lib/roster-shift-compliance";
import {
  addDaysIso,
  normalizeRosterShift,
  weekStartFromDate,
  type RosterShiftRecord,
} from "@/lib/roster-shift";
import { ROC_WEEKDAY_LABELS, type RosterOfCareLine, type RosterOfCareRecord } from "@/lib/roster-of-care";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import { applyLeaveToWorkerLines, type EmployeeLeaveContext } from "@/lib/roster-leave";
import {
  emptyRosterShiftClientLine,
  emptyRosterShiftWorkerLine,
  normalizeRosterShiftClientLine,
  normalizeRosterShiftWorkerLine,
  rocSessionGroupKey,
  sessionShiftId,
  syncShiftHeaderFromSessionLines,
  type RosterShiftClientLine,
  type RosterShiftWorkerLine,
} from "@/lib/roster-session";

export type RocPublishInput = {
  weekStart: string;
  weekCount: number;
  status: "Draft" | "Published";
  actor: string;
  /** When true, skip dates that already have a RoC-linked shift id. */
  skipExisting?: boolean;
};

export type RocPublishPreview = {
  shifts: RosterShiftRecord[];
  skippedLines: { lineNo: number; reason: string }[];
  warnings: string[];
  /** Template workers on approved leave — shift vacated for fill, leave-pay line added. */
  leaveAppliedCount: number;
};

export type RocPublishValidation = {
  blocked: boolean;
  errors: string[];
  warnings: string[];
};

type PendingRocLine = {
  roc: RosterOfCareRecord;
  line: RosterOfCareLine;
  shiftDate: string;
  groupKey: string;
};

function shiftIdForRocLine(
  rocId: string,
  line: Pick<RosterOfCareLine, "weekday" | "startTime" | "endTime">,
  shiftDate: string
): string {
  const start = line.startTime.slice(0, 5);
  const end = line.endTime.slice(0, 5);
  return `rsh-${rocId}-w${line.weekday}-${start}-${end}-${shiftDate}`;
}

function lineGroupKey(rocId: string, line: RosterOfCareLine): string {
  const session = rocSessionGroupKey(line);
  if (session) return session;
  return `legacy-${rocId}-${line.id}`;
}

function shiftIdForGroup(groupKey: string, shiftDate: string, rocId: string, line: RosterOfCareLine): string {
  if (groupKey.startsWith("legacy-")) return shiftIdForRocLine(rocId, line, shiftDate);
  return sessionShiftId(groupKey, shiftDate);
}

function isDateInRocRange(date: string, validFrom: string, validTo: string): boolean {
  if (validFrom?.trim() && date < validFrom.slice(0, 10)) return false;
  if (validTo?.trim() && date > validTo.slice(0, 10)) return false;
  return true;
}

/** Pick an in-range service booking for the client (prefer matching agreement). */
export function resolveServiceBookingId(
  clientId: string,
  serviceAgreementId: string,
  shiftDate: string,
  bookings: ServiceBookingRecord[]
): string {
  const inRange = bookings.filter(
    (b) =>
      b.clientId === clientId &&
      b.documentStatus !== "Cancelled" &&
      (!b.startDate?.trim() || b.startDate.slice(0, 10) <= shiftDate) &&
      (!b.endDate?.trim() || b.endDate.slice(0, 10) >= shiftDate)
  );
  const withAgreement = serviceAgreementId
    ? inRange.filter((b) => b.serviceAgreementId === serviceAgreementId)
    : inRange;
  return (withAgreement[0] ?? inRange[0])?.id ?? "";
}

function clientLineFromRoc(
  roc: RosterOfCareRecord,
  line: RosterOfCareLine,
  shiftDate: string,
  lineNo: number,
  serviceBookings: ServiceBookingRecord[]
): RosterShiftClientLine {
  const bookingId = resolveServiceBookingId(roc.clientId, roc.serviceAgreementId, shiftDate, serviceBookings);
  return normalizeRosterShiftClientLine({
    ...emptyRosterShiftClientLine(lineNo),
    id: `rscl-${roc.id}-${line.id}-${shiftDate}`,
    clientId: roc.clientId,
    serviceBookingId: bookingId,
    serviceAgreementLineId: line.serviceAgreementLineId,
    supportRatio: line.supportRatio || "1:1",
    notes: line.notes?.trim() ? line.notes : "",
  });
}

function workerLineFromRoc(line: RosterOfCareLine, shiftDate: string, lineNo: number): RosterShiftWorkerLine | null {
  const employeeId = line.defaultEmployeeId?.trim() ?? "";
  const roleRequired = line.workerRequirement?.trim() ?? "";
  if (!employeeId && !roleRequired) return null;
  return normalizeRosterShiftWorkerLine({
    ...emptyRosterShiftWorkerLine(lineNo),
    id: `rswl-${line.id}-${shiftDate}-${lineNo}`,
    employeeId,
    roleRequired,
    status: employeeId ? "assigned" : "required",
  });
}

function mergeWorkerLines(existing: RosterShiftWorkerLine[], incoming: RosterShiftWorkerLine[]): RosterShiftWorkerLine[] {
  const merged = [...existing];
  for (const line of incoming) {
    const duplicate = merged.some(
      (row) =>
        (line.employeeId && row.employeeId === line.employeeId) ||
        (!line.employeeId && !row.employeeId && row.roleRequired === line.roleRequired)
    );
    if (!duplicate) merged.push(line);
  }
  return merged.map((line, index) => ({ ...line, lineNo: index + 1 }));
}

function mergeClientLines(existing: RosterShiftClientLine[], incoming: RosterShiftClientLine[]): RosterShiftClientLine[] {
  const merged = [...existing];
  for (const line of incoming) {
    const duplicate = merged.some((row) => row.clientId === line.clientId && row.supportRatio === line.supportRatio);
    if (!duplicate) merged.push(line);
  }
  return merged.map((line, index) => ({ ...line, lineNo: index + 1 }));
}

function collectPeerLines(
  primaryRoc: RosterOfCareRecord,
  allRocs: RosterOfCareRecord[] | undefined
): RosterOfCareRecord[] {
  // Only Active peer templates may merge into a live session. Draft / inactive
  // RoCs must never silently add clients or workers to a published shift.
  const peers = (allRocs ?? []).filter((roc) => roc.id !== primaryRoc.id && roc.status === "Active");
  return [primaryRoc, ...peers];
}

function existingShiftForGroup(
  id: string,
  groupKey: string,
  shiftDate: string,
  locationId: string,
  startTime: string,
  endTime: string,
  existing: RosterShiftRecord[]
): RosterShiftRecord | undefined {
  const byId = existing.find((s) => s.id === id);
  if (byId) return byId;
  if (groupKey.startsWith("legacy-")) return undefined;
  return existing.find(
    (s) =>
      s.sessionKey &&
      s.sessionKey === groupKey.split("|")[0] &&
      s.shiftDate === shiftDate &&
      s.locationId === locationId &&
      s.startTime.slice(0, 5) === startTime.slice(0, 5) &&
      s.endTime.slice(0, 5) === endTime.slice(0, 5)
  );
}

export function buildShiftsFromRosterOfCare(
  roc: RosterOfCareRecord,
  input: RocPublishInput,
  existing: RosterShiftRecord[],
  serviceBookings: ServiceBookingRecord[],
  allRocs?: RosterOfCareRecord[],
  employees: EmployeeLeaveContext[] = []
): RocPublishPreview {
  const weekStart = weekStartFromDate(input.weekStart);
  const weeks = Math.max(1, Math.min(12, input.weekCount));
  const shifts: RosterShiftRecord[] = [];
  const skippedLines: { lineNo: number; reason: string }[] = [];
  const warnings: string[] = [];
  let leaveAppliedCount = 0;

  if (!roc.lines.length) {
    warnings.push("This roster of care has no weekly lines.");
    return { shifts, skippedLines, warnings, leaveAppliedCount: 0 };
  }

  const rocsInScope = collectPeerLines(roc, allRocs);
  const groupId = `roc-${roc.id}`;
  const bookingWarnings = new Set<string>();
  const skippedLineNos = new Set<number>();

  for (let w = 0; w < weeks; w += 1) {
    const ws = addDaysIso(weekStart, w * 7);
    const pendingByGroup = new Map<string, PendingRocLine[]>();

    for (const sourceRoc of rocsInScope) {
      for (const line of sourceRoc.lines) {
        const shiftDate = addDaysIso(ws, line.weekday);
        if (!isDateInRocRange(shiftDate, sourceRoc.validFrom, sourceRoc.validTo)) continue;
        if (!line.locationId?.trim()) {
          if (sourceRoc.id === roc.id) skippedLineNos.add(line.lineNo);
          continue;
        }
        const groupKey = lineGroupKey(sourceRoc.id, line);
        const bucket = pendingByGroup.get(groupKey) ?? [];
        bucket.push({ roc: sourceRoc, line, shiftDate, groupKey });
        pendingByGroup.set(groupKey, bucket);
      }
    }

    for (const [groupKey, pendingLines] of pendingByGroup) {
      if (!pendingLines.some((row) => row.roc.id === roc.id)) continue;
      const anchor = pendingLines.find((row) => row.roc.id === roc.id) ?? pendingLines[0];
      const { line, shiftDate } = anchor;
      const computedId = shiftIdForGroup(groupKey, shiftDate, anchor.roc.id, line);

      // Match an existing shift by id OR by session metadata (covers legacy
      // per-RoC ids and manually edited sessions). Reuse its id so re-publishing
      // updates the existing row instead of inserting a duplicate.
      const prior = existingShiftForGroup(
        computedId,
        groupKey,
        shiftDate,
        line.locationId,
        line.startTime,
        line.endTime,
        existing
      );
      const id = prior?.id ?? computedId;

      if (input.skipExisting && prior) continue;

      let clientLines: RosterShiftClientLine[] = [...(prior?.clientLines ?? [])];
      let workerLines: RosterShiftWorkerLine[] = [...(prior?.workerLines ?? [])];

      for (const pending of pendingLines) {
        const clientLine = clientLineFromRoc(
          pending.roc,
          pending.line,
          pending.shiftDate,
          clientLines.length + 1,
          serviceBookings
        );
        clientLines = mergeClientLines(clientLines, [clientLine]);
        if (!clientLine.serviceBookingId) bookingWarnings.add(pending.shiftDate);

        const workerLine = workerLineFromRoc(pending.line, pending.shiftDate, workerLines.length + 1);
        if (workerLine) workerLines = mergeWorkerLines(workerLines, [workerLine]);
      }

      const leaveResult = applyLeaveToWorkerLines(workerLines, employees, shiftDate);
      workerLines = leaveResult.workerLines;
      leaveAppliedCount += leaveResult.leaveAppliedCount;

      if (!workerLines.length) {
        workerLines = [
          normalizeRosterShiftWorkerLine({
            ...emptyRosterShiftWorkerLine(1),
            id: prior?.workerLines?.[0]?.id ?? `rswl-${id}`,
            status: "required",
          }),
        ];
      }

      const sessionKey = groupKey.startsWith("legacy-") ? "" : groupKey.split("|")[0] ?? "";
      const dayLabel = ROC_WEEKDAY_LABELS[line.weekday] ?? "Day";
      const shiftRef =
        prior?.shiftRef ||
        (sessionKey
          ? `${sessionKey}-${dayLabel}`.replace(/\s+/g, "-").slice(0, 48)
          : `${roc.name}-${dayLabel}-${line.startTime}`.replace(/\s+/g, "-").slice(0, 48));

      const notesParts = pendingLines
        .filter((row) => row.line.notes?.trim())
        .map((row) => `${row.roc.name}: ${row.line.notes.trim()}`);
      const notes =
        notesParts.length > 0
          ? notesParts.join(" · ")
          : sessionKey
            ? `Session ${sessionKey} — from RoC`
            : `From RoC: ${roc.name}`;

      const built = syncShiftHeaderFromSessionLines({
        ...(prior ?? {}),
        id,
        shiftRef,
        clientId: clientLines[0]?.clientId ?? roc.clientId,
        employeeId: workerLines.find((row) => row.employeeId)?.employeeId ?? prior?.employeeId ?? "",
        locationId: line.locationId,
        serviceBookingId: clientLines[0]?.serviceBookingId ?? prior?.serviceBookingId ?? "",
        shiftDate,
        startTime: line.startTime,
        endTime: line.endTime,
        shiftType: line.supportType || "Standard",
        status: input.status,
        notes,
        recurrenceGroupId: prior?.recurrenceGroupId || groupId,
        sessionKey,
        requiredWorkerCount: Math.max(workerLines.length, prior?.requiredWorkerCount ?? 1),
        clientLines,
        workerLines,
        checkedInAt: prior?.checkedInAt ?? "",
        checkedOutAt: prior?.checkedOutAt ?? "",
        checkInNotes: prior?.checkInNotes ?? "",
        checkInLatitude: prior?.checkInLatitude ?? "",
        checkInLongitude: prior?.checkInLongitude ?? "",
        checkOutLatitude: prior?.checkOutLatitude ?? "",
        checkOutLongitude: prior?.checkOutLongitude ?? "",
        coverageSource: prior?.coverageSource ?? "internal",
        agencyWorkerId: prior?.agencyWorkerId ?? "",
        vendorBpId: prior?.vendorBpId ?? "",
        agencyRequestId: prior?.agencyRequestId ?? "",
        createdBy: prior?.createdBy || input.actor,
        updatedBy: input.actor,
      });

      const shiftIndex = shifts.findIndex((s) => s.id === id);
      if (shiftIndex >= 0) {
        shifts[shiftIndex] = normalizeRosterShift(
          syncShiftHeaderFromSessionLines({
            ...shifts[shiftIndex],
            clientLines: mergeClientLines(shifts[shiftIndex].clientLines ?? [], built.clientLines ?? []),
            workerLines: mergeWorkerLines(shifts[shiftIndex].workerLines ?? [], built.workerLines ?? []),
            notes: built.notes,
            sessionKey: built.sessionKey,
            requiredWorkerCount: Math.max(
              shifts[shiftIndex].requiredWorkerCount ?? 1,
              built.requiredWorkerCount ?? 1
            ),
            updatedBy: input.actor,
          })
        );
      } else {
        shifts.push(normalizeRosterShift(built));
      }
    }
  }

  for (const lineNo of skippedLineNos) {
    skippedLines.push({
      lineNo,
      reason: `Line ${lineNo} — missing location on all weeks in range`,
    });
  }

  if (bookingWarnings.size) {
    warnings.push(
      `${bookingWarnings.size} shift date${bookingWarnings.size === 1 ? "" : "s"} have no matching service booking — shifts are saved without a booking link.`
    );
  }

  const sessionGroups = new Set(
    roc.lines.filter((line) => line.sessionKey?.trim()).map((line) => rocSessionGroupKey(line))
  );
  if (sessionGroups.size) {
    warnings.push(
      `${sessionGroups.size} session group${sessionGroups.size === 1 ? "" : "s"} on this RoC — lines with the same session key publish to one live shift.`
    );
  }

  if (leaveAppliedCount > 0) {
    warnings.push(
      `${leaveAppliedCount} template worker assignment${leaveAppliedCount === 1 ? "" : "s"} on approved leave — vacant fill slot created with planned leave pay.`
    );
  }

  return { shifts, skippedLines, warnings, leaveAppliedCount };
}

/** Bulk rollover scope — roll forward every active RoC, one client, or one location. */
export type RocRolloverScope =
  | { kind: "all" }
  | { kind: "client"; clientId: string }
  | { kind: "location"; locationId: string };

export type BulkRocPublishPreview = {
  shifts: RosterShiftRecord[];
  /** Number of RoC templates contributing lines to this rollover. */
  rocCount: number;
  skippedLines: { rocId: string; lineNo: number; reason: string }[];
  warnings: string[];
  leaveAppliedCount: number;
};

/** Restrict a RoC's lines to a single location (used by location-scoped rollover). */
function rocWithLinesAtLocation(roc: RosterOfCareRecord, locationId: string): RosterOfCareRecord {
  return { ...roc, lines: roc.lines.filter((line) => line.locationId?.trim() === locationId) };
}

/**
 * Bulk rollover across multiple RoC templates in one action.
 *
 * - `all` — every Active RoC.
 * - `client` — Active RoCs for one participant (co-resident sessions still merge).
 * - `location` — only the lines delivered at one location, across all participants.
 *
 * Each in-scope RoC is published with the single-RoC builder (which already merges
 * peer Active session lines), then results are de-duplicated by shift id so shared
 * sessions are never written twice.
 */
export function buildShiftsFromRosterOfCares(
  scope: RocRolloverScope,
  input: RocPublishInput,
  existing: RosterShiftRecord[],
  serviceBookings: ServiceBookingRecord[],
  allRocs: RosterOfCareRecord[],
  employees: EmployeeLeaveContext[] = []
): BulkRocPublishPreview {
  const activeRocs = (allRocs ?? []).filter((roc) => roc.status === "Active");

  let scopeRocs: RosterOfCareRecord[];
  let mergeRocs: RosterOfCareRecord[];
  if (scope.kind === "client") {
    scopeRocs = activeRocs.filter((roc) => roc.clientId === scope.clientId);
    mergeRocs = activeRocs;
  } else if (scope.kind === "location") {
    const filtered = activeRocs
      .map((roc) => rocWithLinesAtLocation(roc, scope.locationId))
      .filter((roc) => roc.lines.length > 0);
    scopeRocs = filtered;
    mergeRocs = filtered;
  } else {
    scopeRocs = activeRocs;
    mergeRocs = activeRocs;
  }

  const byId = new Map<string, RosterShiftRecord>();
  const skippedLines: { rocId: string; lineNo: number; reason: string }[] = [];
  const warnings = new Set<string>();
  let leaveAppliedCount = 0;

  for (const roc of scopeRocs) {
    const preview = buildShiftsFromRosterOfCare(roc, input, existing, serviceBookings, mergeRocs, employees);
    leaveAppliedCount += preview.leaveAppliedCount;
    for (const reason of preview.warnings) warnings.add(reason);
    for (const skip of preview.skippedLines) {
      skippedLines.push({ rocId: roc.id, lineNo: skip.lineNo, reason: skip.reason });
    }
    for (const shift of preview.shifts) {
      const prior = byId.get(shift.id);
      if (!prior) {
        byId.set(shift.id, shift);
        continue;
      }
      byId.set(
        shift.id,
        normalizeRosterShift(
          syncShiftHeaderFromSessionLines({
            ...prior,
            clientLines: mergeClientLines(prior.clientLines ?? [], shift.clientLines ?? []),
            workerLines: mergeWorkerLines(prior.workerLines ?? [], shift.workerLines ?? []),
            notes: shift.notes || prior.notes,
            sessionKey: prior.sessionKey || shift.sessionKey,
            requiredWorkerCount: Math.max(prior.requiredWorkerCount ?? 1, shift.requiredWorkerCount ?? 1),
            updatedBy: input.actor,
          })
        )
      );
    }
  }

  return {
    shifts: [...byId.values()],
    rocCount: scopeRocs.length,
    skippedLines,
    warnings: [...warnings],
    leaveAppliedCount,
  };
}

export function validateRocPublishShifts(
  shifts: RosterShiftRecord[],
  existing: RosterShiftRecord[],
  options?: { allSkippedByExisting?: boolean }
): RocPublishValidation {
  if (!shifts.length) {
    if (options?.allSkippedByExisting) {
      return {
        blocked: false,
        errors: [],
        warnings: ["All dates in this range were already published from this RoC."],
      };
    }
    return { blocked: true, errors: ["No shifts in range — check RoC dates and weekly lines."], warnings: [] };
  }

  const batchIds = new Set(shifts.map((s) => s.id));
  const conflictMap = detectRecurringRosterConflicts(shifts, existing);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const shift of shifts) {
    const peers = [
      ...existing.filter((r) => r.id !== shift.id && !batchIds.has(r.id)),
      ...shifts.filter((r) => r.id !== shift.id),
    ];
    const fieldIssues = validateRosterShift(shift, { existing: peers, batchIds });
    for (const issue of fieldIssues) {
      if (issue.code === "TIME_RANGE_INVALID") continue;
      const msg = `${shift.shiftDate}: ${issue.message}`;
      if (issue.severity === "error") errors.push(msg);
      else warnings.push(msg);
    }
    for (const issue of conflictMap.get(shift.id) ?? []) {
      const msg = `${shift.shiftDate}: ${issue.message}`;
      if (issue.severity === "error") errors.push(msg);
      else warnings.push(msg);
    }
  }

  return {
    blocked: errors.length > 0,
    errors: [...new Set(errors)],
    warnings: [...new Set(warnings)],
  };
}
