import {
  CORE_CONSENT_TYPES,
  currentConsentForType,
  normalizeConsentStatus,
  normalizeConsentType,
} from "@/lib/client-consent";

export type LineColumnType = "text" | "date" | "select" | "textarea" | "number" | "checkbox";

export type LineColumnDef<TRow extends { id: string }> = {
  key: keyof TRow & string;
  label: string;
  type: LineColumnType;
  optionsKey?: string;
  required?: boolean;
  className?: string;
};

export type ClientAlertRow = {
  id: string;
  lineNo: number;
  alertType: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
};

export type ClientActivityRow = {
  id: string;
  lineNo: number;
  date: string;
  activityType: string;
  subject: string;
  description: string;
  createdBy: string;
};

export type ClientRestrictivePracticeRow = {
  id: string;
  lineNo: number;
  practiceType: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
};

export type ClientConsentRow = {
  id: string;
  lineNo: number;
  consentType: string;
  consentStatus: string;
  showAsAlert: string;
  name: string;
  description: string;
  validFrom: string;
  validTo: string;
};

export type ClientRiskRow = {
  id: string;
  lineNo: number;
  riskType: string;
  showAsAlert: string;
  name: string;
  description: string;
  likelihood: string;
  consequence: string;
  controls: string;
  emergencyResponse: string;
  escalationProcess: string;
  reviewDate: string;
  validFrom: string;
  validTo: string;
};

export type ClientBpAssociationRow = {
  id: string;
  lineNo: number;
  partnerId: string;
  associatedBpName: string;
  associationType: string;
  relationship: string;
  phone: string;
  mobile: string;
  email: string;
  primaryContact: string;
  validFrom: string;
  validTo: string;
  notes: string;
};

export type ClientContactActivityRow = {
  id: string;
  lineNo: number;
  date: string;
  activityType: string;
  contactName: string;
  subject: string;
  description: string;
  createdBy: string;
};

export type ClientNeedRuleRow = {
  id: string;
  lineNo: number;
  category: string;
  name: string;
  ruleText: string;
  showAsAlert: string;
  validFrom: string;
  validTo: string;
};

export type ClientPlanBudgetRow = {
  id: string;
  lineNo: number;
  planProvider?: string;
  supportBudget: string;
  supportCategory: string;
  description: string;
  ndisLineItemRef: string;
  allocatedAmount: number;
  claimedAmount: number;
};

export type ClientLocationRow = {
  id: string;
  lineNo: number;
  name: string;
  addressType: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  postToAddress: string;
  invoiceAddress: string;
  shipToAddress: string;
  serviceDeliveryAddress: string;
  active: string;
  validFrom: string;
  validTo: string;
  accessNotes: string;
  description: string;
};

export type ClientLineCollectionKey =
  | "alerts"
  | "activity"
  | "locations"
  | "restrictivePractices"
  | "consents"
  | "risks"
  | "bpAssociations"
  | "contactActivity"
  | "needsAndRules"
  | "planBudgets";

import type { LineDeletePolicy } from "@/lib/activity-line-policy";

export type LineItemLayout = "table" | "list-drawer";

export type ClientTabTableConfig<TRow extends { id: string }> = {
  collectionKey: ClientLineCollectionKey;
  columns: LineColumnDef<TRow>[];
  emptyRow: (lineNo: number) => TRow;
  addLabel?: string;
  emptyMessage?: string;
  /** Summary list + side drawer (default for client line tabs). Parent record save unchanged. */
  layout?: LineItemLayout;
  /** Summary columns for list-drawer layout (full columns stay in the drawer). */
  listColumnKeys?: (keyof TRow & string)[];
  drawerTitle?: string;
  /** When `admin-only`, only administrators can remove lines; others request deletion. */
  deletePolicy?: LineDeletePolicy;
};

let lineId = 0;
export function newLineId(prefix: string) {
  lineId += 1;
  return `${prefix}-${Date.now()}-${lineId}`;
}

