import type { EmployeeRecord } from "@/lib/employee";
import {
  actingAssignmentForPosition,
  activeAssignments,
  isEmployeeOnLeaveToday,
} from "@/lib/org-structure-tree";
import type { OrgPositionRecord, PositionAssignmentRecord } from "@/lib/org-structure";

export type ResolvedPositionHolder = {
  employeeId: string;
  positionId: string;
  reason: "primary" | "acting" | "parent_escalation" | "vacant";
  escalatedFromPositionId?: string;
};

export function resolvePositionHolder(
  positionId: string,
  positions: OrgPositionRecord[],
  assignments: PositionAssignmentRecord[],
  employeesById: Map<string, EmployeeRecord>,
  onDate = new Date(),
  depth = 0
): ResolvedPositionHolder | null {
  if (depth > 20) return null;

  const position = positions.find((p) => p.id === positionId);
  if (!position) return null;

  const active = activeAssignments(assignments, onDate);
  const acting = actingAssignmentForPosition(active, positionId, onDate);

  const primaryId =
    position.primaryEmployeeId ||
    active.find((a) => a.positionId === positionId && a.assignmentType === "primary")?.employeeId ||
    "";

  const primaryEmployee = primaryId ? employeesById.get(primaryId) : undefined;
  const primaryAvailable =
    primaryId &&
    primaryEmployee &&
    !isEmployeeOnLeaveToday(primaryEmployee, onDate) &&
    position.status === "filled";

  if (acting?.employeeId) {
    return { employeeId: acting.employeeId, positionId, reason: "acting" };
  }

  if (primaryAvailable) {
    return { employeeId: primaryId, positionId, reason: "primary" };
  }

  if (position.status === "vacant" || position.status === "under_recruitment" || !primaryAvailable) {
    const parentId = position.parentPositionId?.trim();
    if (parentId) {
      const parent = resolvePositionHolder(
        parentId,
        positions,
        assignments,
        employeesById,
        onDate,
        depth + 1
      );
      if (parent) {
        return {
          ...parent,
          reason: "parent_escalation",
          escalatedFromPositionId: positionId,
        };
      }
    }
    return { employeeId: "", positionId, reason: "vacant" };
  }

  return null;
}

export function resolveManagerForEmployee(
  employeeId: string,
  levelsUp: number,
  positions: OrgPositionRecord[],
  assignments: PositionAssignmentRecord[],
  employeesById: Map<string, EmployeeRecord>,
  onDate = new Date()
): ResolvedPositionHolder | null {
  const ownPosition = positions.find((p) => p.primaryEmployeeId === employeeId);
  if (!ownPosition) return null;

  let currentId = ownPosition.parentPositionId?.trim() ?? "";
  for (let i = 0; i < levelsUp && currentId; i += 1) {
    const holder = resolvePositionHolder(currentId, positions, assignments, employeesById, onDate);
    if (!holder || holder.reason === "vacant") return holder;
    if (i === levelsUp - 1) return holder;
    const parentPos = positions.find((p) => p.id === currentId);
    currentId = parentPos?.parentPositionId?.trim() ?? "";
  }
  return null;
}

export function accountableManagerForIncident(
  incident: { parties: { partyType: string; entityId: string }[] },
  positions: OrgPositionRecord[],
  assignments: PositionAssignmentRecord[],
  employeesById: Map<string, EmployeeRecord>,
  onDate = new Date()
): (ResolvedPositionHolder & { employeeName: string; positionTitle: string }) | null {
  const employeeParty = incident.parties.find((p) => p.partyType === "Employee" && p.entityId?.trim());
  if (!employeeParty) return null;

  const holder = resolveManagerForEmployee(
    employeeParty.entityId,
    1,
    positions,
    assignments,
    employeesById,
    onDate
  );
  if (!holder?.employeeId) return null;

  const position = positions.find((p) => p.id === holder.positionId);
  const employee = employeesById.get(holder.employeeId);
  return {
    ...holder,
    employeeName: employee?.name ?? holder.employeeId,
    positionTitle: position?.title ?? "",
  };
}
