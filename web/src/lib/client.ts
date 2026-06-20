import type { EnquiryRecord } from "@/lib/enquiry";
import type {
  ClientActivityRow,
  ClientAlertRow,
  ClientBpAssociationRow,
  ClientConsentRow,
  ClientContactActivityRow,
  ClientLocationRow,
  ClientNeedRuleRow,
  ClientPlanBudgetRow,
  ClientRestrictivePracticeRow,
  ClientRiskRow,
} from "@/lib/client-line-tables";
import { normalizeConsentStatus, normalizeConsentType } from "@/lib/client-consent";
import {
  buildConsentAlertList,
  buildRiskAlertsSummary,
  transferActivitiesToClient,
} from "@/lib/client-line-tables";
import { inferLifecycleFromLegacyStatus, normalizeLifecycleStatus } from "@/lib/client-lifecycle";
import { clientDropdowns } from "@/lib/reference-data";

export { clientDropdowns };

export type ClientPlanBudget = ClientPlanBudgetRow;

export type ClientAlert = ClientAlertRow;
export type ClientActivity = ClientActivityRow;

export type ClientRestrictivePractice = ClientRestrictivePracticeRow;
export type ClientConsent = ClientConsentRow;
export type ClientRisk = ClientRiskRow;
export type ClientBpAssociation = ClientBpAssociationRow;
export type ClientContactActivity = ClientContactActivityRow;
export type ClientNeedRule = ClientNeedRuleRow;

export type ClientLocation = ClientLocationRow;

export type ClientRecord = {
  id: string;
  enquiryId: string;
  searchKey: string;
  businessPartnerGroup: string;
  name: string;
  riskAlerts: string;
  consentAlertList: string;
  firstName: string;
  preferredName: string;
  lastName: string;
  middleName: string;
  email: string;
  phone: string;
  status: string;
  lifecycleStatus: string;
  planReviewDueDate: string;
  lifecycleExitReason: string;
  birthday: string;
  isEstimatedAge: boolean;
  gender: string;
  decisionMaking: string;
  lgbtiqa: string;
  livingArrangement: string;
  salesRepresentative: string;
  services: string;
  fundingBody: string;
  fundingBodyNumber: string;
  transitionedToPace: string;
  dateSupportCommencement: string;
  dateSupportCeased: string;
  aboriginalTorresStraitIslander: string;
  culturalAffiliation: string;
  disability: string;
  additionalDisabilityInformation: string;
  pictureUrl?: string;
  createdBy: string;
  updatedBy: string;
  alerts: ClientAlert[];
  activity: ClientActivity[];
  locations: ClientLocation[];
  restrictivePractices: ClientRestrictivePractice[];
  consents: ClientConsent[];
  risks: ClientRisk[];
  bpAssociations: ClientBpAssociation[];
  contactActivity: ClientContactActivity[];
  needsAndRules: ClientNeedRule[];
  planBudgets: ClientPlanBudgetRow[];
};

export const clientTabs = [
  "Overview",
  "Alerts",
  "Activity",
  "Full profile",
  "BP Associations",
  "Locations",
  "Incidents",
  "Requests",
  "Restrictive Practices",
  "Consents and Legal Orders",
  "Plan budget",
  "Monthly service plan",
  "Plan & Assessment",
  "Support Plan",
  "Goals",
  "Progress Review",
  "Contact Activity",
  "Risks",
  "Service agreements",
  "Service bookings",
  "Roster of care",
  "Support Receiver Needs and Rules",
] as const;

