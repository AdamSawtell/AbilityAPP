/** Agency vendor timesheet — lines from completed agency roster shifts with vendor cost. */
export type AgencyTimesheetLine = {
  id: string;
  lineNo: number;
  rosterShiftId: string;
  agencyShiftRequestId: string;
  agencyWorkerId: string;
  clientId: string;
  locationId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  hours: number;
  vendorHourlyRate: number;
  vendorCost: number;
  notes: string;
};

export type AgencyTimesheetRecord = {
  id: string;
  documentNo: string;
  vendorBpId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalHours: number;
  totalVendorCost: number;
  notes: string;
  lines: AgencyTimesheetLine[];
  createdBy: string;
  updatedBy: string;
};

export const agencyTimesheetDropdowns = {
  status: ["Draft", "Approved"],
};

export const initialAgencyTimesheets: AgencyTimesheetRecord[] = [
  {
    id: "at-demo-staffplus-week",
    documentNo: "ATS-DEMO-01",
    vendorBpId: "bp-staffplus",
    periodStart: "2025-10-06",
    periodEnd: "2025-10-12",
    status: "Approved",
    totalHours: 6,
    totalVendorCost: 435,
    notes: "Demo approved timesheet for agency portal invoice",
    lines: [
      {
        id: "atl-demo-jane-oct",
        lineNo: 1,
        rosterShiftId: "rs-bern-agency-done",
        agencyShiftRequestId: "asr-demo-jane-oct",
        agencyWorkerId: "aw-sp-jane",
        clientId: "bp-bern",
        locationId: "loc-glenelg-sil",
        shiftDate: "2025-10-08",
        startTime: "09:00",
        endTime: "15:00",
        hours: 6,
        vendorHourlyRate: 72.5,
        vendorCost: 435,
        notes: "",
      },
    ],
    createdBy: "Riley Shaw",
    updatedBy: "Riley Shaw",
  },
  {
    id: "at-demo-staffplus-upload",
    documentNo: "ATS-DEMO-02",
    vendorBpId: "bp-staffplus",
    periodStart: "2025-10-13",
    periodEnd: "2025-10-19",
    status: "Approved",
    totalHours: 4,
    totalVendorCost: 290,
    notes: "Demo approved timesheet for mandatory invoice document upload smoke test",
    lines: [
      {
        id: "atl-demo-upload-smoke",
        lineNo: 1,
        rosterShiftId: "rs-bern-agency-upload-smoke",
        agencyShiftRequestId: "asr-demo-upload-smoke",
        agencyWorkerId: "aw-sp-mike",
        clientId: "bp-bern",
        locationId: "loc-glenelg-sil",
        shiftDate: "2025-10-15",
        startTime: "10:00",
        endTime: "14:00",
        hours: 4,
        vendorHourlyRate: 72.5,
        vendorCost: 290,
        notes: "",
      },
    ],
    createdBy: "Riley Shaw",
    updatedBy: "Riley Shaw",
  },
];

export function emptyAgencyTimesheetLine(lineNo: number): AgencyTimesheetLine {
  return {
    id: `atl-${Date.now()}-${lineNo}`,
    lineNo,
    rosterShiftId: "",
    agencyShiftRequestId: "",
    agencyWorkerId: "",
    clientId: "",
    locationId: "",
    shiftDate: "",
    startTime: "",
    endTime: "",
    hours: 0,
    vendorHourlyRate: 0,
    vendorCost: 0,
    notes: "",
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function agencyLineVendorCost(hours: number, hourlyRate: number): number {
  return roundMoney((hours || 0) * (hourlyRate || 0));
}

export function sumAgencyTimesheetLineHours(lines: AgencyTimesheetLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + (line.hours || 0), 0));
}

export function sumAgencyTimesheetVendorCost(lines: AgencyTimesheetLine[]): number {
  return roundMoney(lines.reduce((sum, line) => sum + (line.vendorCost || 0), 0));
}

export function normalizeAgencyTimesheet(record: AgencyTimesheetRecord): AgencyTimesheetRecord {
  const lines = (record.lines ?? []).map((line, index) => ({
    ...line,
    lineNo: line.lineNo || index + 1,
    rosterShiftId: line.rosterShiftId ?? "",
    agencyShiftRequestId: line.agencyShiftRequestId ?? "",
    agencyWorkerId: line.agencyWorkerId ?? "",
    clientId: line.clientId ?? "",
    locationId: line.locationId ?? "",
    shiftDate: line.shiftDate?.slice(0, 10) ?? "",
    startTime: line.startTime?.slice(0, 5) ?? "",
    endTime: line.endTime?.slice(0, 5) ?? "",
    hours: Number.isFinite(line.hours) ? line.hours : 0,
    vendorHourlyRate: Number.isFinite(line.vendorHourlyRate) ? line.vendorHourlyRate : 0,
    vendorCost: Number.isFinite(line.vendorCost)
      ? line.vendorCost
      : agencyLineVendorCost(line.hours, line.vendorHourlyRate),
    notes: line.notes ?? "",
  }));
  const totalHours =
    record.totalHours > 0 ? record.totalHours : sumAgencyTimesheetLineHours(lines);
  const totalVendorCost =
    record.totalVendorCost > 0 ? record.totalVendorCost : sumAgencyTimesheetVendorCost(lines);
  return {
    ...record,
    documentNo: record.documentNo ?? "",
    vendorBpId: record.vendorBpId ?? "",
    periodStart: record.periodStart?.slice(0, 10) ?? "",
    periodEnd: record.periodEnd?.slice(0, 10) ?? "",
    status: record.status || "Draft",
    totalHours,
    totalVendorCost,
    notes: record.notes ?? "",
    lines,
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createAgencyTimesheet(
  partial: Partial<AgencyTimesheetRecord> & Pick<AgencyTimesheetRecord, "vendorBpId" | "periodStart" | "periodEnd">,
  existing: AgencyTimesheetRecord[]
): AgencyTimesheetRecord {
  const id =
    partial.id?.trim() ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? `ats-${crypto.randomUUID()}`
      : `ats-${Date.now()}`);
  const used = new Set(existing.map((r) => r.documentNo).filter(Boolean));
  let documentNo = partial.documentNo?.trim() || `ATS-${50000 + existing.length + 1}`;
  if (used.has(documentNo)) documentNo = `${documentNo}-${existing.length + 1}`;
  return normalizeAgencyTimesheet({
    status: "Draft",
    totalHours: 0,
    totalVendorCost: 0,
    notes: "",
    lines: [],
    ...partial,
    id,
    documentNo,
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}

export function formatAgencyTimesheetPeriod(start: string, end: string): string {
  const fmt = (iso: string) => {
    const d = new Date(`${iso.slice(0, 10)}T12:00:00`);
    return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
  };
  if (!start && !end) return "—";
  if (start === end) return fmt(start);
  return `${fmt(start)} – ${fmt(end)}`;
}
