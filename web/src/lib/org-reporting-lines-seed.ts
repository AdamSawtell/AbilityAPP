import type { OrgPositionReportingLineRecord } from "@/lib/org-structure";

/** Seed dotted lines — board members peer under board container, dotted to chair; execs dotted to board. */
export const leadershipReportingLines: OrgPositionReportingLineRecord[] = [
  {
    id: "orl-board-2-chair",
    positionId: "pos-board-2",
    reportsToPositionId: "pos-board-1",
    lineType: "dotted",
    label: "Reports to chair",
    sortOrder: 10,
  },
  {
    id: "orl-board-3-chair",
    positionId: "pos-board-3",
    reportsToPositionId: "pos-board-1",
    lineType: "dotted",
    label: "Reports to chair",
    sortOrder: 20,
  },
  {
    id: "orl-board-4-chair",
    positionId: "pos-board-4",
    reportsToPositionId: "pos-board-1",
    lineType: "dotted",
    label: "Reports to chair",
    sortOrder: 30,
  },
  {
    id: "orl-exec-ops-board",
    positionId: "pos-exec-ops",
    reportsToPositionId: "pos-board",
    lineType: "dotted",
    label: "Governance",
    sortOrder: 10,
  },
  {
    id: "orl-exec-hr-board",
    positionId: "pos-exec-hr",
    reportsToPositionId: "pos-board",
    lineType: "dotted",
    label: "Governance",
    sortOrder: 20,
  },
  {
    id: "orl-exec-finance-board",
    positionId: "pos-exec-finance",
    reportsToPositionId: "pos-board",
    lineType: "dotted",
    label: "Governance",
    sortOrder: 30,
  },
  {
    id: "orl-exec-ict-board",
    positionId: "pos-exec-ict",
    reportsToPositionId: "pos-board",
    lineType: "dotted",
    label: "Governance",
    sortOrder: 40,
  },
  {
    id: "orl-exec-quality-board",
    positionId: "pos-exec-quality",
    reportsToPositionId: "pos-board",
    lineType: "dotted",
    label: "Governance",
    sortOrder: 50,
  },
];