export const initialClients: ClientRecord[] = [
  {
    id: "bp-bern",
    enquiryId: "",
    searchKey: "Bern",
    businessPartnerGroup: "Support Receiver",
    name: "Bernadette Rose",
    riskAlerts: "Allergy to peanuts",
    consentAlertList: "Consent-No photo consent provided",
    firstName: "Bernadette",
    preferredName: "Bernie",
    lastName: "Rose",
    middleName: "",
    email: "Bernie@email",
    phone: "",
    status: "2_Active receiving support",
    lifecycleStatus: "active",
    planReviewDueDate: "2026-10-15",
    lifecycleExitReason: "",
    birthday: "1995-06-26",
    isEstimatedAge: false,
    gender: "Female",
    decisionMaking: "Makes all decisions",
    lgbtiqa: "",
    livingArrangement: "Lives with Friends/Housemates",
    salesRepresentative: "Isla Robinson",
    services: "",
    fundingBody: "NDIS - National Disability Insurance Scheme",
    fundingBodyNumber: "",
    transitionedToPace: "2024-02-14",
    dateSupportCommencement: "2021-01-05",
    dateSupportCeased: "",
    aboriginalTorresStraitIslander: "Neither",
    culturalAffiliation: "Australian",
    disability: "PD - Spinal Cord Injury",
    additionalDisabilityInformation:
      "Acquired physical disabilities as a result of car accident in 2004. Bernie lost her right leg from the knee down and has a spinal cord injury limiting movement of her left leg. She is in a wheelchair.",
    createdBy: "Isla Robinson",
    updatedBy: "SuperUser",
    alerts: [
      {
        id: "a1",
        lineNo: 1,
        alertType: "Incident",
        showAsAlert: "No",
        name: "Check with Management before contacting",
        description:
          "Seek approval or guidance from superiors or higher-level management before initiating any communication or interaction.",
        validFrom: "2022-05-01",
        validTo: "2024-09-10",
      },
    ],
    activity: [
      {
        id: "act1",
        lineNo: 1,
        date: "2024-02-14",
        activityType: "Phone call",
        subject: "PACE transition check-in",
        description: "Confirmed NDIS plan details and updated funding body number.",
        createdBy: "Isla Robinson",
      },
    ],
    locations: [
      {
        id: "loc-home",
        lineNo: 1,
        name: "Home",
        addressType: "Home",
        address1: "12 Jetty Road",
        address2: "Unit 4",
        address3: "",
        city: "Glenelg",
        state: "SA",
        postcode: "5045",
        country: "Australia",
        phone: "08 8294 1100",
        mobile: "0412 345 678",
        email: "Bernie@email",
        postToAddress: "No",
        invoiceAddress: "Yes",
        shipToAddress: "Yes",
        serviceDeliveryAddress: "Yes",
        active: "Yes",
        validFrom: "2021-01-05",
        validTo: "",
        accessNotes: "Wheelchair access via ramp at rear. Level entry to kitchen and bathroom.",
        description: "Primary residence — shared with housemates.",
      },
      {
        id: "loc-postal",
        lineNo: 2,
        name: "Postal",
        addressType: "Postal",
        address1: "PO Box 842",
        address2: "",
        address3: "",
        city: "Adelaide",
        state: "SA",
        postcode: "5000",
        country: "Australia",
        phone: "",
        mobile: "",
        email: "",
        postToAddress: "Yes",
        invoiceAddress: "No",
        shipToAddress: "No",
        serviceDeliveryAddress: "No",
        active: "Yes",
        validFrom: "2021-01-05",
        validTo: "",
        accessNotes: "",
        description: "Mail and official correspondence.",
      },
    ],
    restrictivePractices: [],
    consents: [
      {
        id: "consent-photo",
        lineNo: 1,
        consentType: "Photography and video",
        consentStatus: "Refused",
        showAsAlert: "Yes",
        name: "No photo consent provided",
        description: "Participant has not provided consent for photos or video to be taken or shared.",
        validFrom: "2021-01-05",
        validTo: "",
      },
      {
        id: "consent-bern-service",
        lineNo: 2,
        consentType: "Service delivery",
        consentStatus: "Granted",
        showAsAlert: "No",
        name: "Service delivery consent",
        description: "Participant consented to NDIS support delivery at intake.",
        validFrom: "2021-01-05",
        validTo: "",
      },
      {
        id: "consent-bern-information",
        lineNo: 3,
        consentType: "Information collection and sharing",
        consentStatus: "Granted",
        showAsAlert: "No",
        name: "Information sharing consent",
        description: "Consent to collect and share information with NDIS and plan manager.",
        validFrom: "2021-01-05",
        validTo: "",
      },
    ],
    risks: [
      {
        id: "risk-peanut",
        lineNo: 1,
        riskType: "Allergy",
        showAsAlert: "Yes",
        name: "Allergy to peanuts",
        description: "Anaphylaxis risk. EpiPen in kitchen drawer. Avoid all nut products.",
        validFrom: "2021-01-05",
        validTo: "",
      },
    ],
    bpAssociations: [
      {
        id: "bpa-harry",
        lineNo: 1,
        associatedBpName: "Harry",
        associationType: "Family / friend",
        relationship: "Friend",
        phone: "",
        mobile: "0411 222 333",
        email: "",
        primaryContact: "Yes",
        validFrom: "2021-01-05",
        validTo: "",
        notes: "Best friend. Sunday lunch contact.",
      },
    ],
    contactActivity: [
      {
        id: "cact-harry",
        lineNo: 1,
        date: "2024-02-14",
        activityType: "Phone call",
        contactName: "Harry",
        subject: "PACE transition update",
        description: "Confirmed Bernie was happy with plan changes discussed at lunch.",
        createdBy: "Isla Robinson",
      },
    ],
    needsAndRules: [
      {
        id: "need-transfer",
        lineNo: 1,
        category: "Personal care",
        name: "Shower transfer",
        ruleText: "Assist transfer to shower chair. Bernie washes independently then needs assistance back to wheelchair.",
        showAsAlert: "Yes",
        validFrom: "2022-05-01",
        validTo: "",
      },
    ],
    planBudgets: [
      {
        id: "budget-bern-core-daily",
        lineNo: 1,
        supportBudget: "Core",
        supportCategory: "Assistance with Daily Life",
        description: "Personal care and daily living supports",
        ndisLineItemRef: "01_011_0107_1_1",
        allocatedAmount: 45000,
        claimedAmount: 12800,
      },
      {
        id: "budget-bern-core-community",
        lineNo: 2,
        supportBudget: "Core",
        supportCategory: "Social and Community Participation",
        description: "Community access and social activities",
        ndisLineItemRef: "04_104_0125_6_1",
        allocatedAmount: 18000,
        claimedAmount: 4200,
      },
      {
        id: "budget-bern-cb-coord",
        lineNo: 3,
        supportBudget: "Capacity building",
        supportCategory: "Support Coordination",
        description: "Level 2 support coordination",
        ndisLineItemRef: "07_002_0106_8_3",
        allocatedAmount: 6000,
        claimedAmount: 1800,
      },
    ],
  },
];

