/** NDIS participant invoice — plan-managed and self-managed billing. */
export type InvoiceLine = {
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
  lineDescription: string;
  validationStatus: string;
  validationMessage: string;
};

export type InvoiceRecord = {
  id: string;
  documentNo: string;
  clientId: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  planManagementType: string;
  totalAmount: number;
  invoiceTo: string;
  invoiceToEmail: string;
  dueDate: string;
  sentAt: string;
  paymentStatus: string;
  paidAmount: number;
  paymentReference: string;
  notes: string;
  lines: InvoiceLine[];
  createdBy: string;
  updatedBy: string;
};

export const invoiceDropdowns = {
  status: ["Draft", "Sent", "Paid", "Void"],
  planManagementType: ["Plan managed", "Self managed"],
  paymentStatus: ["Unpaid", "Partial", "Paid"],
  validationStatus: ["pass", "warning", "error"],
};

export const initialInvoices: InvoiceRecord[] = [];

export function emptyInvoiceLine(lineNo: number): InvoiceLine {
  return {
    id: `inl-${Date.now()}-${lineNo}`,
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
    lineDescription: "",
    validationStatus: "pass",
    validationMessage: "",
  };
}

export function sumInvoiceLineAmount(lines: InvoiceLine[]): number {
  return Math.round(lines.reduce((sum, line) => sum + (line.lineAmount || 0), 0) * 100) / 100;
}

export function normalizeInvoice(record: InvoiceRecord): InvoiceRecord {
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
    lineDescription: line.lineDescription ?? "",
    validationStatus: line.validationStatus || "pass",
    validationMessage: line.validationMessage ?? "",
  }));
  const totalAmount =
    record.totalAmount > 0 ? record.totalAmount : sumInvoiceLineAmount(lines);
  return {
    ...record,
    documentNo: record.documentNo ?? "",
    clientId: record.clientId ?? "",
    periodStart: record.periodStart?.slice(0, 10) ?? "",
    periodEnd: record.periodEnd?.slice(0, 10) ?? "",
    status: record.status || "Draft",
    planManagementType: record.planManagementType || "Plan managed",
    totalAmount,
    invoiceTo: record.invoiceTo ?? "",
    invoiceToEmail: record.invoiceToEmail ?? "",
    dueDate: record.dueDate?.slice(0, 10) ?? "",
    sentAt: record.sentAt ?? "",
    paymentStatus: record.paymentStatus || "Unpaid",
    paidAmount: Number.isFinite(record.paidAmount) ? record.paidAmount : 0,
    paymentReference: record.paymentReference ?? "",
    notes: record.notes ?? "",
    lines,
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createInvoice(
  partial: Partial<InvoiceRecord>,
  existing: InvoiceRecord[]
): InvoiceRecord {
  const id =
    partial.id?.trim() ||
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? `inv-${crypto.randomUUID()}`
      : `inv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);
  const used = new Set(existing.map((r) => r.documentNo).filter(Boolean));
  let documentNo = partial.documentNo?.trim() || `INV-${70000 + existing.length + 1}`;
  if (used.has(documentNo)) documentNo = `${documentNo}-${existing.length + 1}`;
  return normalizeInvoice({
    clientId: "",
    periodStart: "",
    periodEnd: "",
    status: "Draft",
    planManagementType: "Plan managed",
    totalAmount: 0,
    invoiceTo: "",
    invoiceToEmail: "",
    dueDate: "",
    sentAt: "",
    paymentStatus: "Unpaid",
    paidAmount: 0,
    paymentReference: "",
    notes: "",
    lines: [],
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    ...partial,
    id,
    documentNo,
  });
}

export function formatInvoicePeriod(record: Pick<InvoiceRecord, "periodStart" | "periodEnd">): string {
  if (!record.periodStart && !record.periodEnd) return "—";
  if (record.periodStart === record.periodEnd) return record.periodStart;
  return `${record.periodStart} – ${record.periodEnd}`;
}

export function invoiceRecordIsLocked(record: InvoiceRecord | undefined): boolean {
  if (!record) return false;
  return record.status === "Sent" || record.status === "Paid" || record.status === "Void";
}
