/** Roster session — one live shift block with multiple clients and workers. */

export const SUPPORT_RATIO_OPTIONS = ["1:1", "1:2", "1:3", "1:4", "1:5"] as const;
export type SupportRatio = (typeof SUPPORT_RATIO_OPTIONS)[number];

export type WorkerCoverageRole = "fill" | "leave_pay";

export function normalizeWorkerCoverageRole(value: unknown): WorkerCoverageRole {
  return value === "leave_pay" ? "leave_pay" : "fill";
}

export function isLeavePayWorkerLine(line: Pick<RosterShiftWorkerLine, "coverageRole">): boolean {
  return normalizeWorkerCoverageRole(line.coverageRole) === "leave_pay";
}

export function isFillWorkerLine(line: Pick<RosterShiftWorkerLine, "coverageRole">): boolean {
  return !isLeavePayWorkerLine(line);
}

export type RosterShiftClientLine = {
  id: string;
  lineNo: number;
  clientId: string;
  serviceBookingId: string;
  serviceAgreementLineId: string;
  supportRatio: SupportRatio | string;
  billableHours: number | "";
  notes: string;
};

export type RosterShiftWorkerLine = {
  id: string;
  lineNo: number;
  employeeId: string;
  roleRequired: string;
  status: "required" | "assigned" | "absent" | "replacement_needed";
  /** fill = covering delivery; leave_pay = planned roster pay while absent. */
  coverageRole?: WorkerCoverageRole | string;
  leaveRequestId?: string;
  notes: string;
  checkedInAt: string;
  checkedOutAt: string;
};

export type RocSessionLineRef = {
  rocId: string;
  rocLineId: string;
  clientId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  locationId: string;
  supportType: string;
  serviceAgreementLineId: string;
  supportRatio: string;
  defaultEmployeeId: string;
  sessionKey: string;
  workerRequirement: string;
  notes: string;
};

function newLineId(prefix: string): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyRosterShiftClientLine(lineNo: number): RosterShiftClientLine {
  return {
    id: newLineId("rscl"),
    lineNo,
    clientId: "",
    serviceBookingId: "",
    serviceAgreementLineId: "",
    supportRatio: "1:1",
    billableHours: "",
    notes: "",
  };
}

export function emptyRosterShiftWorkerLine(lineNo: number): RosterShiftWorkerLine {
  return {
    id: newLineId("rswl"),
    lineNo,
    employeeId: "",
    roleRequired: "",
    status: "required",
    notes: "",
    checkedInAt: "",
    checkedOutAt: "",
  };
}

export function normalizeSupportRatio(value: string | undefined): SupportRatio | string {
  const trimmed = value?.trim() ?? "";
  if (SUPPORT_RATIO_OPTIONS.includes(trimmed as SupportRatio)) return trimmed as SupportRatio;
  return trimmed || "1:1";
}

export function normalizeRosterShiftClientLine(line: RosterShiftClientLine): RosterShiftClientLine {
  return {
    ...line,
    lineNo: line.lineNo || 1,
    clientId: line.clientId ?? "",
    serviceBookingId: line.serviceBookingId ?? "",
    serviceAgreementLineId: line.serviceAgreementLineId ?? "",
    supportRatio: normalizeSupportRatio(String(line.supportRatio ?? "1:1")),
    billableHours:
      line.billableHours === "" || line.billableHours == null
        ? ""
        : Number.isFinite(Number(line.billableHours))
          ? Number(line.billableHours)
          : "",
    notes: line.notes ?? "",
  };
}

export function normalizeRosterShiftWorkerLine(line: RosterShiftWorkerLine): RosterShiftWorkerLine {
  const status = line.status || "required";
  return {
    ...line,
    lineNo: line.lineNo || 1,
    employeeId: line.employeeId ?? "",
    roleRequired: line.roleRequired ?? "",
    status:
      status === "assigned" || status === "absent" || status === "replacement_needed" ? status : "required",
    coverageRole: normalizeWorkerCoverageRole(line.coverageRole),
    leaveRequestId: line.leaveRequestId ?? "",
    notes: line.notes ?? "",
    checkedInAt: line.checkedInAt ?? "",
    checkedOutAt: line.checkedOutAt ?? "",
  };
}

