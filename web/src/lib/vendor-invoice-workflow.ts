import { normalizeAgencyShiftRequest, type AgencyShiftRequestRecord } from "@/lib/agency-shift-request";
import type { AgencyTimesheetRecord } from "@/lib/agency-timesheet";
import { normalizeVendorInvoice, type VendorInvoiceRecord } from "@/lib/vendor-invoice";

export function approveVendorInvoice(input: {
  invoice: VendorInvoiceRecord;
  timesheet: AgencyTimesheetRecord;
  agencyShiftRequests: AgencyShiftRequestRecord[];
  actor: string;
  now?: string;
}): {
  invoice: VendorInvoiceRecord;
  timesheet: AgencyTimesheetRecord;
  agencyShiftRequests: AgencyShiftRequestRecord[];
} {
  const now = input.now ?? new Date().toISOString();
  const invoice = normalizeVendorInvoice({
    ...input.invoice,
    status: "Approved",
    approvedAt: now,
    updatedBy: input.actor,
  });

  const shiftRequestIds = new Set(
    input.timesheet.lines.map((line) => line.agencyShiftRequestId).filter(Boolean)
  );
  const agencyShiftRequests = input.agencyShiftRequests.map((request) => {
    if (!shiftRequestIds.has(request.id)) return request;
    return normalizeAgencyShiftRequest({
      ...request,
      vendorInvoiceRef: invoice.documentNo,
      vendorInvoiceStatus: "Approved",
      updatedBy: input.actor,
    });
  });

  return { invoice, timesheet: input.timesheet, agencyShiftRequests };
}

export function markVendorInvoicePaid(input: {
  invoice: VendorInvoiceRecord;
  agencyShiftRequests: AgencyShiftRequestRecord[];
  actor: string;
  now?: string;
}): { invoice: VendorInvoiceRecord; agencyShiftRequests: AgencyShiftRequestRecord[] } {
  const now = input.now ?? new Date().toISOString();
  const invoice = normalizeVendorInvoice({
    ...input.invoice,
    status: "Paid",
    paidAt: now,
    updatedBy: input.actor,
  });

  const agencyShiftRequests = input.agencyShiftRequests.map((request) => {
    if (request.vendorInvoiceRef !== invoice.documentNo) return request;
    return normalizeAgencyShiftRequest({
      ...request,
      vendorInvoiceStatus: "Paid",
      updatedBy: input.actor,
    });
  });

  return { invoice, agencyShiftRequests };
}