export type ClientFieldDef = {
  key: keyof ClientRecord;
  label: string;
  type: "text" | "email" | "tel" | "date" | "textarea" | "select" | "checkbox";
  optionsKey?: string;
  readOnly?: boolean;
};

export const profileFields: ClientFieldDef[] = [
  { key: "searchKey", label: "Search key", type: "text" },
  { key: "businessPartnerGroup", label: "Business partner group", type: "select", optionsKey: "businessPartnerGroup" },
  { key: "name", label: "Name", type: "text" },
  { key: "riskAlerts", label: "Risk alerts", type: "textarea" },
  { key: "consentAlertList", label: "Consent alert list", type: "textarea" },
  { key: "firstName", label: "First name", type: "text" },
  { key: "preferredName", label: "Preferred name", type: "text" },
  { key: "lastName", label: "Last name", type: "text" },
  { key: "middleName", label: "Middle name", type: "text" },
  { key: "email", label: "Email address", type: "email" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "status", label: "Status", type: "select", optionsKey: "clientStatus" },
  { key: "lifecycleStatus", label: "Lifecycle", type: "select", optionsKey: "clientLifecycleStatus" },
  { key: "planReviewDueDate", label: "Plan review due", type: "date" },
  { key: "lifecycleExitReason", label: "Exit reason", type: "select", optionsKey: "lifecycleExitReason" },
  { key: "birthday", label: "Birthday", type: "date" },
  { key: "gender", label: "Gender", type: "select", optionsKey: "gender" },
  { key: "decisionMaking", label: "Decision making", type: "select", optionsKey: "decisionMaking" },
  { key: "lgbtiqa", label: "LGBTIQA+ (optional)", type: "select", optionsKey: "lgbtiqa" },
  { key: "livingArrangement", label: "Living arrangement", type: "select", optionsKey: "livingArrangement" },
  { key: "salesRepresentative", label: "Sales representative", type: "select", optionsKey: "salesRepresentative" },
  { key: "services", label: "Services", type: "textarea" },
  { key: "fundingBody", label: "Funding body", type: "select", optionsKey: "fundingBody" },
  { key: "fundingBodyNumber", label: "Funding body number", type: "text" },
  { key: "transitionedToPace", label: "Transitioned to PACE", type: "date" },
  { key: "dateSupportCommencement", label: "Date of support commencement", type: "date" },
  { key: "dateSupportCeased", label: "Date support ceased", type: "date" },
  {
    key: "aboriginalTorresStraitIslander",
    label: "Aboriginal/Torres Strait Islander",
    type: "select",
    optionsKey: "aboriginalTorresStraitIslander",
  },
  { key: "culturalAffiliation", label: "Cultural affiliation", type: "select", optionsKey: "culturalAffiliation" },
  { key: "disability", label: "Disability", type: "select", optionsKey: "disability" },
  { key: "additionalDisabilityInformation", label: "Additional disability information", type: "textarea" },
  { key: "createdBy", label: "Created by", type: "text", readOnly: true },
  { key: "updatedBy", label: "Updated by", type: "text", readOnly: true },
];

