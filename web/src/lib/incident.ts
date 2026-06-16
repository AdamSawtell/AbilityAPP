import { newLineId } from "@/lib/client-line-tables";

export type IncidentStatus =
  | "Draft"
  | "Submitted"
  | "Manager reviewed"
  | "Commission notified"
  | "Under investigation"
  | "Actions in progress"
  | "Closed";

export type IncidentSeverity = "Low" | "Medium" | "High" | "Critical";

export type NdisReportableType =
  | ""
  | "Death"
  | "Serious injury"
  | "Abuse or neglect"
  | "Unlawful sexual or physical contact or assault"
  | "Sexual misconduct"
  | "Unauthorised restrictive practice";

export type IncidentPartyRow = {
  id: string;
  lineNo: number;
  partyType: "Client" | "Employee" | "Witness" | "Other";
  entityId: string;
  partyName: string;
  roleInIncident: string;
  notes: string;
};

export type IncidentActionRow = {
  id: string;
  lineNo: number;
  actionDate: string;
  actionType: string;
  description: string;
  evidenceRef: string;
  owner: string;
  outcome: string;
};

export type IncidentNotificationRow = {
  id: string;
  lineNo: number;
  notifiedAt: string;
  notifyTarget: string;
  method: string;
  notifiedBy: string;
  reference: string;
  notes: string;
};

export type IncidentEvidenceRow = {
  id: string;
  lineNo: number;
  actionId: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: string;
  notes: string;
};

export type IncidentRecord = {
  id: string;
  documentNo: string;
  title: string;
  status: IncidentStatus;
  severity: IncidentSeverity;
  category: string;
  serviceType: string;
  isReportable: boolean;
  reportableType: NdisReportableType;
  restrictivePracticeCausedHarm: boolean;
  occurredAt: string;
  awareAt: string;
  reportedAt: string;
  reportDeadlineAt: string;
  ndisNotifiedAt: string;
  ndisNotificationRef: string;
  primaryClientId: string;
  primaryEmployeeId: string;
  primaryLocationId: string;
  linkedRestrictivePracticeId: string;
  managerReviewedAt: string;
  managerReviewedBy: string;
  description: string;
  immediateActions: string;
  investigationSummary: string;
  correctiveActions: string;
  lessonsLearned: string;
  createdBy: string;
  updatedBy: string;
  parties: IncidentPartyRow[];
  actions: IncidentActionRow[];
  notifications: IncidentNotificationRow[];
  evidence: IncidentEvidenceRow[];
};

export const incidentStatusOptions: IncidentStatus[] = [
  "Draft",
  "Submitted",
  "Manager reviewed",
  "Commission notified",
  "Under investigation",
  "Actions in progress",
  "Closed",
];

export const incidentSeverityOptions: IncidentSeverity[] = ["Low", "Medium", "High", "Critical"];

export const incidentCategoryOptions = [
  "Operational",
  "Near miss",
  "Injury",
  "Behaviour",
  "Restrictive practice",
  "Property damage",
  "Other",
] as const;

/** NDIS / service line the incident occurred under (set on the record; used in analytics). */
export const incidentServiceTypeOptions = [
  "NDIS Support",
  "SIL",
  "Community Participation",
  "Therapy",
  "Transport",
  "Administration",
  "Unassigned",
] as const;

export const ndisReportableTypeOptions: NdisReportableType[] = [
  "",
  "Death",
  "Serious injury",
  "Abuse or neglect",
  "Unlawful sexual or physical contact or assault",
  "Sexual misconduct",
  "Unauthorised restrictive practice",
];

export const incidentTabs = [
  "Overview",
  "Parties & links",
  "Investigation",
  "Notifications",
] as const;

export type IncidentTab = (typeof incidentTabs)[number];

export const incidentTabGroups: { label: string; tabs: IncidentTab[] }[] = [
  { label: "Record", tabs: ["Overview", "Parties & links"] },
  { label: "Compliance", tabs: ["Investigation", "Notifications"] },
];

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added += 1;
  }
  return result;
}

