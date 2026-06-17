import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import type { OrgPositionRecord, PositionAssignmentRecord } from "@/lib/org-structure";

export type HolderRoleAlignmentIssue = {
  employeeId: string;
  employeeName: string;
  kind: "no_required_role" | "no_user" | "inactive_user" | "missing_role";
  username?: string;
  requiredRoleId?: string;
  requiredRoleName?: string;
  userRoleNames?: string[];
};

function roleName(roles: AppRoleRecord[], roleId: string): string {
  return roles.find((r) => r.id === roleId)?.name ?? roleId;
}

function userRoleNames(user: AppUserRecord, roles: AppRoleRecord[]): string[] {
  return user.roleIds
    .map((id) => roles.find((r) => r.id === id)?.name ?? id)
    .filter(Boolean);
}

export function checkHolderRoleAlignment({
  employeeId,
  employeeName,
  requiredRoleId,
  users,
  roles,
}: {
  employeeId: string;
  employeeName: string;
  requiredRoleId: string;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
}): HolderRoleAlignmentIssue | null {
  if (!employeeId.trim()) return null;
  if (!requiredRoleId.trim()) {
    return {
      employeeId,
      employeeName,
      kind: "no_required_role",
    };
  }

  const user = users.find((u) => u.employeeBpId === employeeId);
  if (!user) {
    return {
      employeeId,
      employeeName,
      kind: "no_user",
      requiredRoleId,
      requiredRoleName: roleName(roles, requiredRoleId),
    };
  }

  if (!user.active) {
    return {
      employeeId,
      employeeName,
      kind: "inactive_user",
      username: user.username,
      requiredRoleId,
      requiredRoleName: roleName(roles, requiredRoleId),
      userRoleNames: userRoleNames(user, roles),
    };
  }

  if (!user.roleIds.includes(requiredRoleId)) {
    return {
      employeeId,
      employeeName,
      kind: "missing_role",
      username: user.username,
      requiredRoleId,
      requiredRoleName: roleName(roles, requiredRoleId),
      userRoleNames: userRoleNames(user, roles),
    };
  }

  return null;
}

export function alignmentIssueMessage(issue: HolderRoleAlignmentIssue): string {
  switch (issue.kind) {
    case "no_required_role":
      return `${issue.employeeName} is assigned but this position has no security role set. Choose a role from System → Admin → Roles.`;
    case "no_user":
      return `${issue.employeeName} has no linked login user. Link them on Employee → System access before they can access the app as this position.`;
    case "inactive_user":
      return `${issue.employeeName} (${issue.username}) is linked to an inactive user account.`;
    case "missing_role":
      return `${issue.employeeName} (${issue.username}) does not have the ${issue.requiredRoleName} role. Current roles: ${issue.userRoleNames?.join(", ") || "none"}. Assign the role in System → Admin → Roles.`;
    default:
      return "Holder login roles do not match this position.";
  }
}

export function positionHolderAlignmentIssues(
  position: OrgPositionRecord,
  actingEmployeeId: string,
  users: AppUserRecord[],
  roles: AppRoleRecord[],
  employeeNameById: Map<string, string>
): { primary: HolderRoleAlignmentIssue | null; acting: HolderRoleAlignmentIssue | null } {
  const requiredRoleId = position.securityRoleId;
  const nameFor = (id: string) => employeeNameById.get(id) ?? id;

  const primary = position.primaryEmployeeId
    ? checkHolderRoleAlignment({
        employeeId: position.primaryEmployeeId,
        employeeName: nameFor(position.primaryEmployeeId),
        requiredRoleId,
        users,
        roles,
      })
    : null;

  const acting = actingEmployeeId
    ? checkHolderRoleAlignment({
        employeeId: actingEmployeeId,
        employeeName: nameFor(actingEmployeeId),
        requiredRoleId,
        users,
        roles,
      })
    : null;

  return { primary, acting };
}

export function countHolderMisalignments(
  positions: OrgPositionRecord[],
  assignments: PositionAssignmentRecord[],
  users: AppUserRecord[],
  roles: AppRoleRecord[]
): number {
  let count = 0;
  const seen = new Set<string>();

  for (const position of positions) {
    if (position.id === "pos-org-root" || !position.securityRoleId) continue;

    const actingId =
      assignments.find(
        (a) => a.positionId === position.id && a.assignmentType === "acting" && !a.effectiveTo
      )?.employeeId ?? "";

    for (const employeeId of [position.primaryEmployeeId, actingId]) {
      if (!employeeId) continue;
      const key = `${position.id}:${employeeId}`;
      if (seen.has(key)) continue;

      const issue = checkHolderRoleAlignment({
        employeeId,
        employeeName: employeeId,
        requiredRoleId: position.securityRoleId,
        users,
        roles,
      });
      if (issue) {
        seen.add(key);
        count += 1;
      }
    }
  }

  return count;
}