export type ClientFieldSection = {
  title: string;
  fields: ClientFieldDef[];
};

export const profileSections: ClientFieldSection[] = [
  {
    title: "Identity",
    fields: profileFields.filter((f) =>
      [
        "searchKey",
        "name",
        "firstName",
        "preferredName",
        "lastName",
        "middleName",
        "email",
        "phone",
        "status",
        "lifecycleStatus",
        "planReviewDueDate",
        "lifecycleExitReason",
      ].includes(f.key)
    ),
  },
  {
    title: "Support & funding",
    fields: profileFields.filter((f) =>
      [
        "fundingBody",
        "fundingBodyNumber",
        "disability",
        "additionalDisabilityInformation",
        "services",
        "salesRepresentative",
        "dateSupportCommencement",
        "dateSupportCeased",
        "transitionedToPace",
      ].includes(f.key)
    ),
  },
  {
    title: "Living & diversity",
    fields: profileFields.filter((f) =>
      [
        "birthday",
        "gender",
        "livingArrangement",
        "decisionMaking",
        "lgbtiqa",
        "aboriginalTorresStraitIslander",
        "culturalAffiliation",
      ].includes(f.key)
    ),
  },
  {
    title: "Alerts summary",
    fields: profileFields.filter((f) => ["riskAlerts", "consentAlertList"].includes(f.key)),
  },
  {
    title: "System",
    fields: profileFields.filter((f) =>
      ["businessPartnerGroup", "createdBy", "updatedBy"].includes(f.key)
    ),
  },
];

export type ClientTabGroup = {
  label: string;
  tabs: (typeof clientTabs)[number][];
};

export const coreOverviewFields: ClientFieldDef[] = profileFields.filter((f) =>
  [
    "searchKey",
    "name",
    "status",
    "lifecycleStatus",
    "email",
    "phone",
    "fundingBody",
    "disability",
    "dateSupportCommencement",
    "riskAlerts",
    "consentAlertList",
  ].includes(f.key)
);

