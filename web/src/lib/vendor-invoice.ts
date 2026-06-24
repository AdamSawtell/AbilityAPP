/** Agency vendor invoice — submitted against approved agency timesheet. */
export type VendorInvoiceRecord = {
  id: string;
  documentNo: string;
  vendorBpId: string;
  agencyTimesheetId: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  status: string;
  notes: string;
  documentStoragePath: string;
  documentFileName: string;
  documentMimeType: string;
  documentByteSize: number;
  submittedAt: string;
  approvedAt: string;
  paidAt: string;
  createdBy: string;
  updatedBy: string;
};

export const vendorInvoiceDropdowns = {
  status: ["Submitted", "Approved", "Paid", "Rejected"],
};

export const initialVendorInvoices: VendorInvoiceRecord[] = [];

export function normalizeVendorInvoice(record: VendorInvoiceRecord): VendorInvoiceRecord {
  return {
    ...record,
    documentNo: record.documentNo ?? "",
    vendorBpId: record.vendorBpId ?? "",
    agencyTimesheetId: record.agencyTimesheetId ?? "",
    invoiceNo: record.invoiceNo ?? "",
    invoiceDate: record.invoiceDate?.slice(0, 10) ?? "",
    amount: Number.isFinite(record.amount) ? record.amount : 0,
    status: record.status || "Submitted",
    notes: record.notes ?? "",
    documentStoragePath: record.documentStoragePath ?? "",
    documentFileName: record.documentFileName ?? "",
    documentMimeType: record.documentMimeType ?? "",
    documentByteSize: Number.isFinite(record.documentByteSize) ? record.documentByteSize : 0,
    submittedAt: record.submittedAt ?? "",
    approvedAt: record.approvedAt ?? "",
    paidAt: record.paidAt ?? "",
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createVendorInvoice(
  partial: Partial<VendorInvoiceRecord> & {
    vendorBpId: string;
    agencyTimesheetId: string;
    invoiceNo: string;
    invoiceDate: string;
    amount: number;
  },
  existing: VendorInvoiceRecord[]
): VendorInvoiceRecord {
  const id = partial.id?.trim() || `vi-${Date.now()}`;
  const used = new Set(existing.map((r) => r.documentNo).filter(Boolean));
  let documentNo = partial.documentNo?.trim() || `VI-${50000 + existing.length + 1}`;
  if (used.has(documentNo)) documentNo = `${documentNo}-${existing.length + 1}`;
  return normalizeVendorInvoice({
    status: "Submitted",
    notes: "",
    documentStoragePath: "",
    documentFileName: "",
    documentMimeType: "",
    documentByteSize: 0,
    submittedAt: new Date().toISOString(),
    approvedAt: "",
    paidAt: "",
    ...partial,
    id,
    documentNo,
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}