export const alertTableConfig: ClientTabTableConfig<ClientAlertRow> = {
  collectionKey: "alerts",
  addLabel: "Add alert",
  emptyMessage: "No alerts yet. Add one to flag risks or incidents for this client.",
  layout: "list-drawer",
  drawerTitle: "Alert",
  listColumnKeys: ["alertType", "name", "showAsAlert", "validFrom"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "alertType", label: "Alert type", type: "select", optionsKey: "alertType", required: true },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("alert"),
    lineNo,
    alertType: "",
    showAsAlert: "No",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const activityTableConfig: ClientTabTableConfig<ClientActivityRow> = {
  collectionKey: "activity",
  addLabel: "Add activity",
  emptyMessage: "No activity logged yet. Record calls, visits, and notes here.",
  layout: "list-drawer",
  drawerTitle: "Activity",
  listColumnKeys: ["date", "activityType", "subject", "createdBy"],
  deletePolicy: "admin-only",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "activityType", label: "Type", type: "select", optionsKey: "activityType" },
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "createdBy", label: "Created by", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("activity"),
    lineNo,
    date: new Date().toISOString().slice(0, 10),
    activityType: "Note",
    subject: "",
    description: "",
    createdBy: "SuperUser",
  }),
};

export const restrictivePracticeTableConfig: ClientTabTableConfig<ClientRestrictivePracticeRow> = {
  collectionKey: "restrictivePractices",
  addLabel: "Add restrictive practice",
  emptyMessage:
    "No restrictive practices recorded. Document any regulated restrictive practices authorised for this support receiver.",
  layout: "list-drawer",
  drawerTitle: "Restrictive practice",
  listColumnKeys: ["practiceType", "name", "showAsAlert", "validFrom"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    {
      key: "practiceType",
      label: "Practice type",
      type: "select",
      optionsKey: "restrictivePracticeType",
      required: true,
    },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("rp"),
    lineNo,
    practiceType: "",
    showAsAlert: "Yes",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const consentTableConfig: ClientTabTableConfig<ClientConsentRow> = {
  collectionKey: "consents",
  addLabel: "Add consent or legal order",
  emptyMessage:
    "No consents or legal orders recorded. Add photo consent, information sharing agreements, guardianship orders, and similar items here.",
  layout: "list-drawer",
  drawerTitle: "Consent",
  listColumnKeys: ["consentType", "consentStatus", "name", "validFrom"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "consentType", label: "Consent type", type: "select", optionsKey: "consentType", required: true },
    { key: "consentStatus", label: "Status", type: "select", optionsKey: "consentStatus", required: true },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("consent"),
    lineNo,
    consentType: "",
    consentStatus: "Pending",
    showAsAlert: "Yes",
    name: "",
    description: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const riskTableConfig: ClientTabTableConfig<ClientRiskRow> = {
  collectionKey: "risks",
  addLabel: "Add risk",
  emptyMessage: "No risks recorded. Document hazards and risk controls separate from general alerts.",
  layout: "list-drawer",
  drawerTitle: "Risk",
  listColumnKeys: ["riskType", "name", "likelihood", "consequence"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "riskType", label: "Risk type", type: "select", optionsKey: "riskType", required: true },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "likelihood", label: "Likelihood", type: "select", optionsKey: "riskLikelihood" },
    { key: "consequence", label: "Consequence", type: "select", optionsKey: "riskConsequence" },
    { key: "controls", label: "Controls", type: "textarea", className: "min-w-[180px]" },
    { key: "emergencyResponse", label: "Emergency response", type: "textarea", className: "min-w-[160px]" },
    { key: "escalationProcess", label: "Escalation process", type: "textarea", className: "min-w-[160px]" },
    { key: "reviewDate", label: "Review date", type: "date" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("risk"),
    lineNo,
    riskType: "",
    showAsAlert: "Yes",
    name: "",
    description: "",
    likelihood: "",
    consequence: "",
    controls: "",
    emergencyResponse: "",
    escalationProcess: "",
    reviewDate: "",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const bpAssociationTableConfig: ClientTabTableConfig<ClientBpAssociationRow> = {
  collectionKey: "bpAssociations",
  addLabel: "Add association",
  emptyMessage: "No business partner associations. Link guardians, referrers, and other contacts here.",
  layout: "list-drawer",
  drawerTitle: "Association",
  listColumnKeys: ["associatedBpName", "associationType", "relationship", "primaryContact"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "partnerId", label: "Directory partner", type: "select", optionsKey: "businessPartnerDirectory" },
    { key: "associatedBpName", label: "Name", type: "text", required: true },
    { key: "associationType", label: "Association type", type: "select", optionsKey: "bpAssociationType", required: true },
    { key: "relationship", label: "Relationship", type: "select", optionsKey: "contactRelationship" },
    { key: "phone", label: "Phone", type: "text" },
    { key: "mobile", label: "Mobile", type: "text" },
    { key: "email", label: "Email", type: "text" },
    { key: "primaryContact", label: "Primary contact", type: "select", optionsKey: "yesNo" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
    { key: "notes", label: "Notes", type: "textarea", className: "min-w-[160px]" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("bpa"),
    lineNo,
    partnerId: "",
    associatedBpName: "",
    associationType: "",
    relationship: "",
    phone: "",
    mobile: "",
    email: "",
    primaryContact: lineNo === 1 ? "Yes" : "No",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
    notes: "",
  }),
};

export const contactActivityTableConfig: ClientTabTableConfig<ClientContactActivityRow> = {
  collectionKey: "contactActivity",
  addLabel: "Add contact activity",
  emptyMessage: "No contact activity logged. Record outreach linked to guardians, family, or other contacts.",
  layout: "list-drawer",
  drawerTitle: "Contact activity",
  listColumnKeys: ["date", "activityType", "contactName", "subject"],
  deletePolicy: "admin-only",
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "date", label: "Date", type: "date", required: true },
    { key: "activityType", label: "Type", type: "select", optionsKey: "contactActivityType" },
    { key: "contactName", label: "Contact", type: "text", required: true },
    { key: "subject", label: "Subject", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea", className: "min-w-[200px]" },
    { key: "createdBy", label: "Created by", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("cact"),
    lineNo,
    date: new Date().toISOString().slice(0, 10),
    activityType: "Phone call",
    contactName: "",
    subject: "",
    description: "",
    createdBy: "SuperUser",
  }),
};

export const needRuleTableConfig: ClientTabTableConfig<ClientNeedRuleRow> = {
  collectionKey: "needsAndRules",
  addLabel: "Add need or rule",
  emptyMessage: "No support needs or rules recorded. Document daily living rules and support requirements.",
  layout: "list-drawer",
  drawerTitle: "Need or rule",
  listColumnKeys: ["category", "name", "showAsAlert", "validFrom"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "category", label: "Category", type: "select", optionsKey: "needRuleCategory", required: true },
    { key: "name", label: "Name", type: "text", required: true },
    { key: "ruleText", label: "Rule / need", type: "textarea", className: "min-w-[200px]" },
    { key: "showAsAlert", label: "Show as alert", type: "select", optionsKey: "showAsAlert" },
    { key: "validFrom", label: "Valid from", type: "date" },
    { key: "validTo", label: "Valid to", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("need"),
    lineNo,
    category: "",
    name: "",
    ruleText: "",
    showAsAlert: "No",
    validFrom: new Date().toISOString().slice(0, 10),
    validTo: "",
  }),
};

export const planBudgetTableConfig: ClientTabTableConfig<ClientPlanBudgetRow> = {
  collectionKey: "planBudgets",
  addLabel: "Add budget line",
  emptyMessage:
    "No plan budget lines recorded. Add Core, Capacity building, and Capital categories from the participant NDIS plan.",
  layout: "list-drawer",
  drawerTitle: "Budget line",
  listColumnKeys: ["supportBudget", "supportCategory", "description", "allocatedAmount"],
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "planProvider", label: "Plan provider", type: "text" },
    { key: "supportBudget", label: "Support budget", type: "select", optionsKey: "ndisSupportBudget", required: true },
    {
      key: "supportCategory",
      label: "Support category",
      type: "select",
      optionsKey: "ndisSupportCategory",
      required: true,
    },
    { key: "description", label: "Description", type: "text" },
    { key: "ndisLineItemRef", label: "NDIS line item", type: "text" },
    { key: "allocatedAmount", label: "Allocated ($)", type: "number", required: true },
    { key: "claimedAmount", label: "Claimed ($)", type: "number" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("budget"),
    lineNo,
    planProvider: "This organisation",
    supportBudget: "",
    supportCategory: "",
    description: "",
    ndisLineItemRef: "",
    allocatedAmount: 0,
    claimedAmount: 0,
  }),
};

