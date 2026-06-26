import type { SharedReferenceDataKey } from "@/lib/system/reference-data-sections";

/** Where a reference list appears in the workspace (module + page/tab). */
export type ReferenceDataUsageLocation = {
  area: string;
  pages: string[];
};

/**
 * Shared lists are edited once under System → Admin → Reference data.
 * This map shows every module and tab that reads each list.
 */
export const SHARED_REFERENCE_DATA_USAGE: Record<SharedReferenceDataKey, ReferenceDataUsageLocation[]> = {
  yesNo: [
    { area: "Clients", pages: ["Support plan — Yes/No fields", "Contacts — Primary contact"] },
    { area: "Locations", pages: ["Client assignments — Primary", "Employee assignments — Primary", "Services — Active"] },
  ],
  showAsAlert: [
    { area: "Clients", pages: ["Alerts", "Restrictive practices", "Consents", "Risks", "Need rules"] },
    { area: "Locations", pages: ["Alerts"] },
    { area: "People", pages: ["Alerts"] },
  ],
  gender: [
    { area: "Clients", pages: ["Full profile"] },
    { area: "People", pages: ["Profile"] },
    { area: "Enquiries", pages: ["Participant"] },
  ],
  fundingBody: [
    { area: "Clients", pages: ["Full profile"] },
    { area: "Enquiries", pages: ["Participant"] },
  ],
  disability: [
    { area: "Clients", pages: ["Full profile"] },
    { area: "Enquiries", pages: ["Support needs"] },
  ],
  addressType: [
    { area: "Clients", pages: ["Locations — Address lines"] },
    { area: "People", pages: ["Addresses"] },
  ],
  australianState: [
    { area: "Clients", pages: ["Locations — State"] },
    { area: "People", pages: ["Addresses — State"] },
    { area: "Locations", pages: ["Overview — Address"] },
  ],
  country: [
    { area: "Clients", pages: ["Locations — Country"] },
    { area: "People", pages: ["Addresses — Country"] },
    { area: "Locations", pages: ["Overview — Address"] },
  ],
  primaryLanguage: [
    { area: "Clients", pages: ["Support plan — Primary / preferred language"] },
  ],
  contactRelationship: [
    { area: "Clients", pages: ["Contacts — Relationship"] },
    { area: "People", pages: ["Emergency contacts — Relationship"] },
  ],
};

/** Module-specific lists — one System section owns each key. */
export const MODULE_REFERENCE_DATA_USAGE: Record<string, ReferenceDataUsageLocation[]> = {
  enquiryStatus: [{ area: "Enquiries", pages: ["Overview — Status", "List filters"] }],
  enquiryLossReason: [{ area: "Enquiries", pages: ["Overview — Loss reason (lost enquiries)"] }],
  enquiryPlanStatus: [{ area: "Enquiries", pages: ["Qualification — Plan status"] }],
  enquiryPlanManagement: [{ area: "Enquiries", pages: ["Qualification — Plan management"] }],
  enquiryUrgency: [{ area: "Enquiries", pages: ["Qualification — Urgency"] }],
  enquirySource: [{ area: "Enquiries", pages: ["Overview — Source"] }],
  isEnquiryForSelf: [{ area: "Enquiries", pages: ["Participant — Enquiry for self"] }],
  thirdPartyConsent: [{ area: "Enquiries", pages: ["Participant — Third party consent"] }],
  relationshipType: [{ area: "Enquiries", pages: ["Contacts — Relationship type"] }],
  preferredCommunicationMethod: [{ area: "Enquiries", pages: ["Participant — Preferred communication"] }],
  enquiryQuery: [{ area: "Enquiries", pages: ["List — Saved queries"] }],
  clientStatus: [{ area: "Clients", pages: ["Overview — Status", "List filters"] }],
  decisionMaking: [{ area: "Clients", pages: ["Full profile — Decision making"] }],
  livingArrangement: [{ area: "Clients", pages: ["Full profile — Living arrangement"] }],
  alertType: [{ area: "Clients", pages: ["Alerts tab — Type"] }],
  restrictivePracticeType: [{ area: "Clients", pages: ["Restrictive practices — Type"] }],
  consentType: [{ area: "Clients", pages: ["Consents — Type"] }],
  riskType: [{ area: "Clients", pages: ["Risks — Type"] }],
  activityType: [{ area: "Clients", pages: ["Activities — Type"] }],
  financialArrangement: [{ area: "Clients", pages: ["Support plan — Financial arrangement"] }],
  goalType: [{ area: "Clients", pages: ["Support plan — Goals"] }],
  documentType: [{ area: "Clients", pages: ["Plan documents — Type"] }],
  planType: [{ area: "Clients", pages: ["Support plan — Plan type"] }],
  locationType: [{ area: "Locations", pages: ["Overview — Type"] }],
  locationStatus: [{ area: "Locations", pages: ["Overview — Status"] }],
  locationAlertType: [{ area: "Locations", pages: ["Alerts — Type"] }],
  employeeAlertType: [{ area: "People", pages: ["Alerts — Type"] }],
  credentialType: [{ area: "People", pages: ["Credentials — Type"] }],
  credentialStatus: [{ area: "People", pages: ["Credentials — Status"] }],
  employmentType: [{ area: "People", pages: ["Employment — Type"] }],
  employmentStatus: [{ area: "People", pages: ["Employment — Status"] }],
  department: [{ area: "People", pages: ["Employment — Department"] }],
  leaveType: [{ area: "Workforce planning", pages: ["Leave calendar — Leave type"] }],
  employeeLeaveStatus: [{ area: "Workforce planning", pages: ["Leave requests — Status"] }],
  taskPriority: [{ area: "Tasks", pages: ["New task — Priority", "Task automations — Priority"] }],
  incidentStatus: [{ area: "Incidents", pages: ["Overview — Status", "Dashboard filters"] }],
  incidentSeverity: [{ area: "Incidents", pages: ["Overview — Severity"] }],
  partyType: [{ area: "Incidents", pages: ["Parties — Party type"] }],
  partyRole: [{ area: "Incidents", pages: ["Parties — Role"] }],
  incidentActionType: [{ area: "Incidents", pages: ["Actions — Type"] }],
  ndisReportableType: [{ area: "Incidents", pages: ["NDIS — Reportable type"] }],
  productCategory: [{ area: "Services", pages: ["Products — Category"] }],
  productType: [{ area: "Services", pages: ["Products — Type"] }],
  serviceAgreementStatus: [{ area: "Services", pages: ["Service agreements — Status"] }],
  contractType: [{ area: "Services", pages: ["Contracts — Type"] }],
};

export function sharedReferenceDataUsage(key: string): ReferenceDataUsageLocation[] | null {
  if (!(key in SHARED_REFERENCE_DATA_USAGE)) return null;
  return SHARED_REFERENCE_DATA_USAGE[key as SharedReferenceDataKey];
}

export function referenceDataUsage(key: string): ReferenceDataUsageLocation[] | null {
  return MODULE_REFERENCE_DATA_USAGE[key] ?? null;
}

export function formatSharedReferenceDataUsage(key: string): string[] {
  const usage = sharedReferenceDataUsage(key);
  if (!usage?.length) return [];
  return usage.flatMap(({ area, pages }) => pages.map((page) => `${area} — ${page}`));
}

export function formatReferenceDataUsage(key: string): string[] {
  const shared = formatSharedReferenceDataUsage(key);
  if (shared.length) return shared;
  const usage = referenceDataUsage(key);
  if (!usage?.length) return [];
  return usage.flatMap(({ area, pages }) => pages.map((page) => `${area} — ${page}`));
}
