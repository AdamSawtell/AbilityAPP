/**
 * Organisation structure — position tree, assignments, and resolution (Phases A–D).
 */

import { bulkOrgPositions, bulkPositionAssignments } from "@/lib/org-structure-bulk-positions";
import {
  leadershipOrgPositions,
  leadershipPositionAssignments,
} from "@/lib/org-leadership-seed";
import { leadershipReportingLines } from "@/lib/org-reporting-lines-seed";

export type OrgPositionStatus = "filled" | "vacant" | "under_recruitment" | "frozen";

export type PositionAssignmentType = "primary" | "acting" | "temporary";

export type OrgPositionReportingLineType = "dotted";

export type OrgPositionReportingLineRecord = {
  id: string;
  positionId: string;
  reportsToPositionId: string;
  lineType: OrgPositionReportingLineType;
  label: string;
  sortOrder: number;
};

export type OrgPositionRecord = {
  id: string;
  title: string;
  /** Maps to Admin → Roles. Many positions (e.g. per site) share one security role. */
  securityRoleId: string;
  department: string;
  businessArea: string;
  locationId: string;
  parentPositionId: string;
  sortOrder: number;
  status: OrgPositionStatus;
  site: string;
  costCentre: string;
  primaryEmployeeId: string;
};

export const ORG_BUSINESS_AREAS = [
  "Executive",
  "Operations",
  "Client services",
  "Intake",
  "Quality",
  "Finance",
  "HR",
  "ICT",
  "Rostering",
] as const;

export type PositionAssignmentRecord = {
  id: string;
  positionId: string;
  employeeId: string;
  assignmentType: PositionAssignmentType;
  effectiveFrom: string;
  effectiveTo: string;
  notes: string;
};

export type OrgPositionNode = OrgPositionRecord & {
  children: OrgPositionNode[];
  depth: number;
};

export const ORG_POSITION_STATUS_OPTIONS: { value: OrgPositionStatus; label: string; hint: string }[] = [
  { value: "filled", label: "Filled", hint: "A primary holder is assigned" },
  { value: "vacant", label: "Vacant", hint: "No holder; escalations go to parent position" },
  { value: "under_recruitment", label: "Under recruitment", hint: "Vacant and actively recruiting" },
  { value: "frozen", label: "Frozen", hint: "Position held; no new assignments" },
];

export function orgPositionStatusLabel(status: OrgPositionStatus): string {
  return ORG_POSITION_STATUS_OPTIONS.find((o) => o.value === status)?.label ?? status;
}

export function normalizeOrgPosition(raw: OrgPositionRecord): OrgPositionRecord {
  const status = ORG_POSITION_STATUS_OPTIONS.some((o) => o.value === raw.status)
    ? raw.status
    : "vacant";
  return {
    ...raw,
    parentPositionId: raw.parentPositionId ?? "",
    primaryEmployeeId: raw.primaryEmployeeId ?? "",
    securityRoleId: raw.securityRoleId ?? "",
    department: raw.department ?? "",
    businessArea: raw.businessArea ?? raw.department ?? "",
    locationId: raw.locationId ?? "",
    site: raw.site ?? "",
    costCentre: raw.costCentre ?? "",
    sortOrder: Number.isFinite(raw.sortOrder) ? raw.sortOrder : 0,
    status,
  };
}

export function normalizePositionReportingLine(
  raw: OrgPositionReportingLineRecord
): OrgPositionReportingLineRecord {
  return {
    ...raw,
    lineType: raw.lineType === "dotted" ? "dotted" : "dotted",
    label: raw.label ?? "",
    sortOrder: Number.isFinite(raw.sortOrder) ? raw.sortOrder : 0,
  };
}

export function normalizePositionAssignment(raw: PositionAssignmentRecord): PositionAssignmentRecord {
  return {
    ...raw,
    effectiveFrom: raw.effectiveFrom ?? "",
    effectiveTo: raw.effectiveTo ?? "",
    notes: raw.notes ?? "",
  };
}

export const initialOrgPositions: OrgPositionRecord[] = [
  {
    id: "pos-org-root",
    title: "Organisation",
    securityRoleId: "",
    department: "",
    businessArea: "",
    locationId: "",
    parentPositionId: "",
    sortOrder: 0,
    status: "filled",
    site: "",
    costCentre: "",
    primaryEmployeeId: "",
  },
  ...leadershipOrgPositions,
  {
    id: "pos-support-worker",
    title: "Support Worker",
    securityRoleId: "role-support-worker",
    department: "Operations",
    businessArea: "Operations",
    locationId: "loc-northern-sil",
    parentPositionId: "pos-gm-ops",
    sortOrder: 40,
    status: "filled",
    site: "Northern SIL",
    costCentre: "CC-OPS",
    primaryEmployeeId: "emp-oliver",
  },
  ...bulkOrgPositions,
];

export const initialPositionAssignments: PositionAssignmentRecord[] = [
  {
    id: "pa-isla-primary",
    positionId: "pos-coordinator",
    employeeId: "emp-isla",
    assignmentType: "primary",
    effectiveFrom: "2019-03-01",
    effectiveTo: "",
    notes: "",
  },
  {
    id: "pa-gabriela-primary",
    positionId: "pos-intake",
    employeeId: "emp-gabriela",
    assignmentType: "primary",
    effectiveFrom: "2020-06-15",
    effectiveTo: "",
    notes: "",
  },
  {
    id: "pa-oliver-primary",
    positionId: "pos-support-worker",
    employeeId: "emp-oliver",
    assignmentType: "primary",
    effectiveFrom: "2021-09-01",
    effectiveTo: "",
    notes: "",
  },
  {
    id: "pa-rose-primary",
    positionId: "pos-plan-dev",
    employeeId: "emp-rose",
    assignmentType: "primary",
    effectiveFrom: "2017-11-20",
    effectiveTo: "",
    notes: "",
  },
  {
    id: "pa-jessica-primary",
    positionId: "pos-contracts",
    employeeId: "emp-jessica",
    assignmentType: "primary",
    effectiveFrom: "2022-02-01",
    effectiveTo: "",
    notes: "",
  },
  {
    id: "pa-finance-off-147",
    positionId: "pos-finance-officer",
    employeeId: "emp-staff-147",
    assignmentType: "primary",
    effectiveFrom: "2023-11-20",
    effectiveTo: "",
    notes: "",
  },
  ...leadershipPositionAssignments,
  ...bulkPositionAssignments,
];

export const initialOrgReportingLines: OrgPositionReportingLineRecord[] = [...leadershipReportingLines];

let positionSeq = 200;

export function newOrgPositionId(): string {
  positionSeq += 1;
  return `pos-${Date.now()}-${positionSeq}`;
}

let assignmentSeq = 200;

export function newPositionAssignmentId(): string {
  assignmentSeq += 1;
  return `pa-${Date.now()}-${assignmentSeq}`;
}

let reportingLineSeq = 200;

export function newOrgReportingLineId(): string {
  reportingLineSeq += 1;
  return `orl-${Date.now()}-${reportingLineSeq}`;
}
