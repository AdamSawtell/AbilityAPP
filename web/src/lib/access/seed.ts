import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import { ALL_PROCESS_IDS, ALL_WINDOW_KEYS, TASK_WINDOW_KEYS } from "@/lib/access/catalog";
import { windowKeysWithDependents } from "@/lib/access/detail-windows";
import { ALL_REPORT_IDS } from "@/lib/reports/catalog";
import {
  fullTaskTypePermissions,
  INITIAL_TASK_TYPES,
  mergeTaskTypePermissions,
  permissionsForTypes,
} from "@/lib/task-type";

const TASK_ACCESS = [...TASK_WINDOW_KEYS];
const ALL_TASK_TYPE_IDS = INITIAL_TASK_TYPES.map((t) => t.id);

/** Read employee records and linked incidents (not full HR file). */
const EMPLOYEE_INCIDENT_LINK_WINDOWS = ["employees", "employee-overview", "employee-incidents"] as const;

export const SEED_USERS: AppUserRecord[] = [
  {
    id: "user-superuser",
    username: "SuperUser",
    email: "superuser@abilityapp.local",
    firstName: "Super",
    lastName: "User",
    phone: "",
    active: true,
    employeeBpId: "",
    notes: "Full access administrator (AbilityAPP SuperUser equivalent)",
    roleIds: ["role-admin"],
  },
  {
    id: "user-isla",
    username: "IslaRobinson",
    email: "isla.robinson@abilityerp.local",
    firstName: "Isla",
    lastName: "Robinson",
    phone: "",
    active: true,
    employeeBpId: "emp-isla",
    notes: "Intake and client coordination",
    roleIds: ["role-intake", "role-coordinator"],
  },
  {
    id: "user-gabriela",
    username: "GabrielaWilson",
    email: "gabriela.wilson@abilityerp.local",
    firstName: "Gabriela",
    lastName: "Wilson",
    phone: "",
    active: true,
    employeeBpId: "emp-gabriela",
    notes: "Enquiry processing",
    roleIds: ["role-intake"],
  },
];

export const SEED_ROLES: AppRoleRecord[] = [
  {
    id: "role-admin",
    roleKey: "AbilityAPP_Admin",
    name: "AbilityAPP Admin",
    description: "Full system access — all windows and processes",
    active: true,
    windowKeys: [...ALL_WINDOW_KEYS],
    processIds: [...ALL_PROCESS_IDS],
    reportIds: [...ALL_REPORT_IDS],
    taskTypePermissions: fullTaskTypePermissions(ALL_TASK_TYPE_IDS),
  },
  {
    id: "role-intake",
    roleKey: "Intake_Coordinator",
    name: "Intake Coordinator",
    description: "Enquiries and convert-to-client process",
    active: true,
    windowKeys: [
      "home",
      "reports",
      ...TASK_ACCESS,
      ...windowKeysWithDependents("enquiries", "clients", "incidents", "locations"),
      ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
    ],
    processIds: ["enquiry-to-client", "assign-location-client", "assign-location-employee", "assign-location-product", "assign-task", "action-task", "report-incident", "notify-ndis-reportable"],
    reportIds: ["client-register", "enquiry-register", "location-register", "tasks-all", "incident-register", "ndis-reportable-incidents"],
    taskTypePermissions: permissionsForTypes(["tt-review", "tt-check", "tt-develop", "tt-other"]),
  },
  {
    id: "role-coordinator",
    roleKey: "Support_Coordinator",
    name: "Support Coordinator",
    description: "Client records and service catalog (no admin)",
    active: true,
    windowKeys: [
      "home",
      "reports",
      ...TASK_ACCESS,
      ...windowKeysWithDependents("clients", "incidents", "locations", "products", "price-lists", "service-agreements"),
      ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
    ],
    processIds: ["assign-location-client", "assign-location-employee", "assign-location-product", "assign-task", "action-task", "report-incident", "notify-ndis-reportable"],
    reportIds: ["client-register", "location-register", "tasks-all", "incident-register", "ndis-reportable-incidents"],
    taskTypePermissions: permissionsForTypes(["tt-review", "tt-approve", "tt-check", "tt-decide"]),
  },
];

/** Merge seed catalog access in development only (avoids over-granting in production DB). */
export function shouldMergeSeedAccess(): boolean {
  return process.env.NODE_ENV !== "production" || process.env.ABILITYAPP_MERGE_SEED_ACCESS === "true";
}

/** Ensure seed roles keep catalog windows when the DB or cached session predates a catalog update. */
export function withSeedTaskAccess(role: AppRoleRecord): AppRoleRecord {
  const seed = SEED_ROLES.find((r) => r.id === role.id);
  if (!seed) {
    return {
      ...role,
      reportIds: role.reportIds ?? [],
      taskTypePermissions: mergeTaskTypePermissions(role.taskTypePermissions, ALL_TASK_TYPE_IDS),
    };
  }

  if (!shouldMergeSeedAccess()) {
    return {
      ...role,
      reportIds: role.reportIds ?? [],
      taskTypePermissions: mergeTaskTypePermissions(role.taskTypePermissions, ALL_TASK_TYPE_IDS),
    };
  }

  const windowKeys = [...new Set([...role.windowKeys, ...seed.windowKeys])];
  const processIds = [...new Set([...role.processIds, ...seed.processIds])];
  const reportIds = [...new Set([...(role.reportIds ?? []), ...(seed.reportIds ?? [])])];
  const taskTypePermissions = mergeTaskTypePermissions(
    role.taskTypePermissions?.length ? role.taskTypePermissions : seed.taskTypePermissions,
    ALL_TASK_TYPE_IDS
  );

  if (
    windowKeys.length === role.windowKeys.length &&
    processIds.length === role.processIds.length &&
    reportIds.length === (role.reportIds?.length ?? 0) &&
    taskTypePermissions.length === (role.taskTypePermissions?.length ?? 0) &&
    role.windowKeys.every((k) => windowKeys.includes(k))
  ) {
    return { ...role, taskTypePermissions, reportIds: role.reportIds ?? reportIds };
  }
  return { ...role, windowKeys, processIds, reportIds, taskTypePermissions };
}
