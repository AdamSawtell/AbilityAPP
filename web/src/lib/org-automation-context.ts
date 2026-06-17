import type { AppUserRecord } from "@/lib/access/types";
import type { EmployeeRecord } from "@/lib/employee";
import type { OrgPositionRecord, PositionAssignmentRecord } from "@/lib/org-structure";

export type OrgAutomationContext = {
  positions: OrgPositionRecord[];
  assignments: PositionAssignmentRecord[];
  employees: EmployeeRecord[];
  users: Pick<AppUserRecord, "id" | "employeeBpId">[];
};

let runtimeContext: OrgAutomationContext | null = null;

export function setOrgAutomationContext(ctx: OrgAutomationContext) {
  runtimeContext = ctx;
}

export function getOrgAutomationContext(): OrgAutomationContext | null {
  return runtimeContext;
}