export function workerLineForEmployee(
  workerLines: RosterShiftWorkerLine[] | undefined,
  employeeId: string
): RosterShiftWorkerLine | undefined {
  const id = employeeId.trim();
  if (!id) return undefined;
  return (workerLines ?? []).map(normalizeRosterShiftWorkerLine).find((line) => line.employeeId.trim() === id);
}

export function shiftHasAssignedWorker(
  shift: { employeeId?: string; workerLines?: RosterShiftWorkerLine[] },
  employeeId: string
): boolean {
  const id = employeeId.trim();
  if (!id) return false;
  const workerLines = (shift.workerLines ?? []).map(normalizeRosterShiftWorkerLine);
  if (workerLines.some((line) => isFillWorkerLine(line) && line.employeeId.trim() === id)) return true;
  if (!workerLines.length && shift.employeeId?.trim() === id) return true;
  return false;
}

/** Workers assigned to cover delivery (excludes leave-pay lines). */
export function assignedWorkerIdsForShift(shift: {
  employeeId?: string;
  workerLines?: RosterShiftWorkerLine[];
}): string[] {
  const ids = new Set<string>();
  const workerLines = (shift.workerLines ?? []).map(normalizeRosterShiftWorkerLine);
  if (workerLines.length) {
    for (const line of workerLines) {
      if (!isFillWorkerLine(line)) continue;
      const id = line.employeeId?.trim();
      if (id) ids.add(id);
    }
    return [...ids];
  }
  if (shift.employeeId?.trim()) ids.add(shift.employeeId.trim());
  return [...ids];
}

export function leavePayWorkerIdsForShift(shift: {
  workerLines?: RosterShiftWorkerLine[];
}): string[] {
  const ids = new Set<string>();
  for (const line of shift.workerLines ?? []) {
    const normalized = normalizeRosterShiftWorkerLine(line);
    if (!isLeavePayWorkerLine(normalized)) continue;
    const id = normalized.employeeId.trim();
    if (id) ids.add(id);
  }
  return [...ids];
}

export function updateWorkerLineForEmployee(
  workerLines: RosterShiftWorkerLine[] | undefined,
  employeeId: string,
  update: Partial<Pick<RosterShiftWorkerLine, "checkedInAt" | "checkedOutAt" | "status" | "notes">>
): RosterShiftWorkerLine[] {
  const id = employeeId.trim();
  const normalized = (workerLines ?? []).map(normalizeRosterShiftWorkerLine);
  if (!id) return normalized;
  const index = normalized.findIndex((line) => line.employeeId.trim() === id);
  if (index < 0) return normalized;
  return normalized.map((line, i) =>
    i === index ? normalizeRosterShiftWorkerLine({ ...line, ...update }) : line
  );
}

/** Session grouping key for master roster lines → one live shift. */
export function rocSessionGroupKey(line: Pick<RocSessionLineRef, "sessionKey" | "weekday" | "startTime" | "endTime" | "locationId">): string {
  const key = line.sessionKey?.trim();
  if (!key) return "";
  return `${key}|${line.weekday}|${line.startTime.slice(0, 5)}|${line.endTime.slice(0, 5)}|${line.locationId}`;
}

export function sessionShiftId(groupKey: string, shiftDate: string): string {
  const slug = groupKey.replace(/[^a-zA-Z0-9]+/g, "-").slice(0, 80);
  return `rsh-sess-${slug}-${shiftDate}`;
}

export function syncShiftHeaderFromSessionLines<
  T extends {
    clientId: string;
    employeeId: string;
    serviceBookingId: string;
    clientLines?: RosterShiftClientLine[];
    workerLines?: RosterShiftWorkerLine[];
    requiredWorkerCount?: number;
  },
