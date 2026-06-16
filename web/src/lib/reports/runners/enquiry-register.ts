import type { EnquiryRecord } from "@/lib/enquiry";
import type { ReportResult } from "@/lib/reports/types";

type EnquiryColumn = {
  id: string;
  label: string;
  getValue: (row: EnquiryRecord) => string;
};

export const ENQUIRY_REGISTER_COLUMNS: EnquiryColumn[] = [
  { id: "documentNo", label: "Document no.", getValue: (r) => r.documentNo },
  { id: "dateReceived", label: "Date received", getValue: (r) => r.dateReceived },
  { id: "dateNextAction", label: "Next action", getValue: (r) => r.dateNextAction },
  { id: "status", label: "Status", getValue: (r) => r.status },
  { id: "firstName", label: "First name", getValue: (r) => r.firstName },
  { id: "lastName", label: "Last name", getValue: (r) => r.lastName },
  { id: "bpName", label: "Participant name", getValue: (r) => r.bpName },
  { id: "email", label: "Email", getValue: (r) => r.email },
  { id: "phone", label: "Phone", getValue: (r) => r.phone },
  { id: "birthday", label: "Birthday", getValue: (r) => r.birthday },
  { id: "gender", label: "Gender", getValue: (r) => r.gender },
  { id: "fundingBody", label: "Funding body", getValue: (r) => r.fundingBody },
  { id: "disability", label: "Disability", getValue: (r) => r.disability },
  { id: "services", label: "Services", getValue: (r) => r.services },
  { id: "enquirySource", label: "Source", getValue: (r) => r.enquirySource },
  { id: "isEnquiryForSelf", label: "Enquiry for self", getValue: (r) => r.isEnquiryForSelf },
  { id: "thirdPartyConsent", label: "Third party consent", getValue: (r) => r.thirdPartyConsent },
  { id: "outcome", label: "Outcome", getValue: (r) => r.outcome },
  { id: "activityCount", label: "Activity count", getValue: (r) => String(r.activity.length) },
  { id: "createdBy", label: "Created by", getValue: (r) => r.createdBy },
];

export function buildEnquiryRegisterReport(enquiries: EnquiryRecord[]): ReportResult {
  const rows = [...enquiries]
    .sort((a, b) => b.dateReceived.localeCompare(a.dateReceived) || a.documentNo.localeCompare(b.documentNo))
    .map((enquiry) => {
      const flat: Record<string, string> = {};
      for (const col of ENQUIRY_REGISTER_COLUMNS) {
        flat[col.id] = col.getValue(enquiry);
      }
      return flat;
    });

  return {
    columns: ENQUIRY_REGISTER_COLUMNS.map(({ id, label }) => ({ id, label })),
    rows,
  };
}
