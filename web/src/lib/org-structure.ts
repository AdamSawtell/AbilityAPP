/**
 * Organisation structure — position tree, assignments, and resolution (Phases A–D).
 */

export type OrgPositionStatus = "filled" | "vacant" | "under_recruitment" | "frozen";

export type PositionAssignmentType = "primary" | "acting" | "temporary";

export type OrgPositionRecord = {
  id: string;
  title: string;
  department: string;
  parentPositionId: string;
  sortOrder: number;
  status: OrgPositionStatus;
  site: string;
  costCentre: string;
  primaryEmployeeId: string;
};

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
    department: raw.department ?? "",
    site: raw.site ?? "",
    costCentre: raw.costCentre ?? "",
    sortOrder: Number.isFinite(raw.sortOrder) ? raw.sortOrder : 0,
    status,
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
    department: "",
    parentPositionId: "",
    sortOrder: 0,
    status: "filled",
    site: "",
    costCentre: "",
    primaryEmployeeId: "",
  },
  {
    id: "pos-gm-ops",
    title: "Team Leader — Support coordination",
    department: "Operations",
    parentPositionId: "pos-org-root",
    sortOrder: 10,
    status: "filled",
    site: "Adelaide HQ",
    costCentre: "CC-CLIENT",
    primaryEmployeeId: "emp-michael",
  },
  {
    id: "pos-coordinator",
    title: "Support Coordinator",
    department: "Client services",
    parentPositionId: "pos-gm-ops",
    sortOrder: 10,
    status: "filled",
    site: "Adelaide HQ",
    costCentre: "CC-CLIENT",
    primaryEmployeeId: "emp-isla",
  },
  {
    id: "pos-intake",
    title: "Intake Officer",
    department: "Intake",
    parentPositionId: "pos-gm-ops",
    sortOrder: 20,
    status: "filled",
    site: "Adelaide HQ",
    costCentre: "CC-INTAKE",
    primaryEmployeeId: "emp-gabriela",
  },
  {
    id: "pos-support-worker",
    title: "Support Worker",
    department: "Operations",
    parentPositionId: "pos-gm-ops",
    sortOrder: 30,
    status: "filled",
    site: "Northern",
    costCentre: "CC-OPS",
    primaryEmployeeId: "emp-oliver",
  },
  {
    id: "pos-plan-dev",
    title: "Plan Developer",
    department: "Client services",
    parentPositionId: "pos-org-root",
    sortOrder: 20,
    status: "filled",
    site: "",
    costCentre: "",
    primaryEmployeeId: "emp-rose",
  },
  {
    id: "pos-contracts",
    title: "Contract Administrator",
    department: "Finance",
    parentPositionId: "pos-org-root",
    sortOrder: 30,
    status: "filled",
    site: "",
    costCentre: "",
    primaryEmployeeId: "emp-jessica",
  },
  {
    id: "pos-quality-vacant",
    title: "Quality & Compliance Manager",
    department: "Quality",
    parentPositionId: "pos-org-root",
    sortOrder: 15,
    status: "under_recruitment",
    site: "Adelaide HQ",
    costCentre: "CC-QUALITY",
    primaryEmployeeId: "",
  },
];

export const initialPositionAssignments: PositionAssignmentRecord[] = [
  {
    id: "pa-michael-primary",
    positionId: "pos-gm-ops",
    employeeId: "emp-michael",
    assignmentType: "primary",
    effectiveFrom: "2018-01-10",
    effectiveTo: "",
    notes: "",
  },
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
];

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