>(shift: T): T {
  const clientLines = (shift.clientLines ?? []).map(normalizeRosterShiftClientLine);
  const workerLines = (shift.workerLines ?? []).map(normalizeRosterShiftWorkerLine);
  const primaryClient = clientLines.find((line) => line.clientId.trim()) ?? clientLines[0];
  const primaryWorker =
    workerLines.find((line) => isFillWorkerLine(line) && line.employeeId.trim()) ??
    workerLines.find((line) => isFillWorkerLine(line)) ??
    workerLines[0];
  const assignedWorkers = workerLines.filter(
    (line) => isFillWorkerLine(line) && line.employeeId.trim()
  ).length;
  const requiredWorkerCount = Math.max(
    shift.requiredWorkerCount ?? 1,
    workerLines.length,
    assignedWorkers || 1
  );

  return {
    ...shift,
    clientLines,
    workerLines,
    clientId: primaryClient?.clientId ?? shift.clientId ?? "",
    serviceBookingId: primaryClient?.serviceBookingId ?? shift.serviceBookingId ?? "",
    employeeId: primaryWorker?.employeeId ?? shift.employeeId ?? "",
    requiredWorkerCount,
  };
}

export function ensureSessionLinesFromLegacyHeader<
  T extends {
    id: string;
    clientId: string;
    employeeId: string;
    serviceBookingId: string;
    checkedInAt?: string;
    checkedOutAt?: string;
    clientLines?: RosterShiftClientLine[];
    workerLines?: RosterShiftWorkerLine[];
  },
>(shift: T): T {
  const clientLines = [...(shift.clientLines ?? [])].map(normalizeRosterShiftClientLine);
  const workerLines = [...(shift.workerLines ?? [])].map(normalizeRosterShiftWorkerLine);

  if (!clientLines.length && shift.clientId?.trim()) {
    clientLines.push(
      normalizeRosterShiftClientLine({
        ...emptyRosterShiftClientLine(1),
        id: `rscl-${shift.id}`,
        clientId: shift.clientId,
        serviceBookingId: shift.serviceBookingId ?? "",
      })
    );
  }

  if (!workerLines.length) {
    workerLines.push(
      normalizeRosterShiftWorkerLine({
        ...emptyRosterShiftWorkerLine(1),
        id: `rswl-${shift.id}`,
        employeeId: shift.employeeId ?? "",
        status: shift.employeeId?.trim() ? "assigned" : "required",
        checkedInAt: shift.checkedInAt ?? "",
        checkedOutAt: shift.checkedOutAt ?? "",
      })
    );
  }

  // Reconcile a header-only worker assignment (e.g. an open-shift claim/approve
  // that set `employeeId` without touching worker lines) into the session
  // lines, so the following header sync does not discard the assigned worker.
  const headerEmployeeId = shift.employeeId?.trim() ?? "";
  if (headerEmployeeId && !workerLines.some((line) => line.employeeId.trim() === headerEmployeeId)) {
    const vacant = workerLines.find((line) => !line.employeeId.trim());
    if (vacant) {
      vacant.employeeId = headerEmployeeId;
      vacant.status = "assigned";
      if (shift.checkedInAt?.trim()) vacant.checkedInAt = shift.checkedInAt;
      if (shift.checkedOutAt?.trim()) vacant.checkedOutAt = shift.checkedOutAt;
    } else {
      workerLines.push(
        normalizeRosterShiftWorkerLine({
          ...emptyRosterShiftWorkerLine(workerLines.length + 1),
          id: `rswl-${shift.id}-${workerLines.length + 1}`,
          employeeId: headerEmployeeId,
          status: "assigned",
          checkedInAt: shift.checkedInAt ?? "",
          checkedOutAt: shift.checkedOutAt ?? "",
        })
      );
    }
  }

  return syncShiftHeaderFromSessionLines({ ...shift, clientLines, workerLines });
}

export function sessionParticipantSummary(clientCount: number, workerCount: number): string {
  const clients = `${clientCount} client${clientCount === 1 ? "" : "s"}`;
  const workers = `${workerCount} worker${workerCount === 1 ? "" : "s"}`;
  return `${clients} · ${workers}`;
}