/** NDIS Commission reporting deadline from awareness time. */
export function computeNdisReportDeadline(
  awareAt: string,
  reportableType: NdisReportableType,
  restrictivePracticeCausedHarm: boolean
): string {
  if (!awareAt?.trim() || !reportableType) return "";
  const aware = new Date(awareAt);
  if (Number.isNaN(aware.getTime())) return "";

  if (reportableType === "Unauthorised restrictive practice" && !restrictivePracticeCausedHarm) {
    return addBusinessDays(aware, 5).toISOString();
  }
  return new Date(aware.getTime() + 24 * 60 * 60 * 1000).toISOString();
}

export function isNdisReportOverdue(record: IncidentRecord): boolean {
  if (!record.isReportable || record.ndisNotifiedAt) return false;
  if (!record.reportDeadlineAt) return false;
  const deadline = new Date(record.reportDeadlineAt);
  return !Number.isNaN(deadline.getTime()) && deadline.getTime() < Date.now();
}

export function ndisDeadlineLabel(record: IncidentRecord): string {
  if (!record.isReportable) return "";
  if (record.ndisNotifiedAt) return "NDIS notified";
  if (!record.reportDeadlineAt) return "Set awareness date and reportable type";
  if (isNdisReportOverdue(record)) return "NDIS reporting overdue";
  return "NDIS reporting due";
}

export function statusTone(status: IncidentStatus): "sky" | "amber" | "rose" | "emerald" | "zinc" | "violet" {
  switch (status) {
    case "Draft":
      return "zinc";
    case "Submitted":
      return "sky";
    case "Manager reviewed":
      return "violet";
    case "Commission notified":
      return "amber";
    case "Under investigation":
      return "amber";
    case "Actions in progress":
      return "rose";
    case "Closed":
      return "emerald";
    default:
      return "zinc";
  }
}

export function canAdvanceToManagerReview(record: IncidentRecord): boolean {
  return record.status === "Submitted";
}

export function canAdvanceToCommissionNotified(record: IncidentRecord): boolean {
  return record.status === "Manager reviewed";
}

export function advanceIncidentWorkflow(
  record: IncidentRecord,
  step: "manager_review" | "commission_notified",
  reviewedBy: string
): IncidentRecord {
  const now = new Date().toISOString();
  if (step === "manager_review") {
    return normalizeIncident({
      ...record,
      status: "Manager reviewed",
      managerReviewedAt: now,
      managerReviewedBy: reviewedBy,
    });
  }
  return normalizeIncident({
    ...record,
    status: "Commission notified",
    ndisNotifiedAt: record.ndisNotifiedAt || now,
    managerReviewedAt: record.managerReviewedAt || now,
    managerReviewedBy: record.managerReviewedBy || reviewedBy,
  });
}

export function showRestrictivePracticeLink(record: IncidentRecord): boolean {
  return (
    record.reportableType === "Unauthorised restrictive practice" ||
    record.category === "Restrictive practice"
  );
}