export const clientTabGroups: ClientTabGroup[] = [
  {
    label: "Core",
    tabs: ["Overview", "Activity", "Support Plan", "Alerts", "Service agreements", "Service bookings", "Full profile"],
  },
  {
    label: "Relationships",
    tabs: ["BP Associations", "Locations", "Incidents", "Contact Activity"],
  },
  {
    label: "Care & compliance",
    tabs: ["Requests", "Restrictive Practices", "Consents and Legal Orders", "Risks"],
  },
  {
    label: "Planning",
    tabs: [
      "Plan budget",
      "Monthly service plan",
      "Roster of care",
      "Plan & Assessment",
      "Goals",
      "Progress Review",
      "Support Receiver Needs and Rules",
    ],
  },
];

/** Match a /clients/[id] route param (UUID or search key). */
export function findClientByRouteId(clients: ClientRecord[], routeId: string): ClientRecord | undefined {
  const key = decodeURIComponent(routeId.trim());
  if (!key) return undefined;
  return clients.find((c) => c.id === key || c.searchKey === key);
}

export function normalizeClient(client: ClientRecord): ClientRecord {
  const alerts = (client.alerts ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  const activity = client.activity ?? [];
  const locations = (client.locations ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  const restrictivePractices = (client.restrictivePractices ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  const consents = (client.consents ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
    consentType: normalizeConsentType(row.consentType),
    consentStatus: normalizeConsentStatus(row.consentStatus),
  }));
  const risks = (client.risks ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  const bpAssociations = (client.bpAssociations ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  const contactActivity = (client.contactActivity ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  const needsAndRules = (client.needsAndRules ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
  }));
  const planBudgets = (client.planBudgets ?? []).map((row, index) => ({
    ...row,
    lineNo: row.lineNo ?? index + 1,
    allocatedAmount: Number(row.allocatedAmount) || 0,
    claimedAmount: Number(row.claimedAmount) || 0,
  }));
  const consentAlertList = buildConsentAlertList(consents) || client.consentAlertList;
  const riskAlerts = buildRiskAlertsSummary(risks) || client.riskAlerts;
  const lifecycleStatus = client.lifecycleStatus?.trim()
    ? normalizeLifecycleStatus(client.lifecycleStatus)
    : inferLifecycleFromLegacyStatus(client.status);
  return {
    ...client,
    pictureUrl: client.pictureUrl ?? "",
    lifecycleStatus,
    planReviewDueDate: client.planReviewDueDate ?? "",
    lifecycleExitReason: client.lifecycleExitReason ?? "",
    alerts,
    activity,
    locations,
    restrictivePractices,
    consents,
    risks,
    bpAssociations,
    contactActivity,
    needsAndRules,
    planBudgets,
    consentAlertList,
    riskAlerts,
  };
}

export function makeClientSearchKey(
  firstName: string,
  lastName: string,
  existing: { searchKey: string }[]
): string {
  const base = `${firstName}${lastName}`.replace(/[^a-zA-Z]/g, "").slice(0, 8) || "client";
  let key = base.charAt(0).toUpperCase() + base.slice(1, 4).toLowerCase();
  let n = 1;
  while (existing.some((c) => c.searchKey.toLowerCase() === key.toLowerCase())) {
    key = `${base.slice(0, 3)}${n}`;
    n += 1;
  }
  return key;
}

export function emptyClientRecord(
  partial: {
    firstName: string;
    lastName: string;
    preferredName?: string;
    email?: string;
    phone?: string;
    status?: string;
    fundingBody?: string;
    disability?: string;
    services?: string;
    searchKey?: string;
  },
  createdBy: string,
  existing: { searchKey: string }[]
): ClientRecord {
  const firstName = partial.firstName.trim();
  const lastName = partial.lastName.trim();
  const searchKey = partial.searchKey?.trim() || makeClientSearchKey(firstName, lastName, existing);
  const name = `${firstName} ${lastName}`.trim();
  return normalizeClient({
    id: `bp-${searchKey.toLowerCase()}`,
    enquiryId: "",
    searchKey,
    businessPartnerGroup: "Support Receiver",
    name,
    riskAlerts: "",
    consentAlertList: "",
    firstName,
    preferredName: partial.preferredName?.trim() || firstName,
    lastName,
    middleName: "",
    email: partial.email?.trim() ?? "",
    phone: partial.phone?.trim() ?? "",
    status: partial.status?.trim() || "1_Prospect",
    lifecycleStatus: "intake",
    planReviewDueDate: "",
    lifecycleExitReason: "",
    birthday: "",
    isEstimatedAge: false,
    gender: "",
    decisionMaking: "",
    lgbtiqa: "",
    livingArrangement: "",
    salesRepresentative: "",
    services: partial.services?.trim() ?? "",
    fundingBody: partial.fundingBody?.trim() ?? "",
    fundingBodyNumber: "",
    transitionedToPace: "",
    dateSupportCommencement: new Date().toISOString().slice(0, 10),
    dateSupportCeased: "",
    aboriginalTorresStraitIslander: "",
    culturalAffiliation: "",
    disability: partial.disability?.trim() ?? "",
    additionalDisabilityInformation: "",
    pictureUrl: "",
    createdBy,
    updatedBy: createdBy,
    alerts: [],
    activity: [],
    locations: [],
    restrictivePractices: [],
    consents: [],
    risks: [],
    bpAssociations: [],
    contactActivity: [],
    needsAndRules: [],
    planBudgets: [],
  });
}

export function emptyClientFromEnquiry(enquiry: EnquiryRecord, searchKey: string): ClientRecord {
  return {
    id: `bp-${searchKey.toLowerCase()}`,
    enquiryId: enquiry.id,
    searchKey,
    businessPartnerGroup: "Support Receiver",
    name: `${enquiry.firstName} ${enquiry.lastName}`.trim(),
    riskAlerts: "",
    consentAlertList: enquiry.thirdPartyConsent ? `Consent-${enquiry.thirdPartyConsent}` : "",
    firstName: enquiry.firstName,
    preferredName: enquiry.firstName,
    lastName: enquiry.lastName,
    middleName: "",
    email: enquiry.email,
    phone: enquiry.phone,
    status: "1_Prospect",
    lifecycleStatus: "intake",
    planReviewDueDate: "",
    lifecycleExitReason: "",
    birthday: enquiry.birthday,
    isEstimatedAge: false,
    gender: enquiry.gender,
    decisionMaking: "",
    lgbtiqa: "",
    livingArrangement: "",
    salesRepresentative: "",
    services: enquiry.services,
    fundingBody: enquiry.fundingBody,
    fundingBodyNumber: "",
    transitionedToPace: "",
    dateSupportCommencement: new Date().toISOString().slice(0, 10),
    dateSupportCeased: "",
    aboriginalTorresStraitIslander: "",
    culturalAffiliation: "",
    disability: enquiry.disability,
    additionalDisabilityInformation: enquiry.additionalDisabilityInformation,
    createdBy: enquiry.createdBy || "SuperUser",
    updatedBy: "SuperUser",
    alerts: enquiry.description
      ? [
          {
            id: `alert-${enquiry.id}`,
            lineNo: 1,
            alertType: "Other",
            showAsAlert: "Yes",
            name: "Enquiry notes",
            description: enquiry.description,
            validFrom: enquiry.dateReceived,
            validTo: "",
          },
        ]
      : [],
    activity: transferActivitiesToClient(enquiry.activity ?? []),
    locations: [],
    restrictivePractices: [],
    consents: enquiry.thirdPartyConsent
      ? [
          {
            id: `consent-${enquiry.id}`,
            lineNo: 1,
            consentType: "Information collection and sharing",
            consentStatus: "Granted",
            showAsAlert: "Yes",
            name: enquiry.thirdPartyConsent,
            description: "Carried forward from enquiry third-party consent.",
            validFrom: enquiry.dateReceived,
            validTo: "",
          },
        ]
      : [],
    risks: [],
    bpAssociations: [],
    contactActivity: [],
    needsAndRules: [],
    planBudgets: [],
  };
}
