/**
 * Maps each reference list to a System nav section for `/system/reference-data/[section]`.
 * Shared lists are edited under System → Admin (one canonical list per key).
 */

import {
  defaultReferenceData,
  referenceDataKeys,
  referenceDataMeta,
  type ReferenceDataGroup,
} from "@/lib/reference-data";

/** System nav `key` values that can own reference lists. */
export type SystemReferenceSectionKey =
  | "organisation"
  | "tasks"
  | "enquiries"
  | "clients"
  | "locations"
  | "people"
  | "workforce"
  | "incidents"
  | "services"
  | "reports"
  | "ai"
  | "integrations"
  | "admin";

export const SYSTEM_REFERENCE_SECTION_KEYS: SystemReferenceSectionKey[] = [
  "organisation",
  "tasks",
  "enquiries",
  "clients",
  "locations",
  "people",
  "workforce",
  "incidents",
  "services",
  "reports",
  "ai",
  "integrations",
  "admin",
];

/** Lists used in more than one module — maintained under Admin reference data. */
export const SHARED_REFERENCE_DATA_KEYS = [
  "yesNo",
  "showAsAlert",
  "gender",
  "fundingBody",
  "disability",
  "addressType",
  "australianState",
  "country",
  "primaryLanguage",
  "contactRelationship",
] as const;

export type SharedReferenceDataKey = (typeof SHARED_REFERENCE_DATA_KEYS)[number];

/**
 * Canonical System section per reference list key.
 * When adding a list in `reference-data.ts`, assign it here.
 */
export const REFERENCE_DATA_SYSTEM_SECTION: Record<string, SystemReferenceSectionKey> = {
  // Admin — shared / cross-cutting
  yesNo: "admin",
  showAsAlert: "admin",
  gender: "admin",
  fundingBody: "admin",
  disability: "admin",
  addressType: "admin",
  australianState: "admin",
  country: "admin",
  primaryLanguage: "admin",
  contactRelationship: "admin",

  // Enquiries
  enquiryStatus: "enquiries",
  enquiryLossReason: "enquiries",
  enquiryPlanStatus: "enquiries",
  enquiryPlanManagement: "enquiries",
  enquiryUrgency: "enquiries",
  enquirySource: "enquiries",
  isEnquiryForSelf: "enquiries",
  thirdPartyConsent: "enquiries",
  relationshipType: "enquiries",
  preferredCommunicationMethod: "enquiries",
  enquiryQuery: "enquiries",

  // Clients
  clientStatus: "clients",
  clientLifecycleStatus: "clients",
  lifecycleExitReason: "clients",
  ndisSupportBudget: "clients",
  ndisSupportCategory: "clients",
  decisionMaking: "clients",
  livingArrangement: "clients",
  salesRepresentative: "clients",
  aboriginalTorresStraitIslander: "clients",
  culturalAffiliation: "clients",
  businessPartnerGroup: "clients",
  lgbtiqa: "clients",
  alertType: "clients",
  restrictivePracticeType: "clients",
  consentType: "clients",
  consentStatus: "clients",
  riskType: "clients",
  bpAssociationType: "clients",
  planManagementType: "clients",
  invoiceDeliveryMethod: "clients",
  statementDeliveryMethod: "clients",
  contactActivityType: "clients",
  needRuleCategory: "clients",
  activityType: "clients",
  financialArrangement: "clients",
  goalNumber: "clients",
  goalTerm: "clients",
  goalType: "clients",
  documentType: "clients",
  planType: "clients",
  documentStatus: "clients",
  assessmentType: "clients",
  progressReviewType: "clients",
  goalProgress: "clients",
  ndisGoalCategory: "clients",
  riskLikelihood: "clients",
  riskConsequence: "clients",
  healthPlanType: "clients",
  supportRequirementArea: "clients",
  supportAssistanceLevel: "clients",
  supportFrequency: "clients",

  // Locations
  locationType: "locations",
  locationStatus: "locations",
  locationClientRole: "locations",
  locationEmployeeRole: "locations",
  locationAlertType: "locations",
  locationActivityType: "locations",

  // People
  employeeAlertType: "people",
  employeeSkillType: "people",
  skillProficiency: "people",
  employeeDocumentType: "people",
  employeeActivityType: "people",
  employeeDocumentStatus: "people",
  emergencyContactType: "people",
  employmentType: "people",
  contractedHoursPeriod: "people",
  schadsClassificationLevel: "people",
  payMethod: "people",
  credentialType: "people",
  credentialStatus: "people",
  department: "people",
  employmentStatus: "people",
  businessPartnerType: "people",
  businessPartnerStatus: "people",
  paymentTerms: "people",

  // Tasks
  taskPriority: "tasks",

  // Workforce planning
  leaveType: "workforce",
  employeeLeaveStatus: "workforce",

  // Incident reports
  partyType: "incidents",
  partyRole: "incidents",
  incidentActionType: "incidents",
  notificationTarget: "incidents",
  notificationMethod: "incidents",
  incidentStatus: "incidents",
  incidentSeverity: "incidents",
  ndisReportableType: "incidents",
  incidentCategory: "incidents",
  incidentServiceType: "incidents",

  // Services
  productCategory: "services",
  uom: "services",
  productType: "services",
  serviceAgreementTerm: "services",
  serviceAgreementStatus: "services",
  fundingType: "services",
  fundingManagementType: "services",
  budgetRules: "services",
  registrationGroup: "services",
  claimType: "services",
  bookingCancellationReason: "services",
  bookingCancellationInitiatedBy: "services",
  contractType: "services",
  contractTerm: "services",
  auditAction: "services",
};

