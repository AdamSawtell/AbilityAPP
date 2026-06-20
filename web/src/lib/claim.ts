/** NDIS claim batch — header plus lines generated from approved timesheets. */
export type ClaimLine = {
  id: string;
  lineNo: number;
  timesheetId: string;
  timesheetLineId: string;
  rosterShiftId: string;
  clientId: string;
  employeeId: string;
  serviceBookingId: string;
  productId: string;
  ndisSupportItem: string;
  supportCategory: string;
  serviceDate: string;
  quantity: number;
  unitPrice: number;
  lineAmount: number;
  claimType: string;
  validationStatus: string;
  validationMessage: string;
};

export type ClaimRecord = {
  id: string;
  documentNo: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  planManagementType: string;
  totalAmount: number;
  gatewayStatus: string;
  gatewayRef: string;
  notes: string;
  lines: ClaimLine[];
  createdBy: string;
  updatedBy: string;
};

export const claimDropdowns = {
  status: ["Draft", "Submitted", "Accepted", "Rejected"],
  planManagementType: ["Agency managed", "Plan managed", "Self managed"],
  gatewayStatus: ["Not submitted", "Pending gateway", "Submitted", "Paid", "Rejected"],
  validationStatus: ["pass", "warning", "error"],
};

export const initialClaims: ClaimRecord[] = [];

export function emptyClaimLine(lineNo: number): ClaimLine {
  return {
    id: `cll-${Date.now()}-${lineNo}`,
    lineNo,
    timesheetId: "",
    timesheetLineId: "",
    rosterShiftId: "",
    clientId: "",
    employeeId: "",
    serviceBookingId: "",
    productId: "",
    ndisSupportItem: "",
    supportCategory: "",
    serviceDate: "",
    quantity: 0,
    unitPrice: 0,
    lineAmount: 0,
    claimType: "Standard",
    validationStatus: "pass",
    validationMessage: "",
  };
}

export function sumClaimLineAmount(lines: ClaimLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + (line.lineAmount || 0), 0) * 100) / 100;
}

export function normalizeClaim(record: ClaimRecord): ClaimRecord {
  const lines = (record.lines ?? []).map((line, index) => ({
    ...line,
    lineNo: line.lineNo || index + 1,
    timesheetId: line.timesheetId ?? "",
    timesheetLineId: line.timesheetLineId ?? "",
    rosterShiftId: line.rosterShiftId ?? "",
    clientId: line.clientId ?? "",
    employeeId: line.employeeId ?? "",
    serviceBookingId: line.serviceBookingId ?? "",
    productId: line.productId ?? "",
    ndisSupportItem: line.ndisSupportItem ?? "",
    supportCategory: line.supportCategory ?? "",
    serviceDate: line.serviceDate?.slice(0, 10) ?? "",
    quantity: Number.isFinite(line.quantity) ? line.quantity : 0,
    unitPrice: Number.isFinite(line.unitPrice) ? line.unitPrice : 0,
    lineAmount: Number.isFinite(line.lineAmount) ? line.lineAmount : 0,
    claimType: line.claimType || "Standard",
    validationStatus: line.validationStatus || "pass",
    validationMessage: line.validationMessage ?? "",
  }));
  const totalAmount =
    record.totalAmount > 0 ? record.totalAmount : sumClaimLineAmount(lines);
  return {
    ...record,
    documentNo: record.documentNo ?? "",
    clientId: record.clientId ?? "",
    periodStart: record.periodStart?.slice(0, 10) ?? "",
    periodEnd: record.periodEnd?.slice(0, 10) ?? "",
    status: record.status || "Draft",
    planManagementType: record.planManagementType || "Agency managed",
    totalAmount,
    gatewayStatus: record.gatewayStatus || "Not submitted",
    gatewayRef: record.gatewayRef ?? "",
    notes: record.notes ?? "",
    lines,
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createClaim(partial: Partial<ClaimRecord>, existing: ClaimRecord[]): ClaimRecord {
  const id =
    partial.id?.trim() ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? `cl-${crypto.randomUUID()}`
      : `cl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const used = new Set(existing.map((r) => r.documentNo).filter(Boolean));
  let documentNo = partial.documentNo?.trim() || `CL-${60000 + existing.length + 1}`;
  if (used.has(documentNo)) documentNo = `${documentNo}-${existing.length + 1}`;
  return normalizeClaim({
    clientId: "",
    periodStart: "",
    periodEnd: "",
    status: "Draft",
    planManagementType: "Agency managed",
    totalAmount: 0,
    gatewayStatus: "Not submitted",
    gatewayRef: "",
    notes: "",
    lines: [],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...partial,
    id,
    documentNo,
  });
}

export function formatClaimPeriod(record: Pick<ClaimRecord, "periodStart" | "periodEnd">): string {
  if (!record.periodStart && !record.periodEnd) return "—";
  if (record.periodStart === record.periodEnd) return record.periodStart;
  return `${record.periodStart} – ${record.periodEnd}`;
}