export function formatDisplayDateTime(iso: string) {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDisplayDate(iso: string) {
  if (!iso?.trim()) return "—";
  if (iso.length >= 10 && iso[4] === "-" && iso[7] === "-") {
    const [y, m, d] = iso.slice(0, 10).split("-");
    if (y && m && d) return `${d}/${m}/${y}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function renumberParties(rows: IncidentPartyRow[]): IncidentPartyRow[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

function renumberActions(rows: IncidentActionRow[]): IncidentActionRow[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

function renumberNotifications(rows: IncidentNotificationRow[]): IncidentNotificationRow[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

function renumberEvidence(rows: IncidentEvidenceRow[]): IncidentEvidenceRow[] {
  return rows.map((row, index) => ({ ...row, lineNo: index + 1 }));
}

export function normalizeIncident(record: IncidentRecord): IncidentRecord {
  const reportDeadlineAt =
    record.isReportable && record.reportableType
      ? computeNdisReportDeadline(record.awareAt, record.reportableType, record.restrictivePracticeCausedHarm)
      : record.reportDeadlineAt;

  return {
    ...record,
    reportDeadlineAt,
    parties: renumberParties(record.parties ?? []),
    actions: renumberActions(record.actions ?? []),
    notifications: renumberNotifications(record.notifications ?? []),
    evidence: renumberEvidence(record.evidence ?? []),
  };
}

export function emptyIncident(): IncidentRecord {
  const now = new Date().toISOString();
  return normalizeIncident({
    id: "",
    documentNo: "",
    title: "",
    status: "Draft",
    severity: "Medium",
    category: "Operational",
    serviceType: "",
    isReportable: false,
    reportableType: "",
    restrictivePracticeCausedHarm: false,
    occurredAt: now,
    awareAt: now,
    reportedAt: now.slice(0, 10),
    reportDeadlineAt: "",
    ndisNotifiedAt: "",
    ndisNotificationRef: "",
    primaryClientId: "",
    primaryEmployeeId: "",
    primaryLocationId: "",
    linkedRestrictivePracticeId: "",
    managerReviewedAt: "",
    managerReviewedBy: "",
    description: "",
    immediateActions: "",
    investigationSummary: "",
    correctiveActions: "",
    lessonsLearned: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    parties: [],
    actions: [],
    notifications: [],
    evidence: [],
  });
}

export function nextIncidentId(existing: IncidentRecord[]): { id: string; documentNo: string } {
  const max = existing.reduce((highest, row) => {
    const n = Number.parseInt(row.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) && n > highest ? n : highest;
  }, 1_000_000);
  const next = max + 1;
  return { id: `inc-${next}`, documentNo: `INC-${next}` };
}

export function createIncident(partial: IncidentRecord, existing: IncidentRecord[]): IncidentRecord {
  const { id, documentNo } = nextIncidentId(existing);
  return normalizeIncident({
    ...emptyIncident(),
    ...partial,
    id,
    documentNo,
    createdBy: partial.createdBy || "SuperUser",
    updatedBy: partial.updatedBy || "SuperUser",
  });
}

export const initialIncidents: IncidentRecord[] = [
  normalizeIncident({
    id: "inc-1000001",
    documentNo: "INC-1000001",
    title: "Minor slip in day program kitchen",
    status: "Under investigation",
    severity: "Low",
    category: "Near miss",
    serviceType: "SIL",
    isReportable: false,
    reportableType: "",
    restrictivePracticeCausedHarm: false,
    occurredAt: "2026-06-10T10:30:00.000Z",
    awareAt: "2026-06-10T10:45:00.000Z",
    reportedAt: "2026-06-10",
    reportDeadlineAt: "",
    ndisNotifiedAt: "",
    ndisNotificationRef: "",
    primaryClientId: "bp-bern",
    primaryEmployeeId: "emp-isla",
    primaryLocationId: "",
    linkedRestrictivePracticeId: "",
    managerReviewedAt: "",
    managerReviewedBy: "",
    description:
      "Participant slipped on a wet floor near the kitchenette. No injury; first aid not required. Floor had just been mopped without signage.",
    immediateActions: "Area cordoned, wet floor sign placed, participant checked and comforted.",
    investigationSummary: "Reviewing cleaning roster and signage procedure with site lead.",
    correctiveActions: "",
    lessonsLearned: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
    parties: [
      {
        id: newLineId("ip"),
        lineNo: 1,
        partyType: "Client",
        entityId: "bp-bern",
        partyName: "",
        roleInIncident: "Affected person",
        notes: "",
      },
      {
        id: newLineId("ip"),
        lineNo: 2,
        partyType: "Employee",
        entityId: "emp-isla",
        partyName: "",
        roleInIncident: "Staff on duty",
        notes: "Responded immediately",
      },
    ],
    actions: [
      {
        id: newLineId("ia"),
        lineNo: 1,
        actionDate: "2026-06-10",
        actionType: "Immediate response",
        description: "Cordoned area and placed signage",
        evidenceRef: "Site log entry #442",
        owner: "Isla Nguyen",
        outcome: "Area made safe",
      },
    ],
    notifications: [],
    evidence: [],
  }),
];
