import { ALL_PROCESS_IDS, APP_WINDOW_KEYS, MY_WORKPLACE_WINDOW_KEYS, TASK_WINDOW_KEYS } from "@/lib/access/catalog";
import { withHomePanels } from "@/lib/access/home-panels";
import { windowKeysWithDependents } from "@/lib/access/detail-windows";
import { ALL_REPORT_IDS } from "@/lib/reports/catalog";
import type { AppRoleRecord } from "@/lib/access/types";
import { fullTaskTypePermissions, mergeTaskTypePermissions, permissionsForTypes } from "@/lib/task-type";
import { normalizeRoleWindowAccess, windowAccessFromKeys } from "@/lib/access/window-access";

export const ADMIN_ROLE_ID = "role-admin";
export const ADMIN_ROLE_KEY = "AbilityAPP_Admin";

export function isAdminRole(role: Pick<AppRoleRecord, "id" | "roleKey"> | string): boolean {
  if (typeof role === "string") {
    return role === ADMIN_ROLE_ID || role === ADMIN_ROLE_KEY;
  }
  return role.id === ADMIN_ROLE_ID || role.roleKey === ADMIN_ROLE_KEY;
}

/** Admin always receives the full app catalog — not a stale DB snapshot. */
export function ensureAdminRoleAccess(role: AppRoleRecord, allTaskTypeIds: string[]): AppRoleRecord {
  if (!isAdminRole(role)) return normalizeRoleWindowAccess(role);

  const template = adminRole(allTaskTypeIds.length ? allTaskTypeIds : ["tt-review"]);
  return normalizeRoleWindowAccess({
    ...role,
    windowAccess: template.windowAccess,
    windowKeys: template.windowKeys,
    processIds: template.processIds,
    reportIds: template.reportIds,
    taskTypePermissions: mergeTaskTypePermissions(template.taskTypePermissions, allTaskTypeIds),
  });
}

const TASK_ACCESS = [...TASK_WINDOW_KEYS];
const SUPPORT_WORKER_TASK_ACCESS = ["tasks-assigned-to-me", "tasks-for-my-role", "tasks-past"] as const;
const EMPLOYEE_INCIDENT_LINK_WINDOWS = ["employees", "employee-overview", "employee-incidents"] as const;

const EXEC_REPORTS = [
  "client-register",
  "location-register",
  "tasks-all",
  "incident-register",
  "ndis-reportable-incidents",
  "enquiry-register",
] as const;

const MANAGER_REPORTS = [
  "client-register",
  "location-register",
  "tasks-all",
  "incident-register",
  "ndis-reportable-incidents",
] as const;

const OFFICER_REPORTS = ["tasks-all", "location-register", "incident-register"] as const;

export const EXEC_PROCESSES = [
  "assign-location-client",
  "assign-location-employee",
  "assign-location-product",
  "assign-task",
  "action-task",
  "report-incident",
  "notify-ndis-reportable",
] as const;

const OFFICER_PROCESSES = ["assign-task", "action-task", "report-incident"] as const;

const MY_WORKPLACE_ACCESS = [...MY_WORKPLACE_WINDOW_KEYS] as const;

/** Staff self-service — not HR/manager review. */
export const MY_WORKPLACE_STAFF_PROCESSES = ["submit-leave-request", "submit-employee-credential"] as const;

export const WORKFORCE_ON_BEHALF_PROCESSES = ["submit-leave-on-behalf"] as const;

/** HR credential sign-off — not granted to coordinators or general executives. */
export const HR_CREDENTIAL_REVIEW_PROCESSES = ["review-employee-credential"] as const;

/** Manager leave inbox — direct reports only unless paired with HR credential review. */
export const MANAGER_LEAVE_APPROVAL_PROCESSES = ["approve-leave-request"] as const;

const WORKPLACE_OPERATIONS_PROCESSES = [
  ...MY_WORKPLACE_STAFF_PROCESSES,
  ...WORKFORCE_ON_BEHALF_PROCESSES,
] as const;

export function executiveAccess(): Pick<AppRoleRecord, "windowKeys" | "processIds" | "reportIds" | "taskTypePermissions"> {
  return {
    windowKeys: [
      "home",
      "reports",
      ...TASK_ACCESS,
      ...MY_WORKPLACE_ACCESS,
      "workforce-planning",
      "workforce-organisation",
      "workforce-org-edit",
      ...windowKeysWithDependents("clients", "incidents", "locations", "employees", "enquiries"),
      "service-bookings",
      "service-planning",
      "rostering",
      "timesheets",
      "generate-timesheets",
      ...windowKeysWithDependents("service-bookings"),
      ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
    ],
    processIds: [...EXEC_PROCESSES, ...WORKPLACE_OPERATIONS_PROCESSES],
    reportIds: [...EXEC_REPORTS],
    taskTypePermissions: permissionsForTypes(["tt-review", "tt-approve", "tt-check", "tt-decide"]),
  };
}

export function workforceHrReviewAccess(): Pick<AppRoleRecord, "processIds"> {
  return {
    processIds: [
      ...executiveAccess().processIds,
      ...HR_CREDENTIAL_REVIEW_PROCESSES,
      ...MANAGER_LEAVE_APPROVAL_PROCESSES,
    ],
  };
}

