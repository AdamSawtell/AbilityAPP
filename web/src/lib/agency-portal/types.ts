export type AgencyPortalVendorSummary = {
  id: string;
  name: string;
  email: string;
};

export type AgencyPortalRequestItem = {
  id: string;
  documentNo: string;
  status: string;
  rosterShiftId: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftRef: string;
  locationName: string;
  clientLabel: string;
  skillsRequired: string;
  agencyWorkerId: string;
  agencyWorkerName: string;
  sentAt: string;
  vendorConfirmedAt: string;
  continuityNotes: string;
  canConfirm: boolean;
};

export type AgencyPortalTimesheetItem = {
  id: string;
  documentNo: string;
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  totalVendorCost: number;
  status: string;
  hasInvoice: boolean;
};

export type AgencyPortalInvoiceItem = {
  id: string;
  documentNo: string;
  agencyTimesheetDocumentNo: string;
  invoiceNo: string;
  invoiceDate: string;
  amount: number;
  status: string;
  submittedAt: string;
};
