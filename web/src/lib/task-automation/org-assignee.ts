import type { EmployeeRecord } from "@/lib/employee";
import type { OrgAutomationContext } from "@/lib/org-automation-context";
import {
  accountableManagerForIncident,
  resolvePositionHolder,
} from "@/lib/org-structure-resolver";
import type { TaskAutomationRecord } from "@/lib/task-automation";
import type { AutomationTemplateContext } from "@/lib/task-automation/engine";

export type ResolvedAutomationAssignee = {
  assignmentType: "role" | "user";
  assigneeRoleId: string;
  assigneeUserId: string;
};

function employeesById(employees: EmployeeRecord[]) {
  return new Map(employees.map((e) => [e.id, e]));
}

function userIdForEmployee(
  employeeId: string,
  users: OrgAutomationContext["users"]
): string {
  if (!employeeId) return "";
  return users.find((u) => u.employeeBpId === employeeId)?.id ?? "";
}

export function resolveAutomationAssignee(
  rule: TaskAutomationRecord,
  ctx: AutomationTemplateContext,
  org: OrgAutomationContext | null
): ResolvedAutomationAssignee {
  const fallback: ResolvedAutomationAssignee = {
    assignmentType: "role",
    assigneeRoleId: rule.assigneeRoleId || "role-admin",
    assigneeUserId: "",
  };

  if (!org || rule.assigneeMode === "role") {
    return fallback;
  }

  const empMap = employeesById(org.employees);
  let employeeId = "";

  if (rule.assigneeMode === "org_incident_manager") {
    if (!ctx.incident) return fallback;
    const manager = accountableManagerForIncident(
      ctx.incident,
      org.positions,
      org.assignments,
      empMap
    );
    employeeId = manager?.employeeId ?? "";
  } else if (rule.assigneeMode === "org_reports_to_manager" && ctx.employee) {
    employeeId = ctx.employee.reportsToId?.trim() ?? "";
  } else if (rule.assigneeMode === "org_position" && rule.assigneePositionId) {
    const holder = resolvePositionHolder(
      rule.assigneePositionId,
      org.positions,
      org.assignments,
      empMap
    );
    employeeId = holder?.employeeId ?? "";
  }

  const assigneeUserId = userIdForEmployee(employeeId, org.users);
  if (assigneeUserId) {
    return {
      assignmentType: "user",
      assigneeRoleId: "",
      assigneeUserId,
    };
  }

  return fallback;
}