export function workforceManagerLeaveAccess(): Pick<AppRoleRecord, "processIds"> {
  return {
    processIds: [...managerAccess().processIds, ...MANAGER_LEAVE_APPROVAL_PROCESSES],
  };
}

export function managerAccess(
  extraWindows: string[] = []
): Pick<AppRoleRecord, "windowKeys" | "processIds" | "reportIds" | "taskTypePermissions"> {
  return {
    windowKeys: [
      "home",
      "reports",
      ...TASK_ACCESS,
      ...MY_WORKPLACE_ACCESS,
      "workforce-planning",
      ...extraWindows,
      ...windowKeysWithDependents("clients", "incidents", "locations", "employees"),
      ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
    ],
    processIds: [...EXEC_PROCESSES, ...WORKPLACE_OPERATIONS_PROCESSES],
    reportIds: [...MANAGER_REPORTS],
    taskTypePermissions: permissionsForTypes(["tt-review", "tt-approve", "tt-check", "tt-decide"]),
  };
}

export function officerAccess(
  extraWindows: string[] = []
): Pick<AppRoleRecord, "windowKeys" | "processIds" | "reportIds" | "taskTypePermissions"> {
  return {
    windowKeys: [
      "home",
      "reports",
      ...TASK_ACCESS,
      ...MY_WORKPLACE_ACCESS,
      "workforce-planning",
      ...extraWindows,
      ...windowKeysWithDependents("clients", "incidents", "locations"),
      ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
    ],
    processIds: [...OFFICER_PROCESSES, ...MY_WORKPLACE_STAFF_PROCESSES, ...WORKFORCE_ON_BEHALF_PROCESSES],
    reportIds: [...OFFICER_REPORTS],
    taskTypePermissions: permissionsForTypes(["tt-review", "tt-check", "tt-other"]),
  };
}

export function boardAccess(): Pick<AppRoleRecord, "windowKeys" | "processIds" | "reportIds" | "taskTypePermissions"> {
  return {
    windowKeys: ["home", "reports", "workforce-planning", "workforce-organisation", "incidents", "incidents-dashboard"],
    processIds: [],
    reportIds: ["incident-register", "ndis-reportable-incidents", "client-register"],
    taskTypePermissions: permissionsForTypes(["tt-review"]),
  };
}

export function supportWorkerAccess(): Pick<AppRoleRecord, "windowKeys" | "processIds" | "reportIds" | "taskTypePermissions"> {
  return {
    windowKeys: [
      "home",
      "reports",
      ...SUPPORT_WORKER_TASK_ACCESS,
      ...MY_WORKPLACE_ACCESS,
      "workforce-planning",
      ...windowKeysWithDependents("clients", "incidents", "locations"),
      ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
    ],
    processIds: ["assign-task", "action-task", "report-incident", "assign-location-employee", "submit-leave-request", "submit-employee-credential"],
    reportIds: ["tasks-all", "location-register", "incident-register"],
    taskTypePermissions: permissionsForTypes(["tt-check", "tt-other", "tt-review"]),
  };
}

export function securityAdminSessionAuditAccess(): Pick<AppRoleRecord, "processIds"> {
  return {
    processIds: [
      "manage-session-audit-risk",
      "view-session-sensitive-session-data",
      "manage-process-audit-risk",
      "view-process-audit-sensitive",
      "manage-ai-query-audit-risk",
      "view-ai-query-audit-sensitive",
    ],
  };
}

export function auditViewerSessionAccess(): Pick<AppRoleRecord, "windowKeys" | "processIds"> {
  return {
    windowKeys: ["admin-user-session-audit", "admin-process-audit", "admin-ai-query-audit"],
    processIds: [],
  };
}

export function adminRole(allTaskTypeIds: string[]): AppRoleRecord {
  const windowKeys = [...APP_WINDOW_KEYS];
  return normalizeRoleWindowAccess({
    id: "role-admin",
    roleKey: "AbilityAPP_Admin",
    name: "AbilityAPP Admin",
    description: "Full system access — all windows and processes",
    active: true,
    windowKeys,
    windowAccess: windowAccessFromKeys(windowKeys, "write"),
    processIds: [...ALL_PROCESS_IDS],
    reportIds: [...ALL_REPORT_IDS],
    taskTypePermissions: fullTaskTypePermissions(allTaskTypeIds),
  });
}

export function defineRole(
  id: string,
  roleKey: string,
  name: string,
  description: string,
  access: Pick<AppRoleRecord, "windowKeys" | "processIds" | "reportIds" | "taskTypePermissions"> & {
    windowAccess?: AppRoleRecord["windowAccess"];
  }
): AppRoleRecord {
  const windowKeys = withHomePanels(access.windowKeys);
  return normalizeRoleWindowAccess({
    id,
    roleKey,
    name,
    description,
    active: true,
    windowKeys,
    windowAccess: access.windowAccess ?? {},
    processIds: access.processIds,
    reportIds: access.reportIds,
    taskTypePermissions: access.taskTypePermissions,
  });
}
