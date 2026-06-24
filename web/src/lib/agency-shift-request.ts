/** Agency shift request — vacant shift to vendor pack to confirmed coverage. */
export type AgencyShiftRequestStatus =
  | "Draft"
  | "Sent"
  | "Worker proposed"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export type AgencyShiftRequestRecord = {
  id: string;
  documentNo: string;
  rosterShiftId: string;
  vendorBpId: string;
  agencyWorkerId: string;
  status: AgencyShiftRequestStatus;
  skillsRequired: string;
  clientAdvisedAt: string;
  sentAt: string;
  confirmedAt: string;
  completedAt: string;
  continuityNotes: string;
  vendorInvoiceRef: string;
  vendorInvoiceStatus: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

export const agencyShiftRequestDropdowns = {
  status: ["Draft", "Sent", "Worker proposed", "Confirmed", "Completed", "Cancelled"] as AgencyShiftRequestStatus[],
  vendorInvoiceStatus: ["", "Pending", "Received", "Approved", "Paid"],
};

export const initialAgencyShiftRequests: AgencyShiftRequestRecord[] = [
  {
    id: "asr-demo-jane-oct",
    documentNo: "ASR-DEMO-01",
    rosterShiftId: "rs-bern-agency-done",
    vendorBpId: "bp-staffplus",
    agencyWorkerId: "aw-sp-jane",
    status: "Completed",
    skillsRequired: "SIL, personal care",
    clientAdvisedAt: "",
    sentAt: "2025-10-05T09:00:00.000Z",
    confirmedAt: "2025-10-05T10:00:00.000Z",
    completedAt: "2025-10-08T16:00:00.000Z",
    continuityNotes: "Bernie prefers morning routine before community access.",
    vendorInvoiceRef: "",
    vendorInvoiceStatus: "",
    notes: "",
    createdBy: "Riley Shaw",
    updatedBy: "Riley Shaw",
  },
];

export function normalizeAgencyShiftRequest(record: AgencyShiftRequestRecord): AgencyShiftRequestRecord {
  return {
    ...record,
    documentNo: record.documentNo ?? "",
    rosterShiftId: record.rosterShiftId ?? "",
    vendorBpId: record.vendorBpId ?? "",
    agencyWorkerId: record.agencyWorkerId ?? "",
    status: (record.status || "Draft") as AgencyShiftRequestStatus,
    skillsRequired: record.skillsRequired ?? "",
    clientAdvisedAt: record.clientAdvisedAt ?? "",
    sentAt: record.sentAt ?? "",
    confirmedAt: record.confirmedAt ?? "",
    completedAt: record.completedAt ?? "",
    continuityNotes: record.continuityNotes ?? "",
    vendorInvoiceRef: record.vendorInvoiceRef ?? "",
    vendorInvoiceStatus: record.vendorInvoiceStatus ?? "",
    notes: record.notes ?? "",
    createdBy: record.createdBy ?? "SuperUser",
    updatedBy: record.updatedBy ?? "SuperUser",
  };
}

export function createAgencyShiftRequest(
  partial: Partial<AgencyShiftRequestRecord> & Pick<AgencyShiftRequestRecord, "rosterShiftId" | "vendorBpId">,
  existing: AgencyShiftRequestRecord[]
): AgencyShiftRequestRecord {
  const id = partial.id?.trim() || `asr-${Date.now()}`;
  const seq = existing.length + 1;
  const documentNo = partial.documentNo?.trim() || `ASR-${String(seq).padStart(4, "0")}`;
  return normalizeAgencyShiftRequest({
    id,
    documentNo,
    agencyWorkerId: "",
    status: "Draft",
    skillsRequired: "",
    clientAdvisedAt: "",
    sentAt: "",
    confirmedAt: "",
    completedAt: "",
    continuityNotes: "",
    vendorInvoiceRef: "",
    vendorInvoiceStatus: "",
    notes: "",
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
    ...partial,
    rosterShiftId: partial.rosterShiftId,
    vendorBpId: partial.vendorBpId,
  });
}

export function agencyShiftRequestLabel(status: AgencyShiftRequestStatus): string {
  return status;
}

export function openAgencyRequestForShift(
  requests: AgencyShiftRequestRecord[],
  rosterShiftId: string
): AgencyShiftRequestRecord | undefined {
  return requests.find(
    (r) =>
      r.rosterShiftId === rosterShiftId &&
      r.status !== "Completed" &&
      r.status !== "Cancelled"
  );
}
