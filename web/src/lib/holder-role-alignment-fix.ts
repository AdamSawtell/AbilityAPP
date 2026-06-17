import type { AppUserRecord } from "@/lib/access/types";
import type { EmployeeRecord } from "@/lib/employee";
import type { HolderRoleAlignmentIssue } from "@/lib/org-position-role-alignment";

/** Default password for auto-created seed logins (dev / first-time enable). */
export const ALIGNMENT_FIX_DEFAULT_PASSWORD = "welcome";

export function usernameFromEmployeeName(firstName: string, lastName: string): string {
  return `${firstName}${lastName}`.replace(/\s/g, "");
}

export function userIdForEmployee(employeeId: string): string {
  return `user-${employeeId.replace(/^emp-/, "")}`;
}

export function canAutoFixHolderAlignment(issue: HolderRoleAlignmentIssue): boolean {
  return issue.kind !== "no_required_role" && Boolean(issue.requiredRoleId);
}

export function alignmentFixLabel(issue: HolderRoleAlignmentIssue): string {
  switch (issue.kind) {
    case "missing_role":
      return `Add ${issue.requiredRoleName ?? "role"} to login`;
    case "no_user":
      return `Create login with ${issue.requiredRoleName ?? "role"}`;
    case "inactive_user":
      return `Activate user and add ${issue.requiredRoleName ?? "role"}`;
    default:
      return "Fix alignment";
  }
}

export function buildHolderAlignmentFix(
  issue: HolderRoleAlignmentIssue,
  users: AppUserRecord[],
  employee: EmployeeRecord | undefined
): { user: AppUserRecord; setPassword: boolean } | null {
  if (!canAutoFixHolderAlignment(issue) || !issue.requiredRoleId) return null;

  const requiredRoleId = issue.requiredRoleId;
  const existing = users.find((u) => u.employeeBpId === issue.employeeId);

  if (issue.kind === "missing_role" && existing) {
    if (existing.roleIds.includes(requiredRoleId)) return null;
    return {
      user: {
        ...existing,
        roleIds: [...existing.roleIds, requiredRoleId],
      },
      setPassword: false,
    };
  }

  if (issue.kind === "inactive_user" && existing) {
    const roleIds = existing.roleIds.includes(requiredRoleId)
      ? existing.roleIds
      : [...existing.roleIds, requiredRoleId];
    return {
      user: { ...existing, active: true, roleIds },
      setPassword: false,
    };
  }

  if (issue.kind === "no_user" && employee) {
    const username = usernameFromEmployeeName(employee.firstName, employee.lastName);
    const taken = users.some((u) => u.username.toLowerCase() === username.toLowerCase() && u.employeeBpId !== employee.id);
    return {
      user: {
        id: userIdForEmployee(employee.id),
        username: taken ? `${username}${employee.id.slice(-3)}` : username,
        email: employee.email || `${username.toLowerCase()}@abilityerp.local`,
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.mobile || employee.phone,
        active: true,
        employeeBpId: employee.id,
        notes: "Auto-created from organisation structure alignment",
        roleIds: [requiredRoleId],
      },
      setPassword: true,
    };
  }

  return null;
}