function assertReferenceDataSectionCoverage() {
  const metaKeys = referenceDataKeys();
  const catalogKeys = Object.keys(defaultReferenceData);
  const allKeys = [...new Set([...metaKeys, ...catalogKeys])];

  const missing: string[] = [];
  for (const key of allKeys) {
    if (!REFERENCE_DATA_SYSTEM_SECTION[key]) missing.push(key);
  }
  if (missing.length > 0) {
    throw new Error(
      `Reference data keys missing System section mapping: ${missing.join(", ")}. Update REFERENCE_DATA_SYSTEM_SECTION in reference-data-sections.ts.`
    );
  }

  const unknownSections = new Set(
    Object.values(REFERENCE_DATA_SYSTEM_SECTION).filter(
      (s) => !SYSTEM_REFERENCE_SECTION_KEYS.includes(s)
    )
  );
  if (unknownSections.size > 0) {
    throw new Error(`Unknown System reference sections: ${[...unknownSections].join(", ")}`);
  }
}

assertReferenceDataSectionCoverage();

export function isSystemReferenceSectionKey(value: string): value is SystemReferenceSectionKey {
  return SYSTEM_REFERENCE_SECTION_KEYS.includes(value as SystemReferenceSectionKey);
}

export function referenceDataSectionForKey(key: string): SystemReferenceSectionKey {
  return REFERENCE_DATA_SYSTEM_SECTION[key] ?? "admin";
}

export function referenceDataKeysForSection(sectionKey: SystemReferenceSectionKey): string[] {
  return referenceDataKeys().filter((key) => referenceDataSectionForKey(key) === sectionKey);
}

export function referenceDataKeysByGroupForSection(
  sectionKey: SystemReferenceSectionKey
): Map<ReferenceDataGroup, string[]> {
  const groups = new Map<ReferenceDataGroup, string[]>();
  for (const key of referenceDataKeysForSection(sectionKey)) {
    const group = referenceDataMeta[key].group;
    const list = groups.get(group) ?? [];
    list.push(key);
    groups.set(group, list);
  }
  return groups;
}

export function isSharedReferenceDataKey(key: string): key is SharedReferenceDataKey {
  return (SHARED_REFERENCE_DATA_KEYS as readonly string[]).includes(key);
}