export const clientTabTableConfigs = {
  Alerts: alertTableConfig,
  Activity: activityTableConfig,
  "Plan budget": planBudgetTableConfig,
  "Restrictive Practices": restrictivePracticeTableConfig,
  "Consents and Legal Orders": consentTableConfig,
  Risks: riskTableConfig,
  "BP Associations": bpAssociationTableConfig,
  "Contact Activity": contactActivityTableConfig,
  "Support Receiver Needs and Rules": needRuleTableConfig,
} as const;

export function formatLocationAddress(loc: Pick<ClientLocationRow, "address1" | "address2" | "address3" | "city" | "state" | "postcode" | "country">) {
  const line = [loc.address1, loc.address2, loc.address3].filter(Boolean).join(", ");
  const locality = [loc.city, loc.state, loc.postcode].filter(Boolean).join(" ");
  return [line, locality, loc.country].filter(Boolean).join(" · ") || "—";
}

export function locationFlags(loc: ClientLocationRow) {
  const flags: string[] = [];
  if (loc.postToAddress === "Yes") flags.push("Post to");
  if (loc.invoiceAddress === "Yes") flags.push("Invoice");
  if (loc.shipToAddress === "Yes") flags.push("Ship to");
  if (loc.serviceDeliveryAddress === "Yes") flags.push("Service delivery");
  return flags;
}

