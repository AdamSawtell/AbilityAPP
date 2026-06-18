import { ALL_PROCESS_IDS, APP_WINDOW_KEYS, MY_WORKPLACE_WINDOW_KEYS, TASK_WINDOW_KEYS } from "@/lib/access/catalog";
import { windowKeysWithDependents } from "@/lib/access/detail-windows";
import { ALL_REPORT_IDS } from "@/lib/reports/catalog";
import type { AppRoleRecord } from "@/lib/access/types";
import { fullTaskTypePermissions, permissionsForTypes } from "@/lib/task-type";

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

const EXEC_PROCESSES = [
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
      ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
    ],
    processIds: [...EXEC_PROCESSES, "submit-leave-request"],
    reportIds: [...EXEC_REPORTS],
    taskTypePermissions: permissionsForTypes(["tt-review", "tt-approve", "tt-check", "tt-decide"]),
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
    processIds: [...EXEC_PROCESSES, "submit-leave-request"],
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
    processIds: [...OFFICER_PROCESSES, "submit-leave-request"],
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
    processIds: ["assign-task", "action-task", "report-incident", "assign-location-employee", "submit-leave-request"],
    reportIds: ["tasks-all", "location-register", "incident-register"],
    taskTypePermissions: permissionsForTypes(["tt-check", "tt-other", "tt-review"]),
  };
}

export function adminRole(allTaskTypeIds: string[]): AppRoleRecord {
  return {
    id: "role-admin",
    roleKey: "AbilityAPP_Admin",
    name: "AbilityAPP Admin",
    description: "Full system access — all windows and processes",
    active: true,
    windowKeys: [...APP_WINDOW_KEYS],
    processIds: [...ALL_PROCESS_IDS],
    reportIds: [...ALL_REPORT_IDS],
    taskTypePermissions: fullTaskTypePermissions(allTaskTypeIds),
  };
}

export function defineRole(
  id: string,
  roleKey: string,
  name: string,
  description: string,
  access: Pick<AppRoleRecord, "windowKeys" | "processIds" | "reportIds" | "taskTypePermissions">
): AppRoleRecord {
  return { id, roleKey, name, description, active: true, ...access };
}
