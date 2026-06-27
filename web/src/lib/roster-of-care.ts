/** Roster of Care — structured weekly support schedule per participant. */

export type RosterOfCareLine = {
  id: string;
  lineNo: number;
  weekday: number;
  startTime: string;
  endTime: string;
  supportType: string;
  locationId: string;
  serviceAgreementLineId: string;
  workerRequirement: string;
  defaultEmployeeId: string;
  supportRatio: string;
  sessionKey: string;
  notes: string;
};

export type RosterOfCareRecord = {
  id: string;
  clientId: string;
  serviceAgreementId: string;
  name: string;
  status: string;
  source: string;
  validFrom: string;
  validTo: string;
  createdBy: string;
  updatedBy: string;
  lines: RosterOfCareLine[];
};

export const rosterOfCareDropdowns = {
  status: ["Draft", "Active", "Archived"],
  source: ["Manual", "CSV import", "Generated"],
  supportType: ["Standard", "Sleepover", "Active overnight", "Group"],
  supportRatio: ["1:1", "1:2", "1:3", "1:4", "1:5"],
};

export const ROC_WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function rocWeekdayLabel(weekday: number): string {
  return ROC_WEEKDAY_LABELS[weekday] ?? "—";
}

export function emptyRosterOfCareLine(lineNo: number, weekday = 0): RosterOfCareLine {
  const suffix =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${lineNo}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id: `rocl-${suffix}`,
    lineNo,
    weekday,
    startTime: "09:00",
    endTime: "15:00",
    supportType: "Standard",
    locationId: "",
    serviceAgreementLineId: "",
    workerRequirement: "",
    defaultEmployeeId: "",
    supportRatio: "1:1",
    sessionKey: "",
    notes: "",
  };
}

export function normalizeRosterOfCare(record: RosterOfCareRecord): RosterOfCareRecord {
  return {
    ...record,
    clientId: record.clientId ?? "",
    serviceAgreementId: record.serviceAgreementId ?? "",
    name: record.name ?? "",
    status: record.status || "Active",
    source: record.source || "Manual",
    validFrom: record.validFrom?.slice(0, 10) ?? "",
    validTo: record.validTo?.slice(0, 10) ?? "",
    lines: (record.lines ?? [])
      .map((line, index) => ({
        ...line,
        lineNo: line.lineNo || index + 1,
        weekday: Number.isFinite(line.weekday) ? Math.min(6, Math.max(0, line.weekday)) : 0,
        startTime: line.startTime?.slice(0, 5) ?? "",
        endTime: line.endTime?.slice(0, 5) ?? "",
        supportType: line.supportType || "Standard",
        locationId: line.locationId ?? "",
        serviceAgreementLineId: line.serviceAgreementLineId ?? "",
        workerRequirement: line.workerRequirement ?? "",
        defaultEmployeeId: line.defaultEmployeeId ?? "",
        supportRatio: line.supportRatio || "1:1",
        sessionKey: line.sessionKey ?? "",
        notes: line.notes ?? "",
      }))
      .sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)),
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createRosterOfCare(
  partial: Partial<RosterOfCareRecord> & Pick<RosterOfCareRecord, "clientId">,
  existing: RosterOfCareRecord[] = []
): RosterOfCareRecord {
  const id =
    partial.id?.trim() ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? `roc-${crypto.randomUUID()}`
      : `roc-${Date.now()}`);
  const clientRocCount = existing.filter((r) => r.clientId === partial.clientId).length;
  const name = partial.name?.trim() || `RoC ${clientRocCount + 1}`;
  return normalizeRosterOfCare({
    serviceAgreementId: "",
    name,
    status: "Active",
    source: "Manual",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    lines: [],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...partial,
    id,
    clientId: partial.clientId,
  });
}

export const initialRosterOfCares: RosterOfCareRecord[] = [];