export const emptyLocationRow = (lineNo: number): ClientLocationRow => ({
  id: newLineId("loc"),
  lineNo,
  name: "",
  addressType: "Home",
  address1: "",
  address2: "",
  address3: "",
  city: "",
  state: "SA",
  postcode: "",
  country: "Australia",
  phone: "",
  mobile: "",
  email: "",
  postToAddress: "No",
  invoiceAddress: "No",
  shipToAddress: "No",
  serviceDeliveryAddress: "No",
  active: "Yes",
  validFrom: new Date().toISOString().slice(0, 10),
  validTo: "",
  accessNotes: "",
  description: "",
});

export type ClientTabWithTable = keyof typeof clientTabTableConfigs;

export function renumberLines<TRow extends { id: string; lineNo: number }>(rows: TRow[]): TRow[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

export function buildConsentAlertList(consents: ClientConsentRow[]): string {
  const parts: string[] = [];

  for (const type of CORE_CONSENT_TYPES) {
    const row = currentConsentForType(consents, type);
    if (!row) {
      parts.push(`Consent-${type} missing`);
      continue;
    }
    const status = normalizeConsentStatus(row.consentStatus);
    if (status === "Refused" || status === "Pending" || status === "Expired") {
      parts.push(`Consent-${row.name.trim() || type} (${status})`);
    }
  }

  for (const c of consents) {
    if (c.showAsAlert !== "Yes") continue;
    const label = c.name.trim() || normalizeConsentType(c.consentType);
    if (!label) continue;
    const entry = `Consent-${label}`;
    if (!parts.includes(entry)) parts.push(entry);
  }

  return parts.join("; ");
}

export function buildRiskAlertsSummary(risks: ClientRiskRow[]): string {
  return risks
    .filter((r) => r.showAsAlert === "Yes" && (r.name.trim() || r.riskType.trim()))
    .map((r) => r.name.trim() || r.riskType)
    .join("; ");
}

export function transferActivitiesToClient(
  sourceActivities: ClientActivityRow[],
  existingClientActivities: ClientActivityRow[] = []
): ClientActivityRow[] {
  if (!sourceActivities.length) return existingClientActivities;
  const transferred = sourceActivities.map((row, index) => ({
    ...row,
    id: newLineId("activity"),
    lineNo: existingClientActivities.length + index + 1,
  }));
  return renumberLines([...existingClientActivities, ...transferred]);
}
