import { auditEntityLabels, type AuditEntityType } from "@/lib/audit";

const AUDIT_IGNORE_KEYS = new Set([
  "id",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "createdByUserId",
  "updatedByUserId",
  "audit",
  "updates",
]);

const FIELD_LABELS: Partial<Record<AuditEntityType, Record<string, string>>> = {
  enquiry: {
    documentNo: "Document no.",
    dateReceived: "Date received",
    dateNextAction: "Next action date",
    status: "Status",
    firstName: "First name",
    lastName: "Last name",
    fundingBody: "Funding body",
    disability: "Disability",
    services: "Services",
    isEnquiryForSelf: "Enquiry for self",
    thirdPartyConsent: "Third party consent",
    relationshipType: "Relationship",
    phone: "Phone",
    email: "Email",
    birthday: "Birthday",
    gender: "Gender",
    preferredCommunicationMethod: "Preferred communication",
    bpName: "Business partner name",
    enquirySource: "Enquiry source",
    description: "Description",
    outcome: "Outcome",
    additionalDisabilityInformation: "Additional disability information",
    other: "Other",
    activity: "Activity",
  },
  client: {
    searchKey: "Search key",
    name: "Name",
    status: "Status",
    lifecycleStatus: "Lifecycle",
    planReviewDueDate: "Plan review due",
    lifecycleExitReason: "Exit reason",
    planBudgets: "Plan budget lines",
    firstName: "First name",
    lastName: "Last name",
    email: "Email",
    phone: "Phone",
    pictureUrl: "Photo",
    disability: "Disability",
    services: "Services",
    fundingBody: "Funding body",
    alerts: "Alerts",
    activity: "Activity",
    locations: "Locations",
  },
  employee: {
    searchKey: "Search key",
    name: "Name",
    status: "Status",
    email: "Email",
    phone: "Phone",
    pictureUrl: "Photo",
    jobTitle: "Job title",
    department: "Department",
  },
  contract: {
    documentNo: "Document no.",
    name: "Name",
    contractType: "Contract type",
    startDate: "Start date",
    endDate: "End date",
    audit: "Audit lines",
  },
  product: {
    searchKey: "Search key",
    name: "Name",
    productCategory: "Category",
    active: "Active",
  },
  "price-list": {
    name: "Name",
    schemaName: "Schema",
    validFrom: "Valid from",
  },
  "service-agreement": {
    searchKey: "Search key",
    status: "Status",
    startDate: "Start date",
    endDate: "End date",
  },
  "service-booking": {
    documentNo: "Document no.",
    description: "Description",
    targetDocumentType: "Target document type",
    readyToClaimRule: "Ready to claim rule",
    dateOrdered: "Date ordered",
    datePromised: "Date promised",
    startDate: "Start date",
    endDate: "End date",
    clientId: "Business partner",
    invoicePartner: "Invoice partner",
    bookingGeneratorRef: "Booking generator",
    documentStatus: "Document status",
    grandTotal: "Grand total",
    lines: "Service booking lines",
  },
  task: {
    title: "Title",
    status: "Status",
    priority: "Priority",
    description: "Description",
  },
  organization: {
    tradingName: "Trading name",
    legalName: "Legal name",
    searchKey: "Short code",
    abn: "ABN",
    ndisRegistrationNumber: "NDIS registration number",
    ndisProviderOutcomeId: "NDIS provider outcome ID",
    email: "General email",
    phone: "General phone",
    website: "Website",
    logoUrl: "Logo URL",
    registrationGroups: "Registration groups",
    primaryContactName: "Primary contact",
    primaryContactEmail: "Primary contact email",
    primaryContactPhone: "Primary contact phone",
    address1: "Address line 1",
    city: "City",
    state: "State",
    postcode: "Postcode",
    incidentInvestigationSlaDays: "Investigation SLA (days)",
  },
  incident: {
    documentNo: "Document no.",
    title: "Title",
    status: "Status",
    severity: "Severity",
    category: "Category",
    serviceType: "Service type",
    isReportable: "NDIS reportable",
    reportableType: "Reportable type",
    restrictivePracticeCausedHarm: "Restrictive practice caused harm",
    occurredAt: "Occurred at",
    awareAt: "Aware at",
    reportedAt: "Reported date",
    reportDeadlineAt: "Report deadline",
    ndisNotifiedAt: "NDIS notified at",
    ndisNotificationRef: "NDIS notification reference",
    primaryClientId: "Primary client",
    primaryEmployeeId: "Primary employee",
    primaryLocationId: "Primary location",
    linkedRestrictivePracticeId: "Linked restrictive practice",
    managerReviewedAt: "Manager reviewed at",
    managerReviewedBy: "Manager reviewed by",
    description: "Description",
    immediateActions: "Immediate actions",
    investigationSummary: "Investigation summary",
    correctiveActions: "Corrective actions",
    lessonsLearned: "Lessons learned",
    parties: "Parties",
    actions: "Actions",
    notifications: "Notifications",
    evidence: "Evidence",
  },
};

function humanizeFieldKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(empty)";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    const count = value.length;
    return `${count} line${count === 1 ? "" : "s"}`;
  }
  const text = String(value).replace(/\s+/g, " ").trim();
  return text.length > 72 ? `${text.slice(0, 69)}…` : text;
}

function recordsEqual(before: unknown, after: unknown) {
  return JSON.stringify(before) === JSON.stringify(after);
}

export function diffRecordChanges(
  entityType: AuditEntityType,
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string[] {
  const labels = FIELD_LABELS[entityType] ?? {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const lines: string[] = [];

  for (const key of keys) {
    if (AUDIT_IGNORE_KEYS.has(key)) continue;
    const prev = before[key];
    const next = after[key];
    if (recordsEqual(prev, next)) continue;

    const label = labels[key] ?? humanizeFieldKey(key);

    if (Array.isArray(prev) || Array.isArray(next)) {
      const prevLen = Array.isArray(prev) ? prev.length : 0;
      const nextLen = Array.isArray(next) ? next.length : 0;
      if (prevLen !== nextLen) {
        lines.push(`${label}: ${prevLen} lines → ${nextLen} lines`);
      } else {
        lines.push(`${label}: content changed`);
      }
      continue;
    }

    lines.push(`${label}: ${formatAuditValue(prev)} → ${formatAuditValue(next)}`);
  }

  return lines;
}

export function formatChangeDetail(
  entityType: AuditEntityType,
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
  maxLines = 15
): string {
  if (!before) return "";
  const lines = diffRecordChanges(entityType, before, after);
  if (!lines.length) return "";
  if (lines.length <= maxLines) return lines.join("\n");
  const shown = lines.slice(0, maxLines);
  return `${shown.join("\n")}\n+ ${lines.length - maxLines} more changes`;
}

export function recordDisplayName(entityType: AuditEntityType, record: Record<string, unknown>): string {
  if (entityType === "enquiry" || entityType === "contract") {
    const doc = record.documentNo;
    if (typeof doc === "string" && doc.trim()) return doc;
  }
  if (entityType === "client" || entityType === "employee" || entityType === "location" || entityType === "service-agreement" || entityType === "product") {
    const key = record.searchKey;
    if (typeof key === "string" && key.trim()) return key;
  }
  if (entityType === "product" || entityType === "price-list") {
    const name = record.name;
    if (typeof name === "string" && name.trim()) return name;
  }
  if (entityType === "task") {
    const title = record.title;
    if (typeof title === "string" && title.trim()) return title;
  }
  if (entityType === "organization") {
    const trading = record.tradingName;
    if (typeof trading === "string" && trading.trim()) return trading;
  }
  const id = record.id;
  return typeof id === "string" && id.trim() ? id : auditEntityLabels[entityType];
}

export function buildChangeSummary(
  entityType: AuditEntityType,
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
  isCreate: boolean
): string {
  const entityLabel = auditEntityLabels[entityType];
  const name = recordDisplayName(entityType, after);

  if (isCreate) return `${entityLabel} ${name} created`;

  const changes = before ? diffRecordChanges(entityType, before, after) : [];
  if (!changes.length) return `${entityLabel} ${name} updated`;

  const statusChange = changes.find((line) => line.startsWith("Status:"));
  if (statusChange) {
    const detail = statusChange.replace("Status: ", "");
    return `${entityLabel} ${name} — status ${detail}`;
  }

  if (changes.length === 1) {
    const field = changes[0].split(":")[0];
    return `${entityLabel} ${name} — ${field} changed`;
  }

  return `${entityLabel} ${name} updated (${changes.length} changes)`;
}
