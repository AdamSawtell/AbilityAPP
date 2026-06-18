import { sanitizeAppWindowKeys } from "@/lib/access/catalog";
import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import { INITIAL_TASK_TYPES, mergeTaskTypePermissions, permissionsForTypes } from "@/lib/task-type";
import { bulkStaffUserLinks } from "@/lib/employee-bulk-seed";
import { leadershipUsersFromLinks } from "@/lib/access/leadership-login-seed";
import {
  adminRole,
  boardAccess,
  defineRole,
  executiveAccess,
  managerAccess,
  officerAccess,
  supportWorkerAccess,
} from "@/lib/access/role-access-templates";
import { windowKeysWithDependents } from "@/lib/access/detail-windows";

const TASK_ACCESS = ["tasks", "tasks-assigned-to-me", "tasks-for-my-role", "tasks-all", "tasks-past"] as const;
const ALL_TASK_TYPE_IDS = INITIAL_TASK_TYPES.map((t) => t.id);
const EMPLOYEE_INCIDENT_LINK_WINDOWS = ["employees", "employee-overview", "employee-incidents"] as const;

const INTAKE_ACCESS = {
  windowKeys: [
    "home",
    "reports",
    ...TASK_ACCESS,
    ...windowKeysWithDependents("enquiries", "clients", "incidents", "locations"),
    ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
  ],
  processIds: [
    "enquiry-to-client",
    "assign-location-client",
    "assign-location-employee",
    "assign-location-product",
    "assign-task",
    "action-task",
    "report-incident",
    "notify-ndis-reportable",
  ],
  reportIds: ["client-register", "enquiry-register", "location-register", "tasks-all", "incident-register", "ndis-reportable-incidents"],
  taskTypePermissions: permissionsForTypes(["tt-review", "tt-check", "tt-develop", "tt-other"]),
};

const COORDINATOR_ACCESS = {
  windowKeys: [
    "home",
    "reports",
    ...TASK_ACCESS,
    "workforce-planning",
    ...windowKeysWithDependents("clients", "incidents", "locations", "products", "price-lists", "service-agreements"),
    ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
  ],
  processIds: executiveAccess().processIds,
  reportIds: ["client-register", "location-register", "tasks-all", "incident-register", "ndis-reportable-incidents"],
  taskTypePermissions: managerAccess().taskTypePermissions,
};

const TEAM_LEADER_ACCESS = {
  windowKeys: [
    "home",
    "reports",
    ...TASK_ACCESS,
    "workforce-planning",
    ...windowKeysWithDependents("clients", "incidents", "locations", "employees"),
    ...EMPLOYEE_INCIDENT_LINK_WINDOWS,
  ],
  processIds: executiveAccess().processIds,
  reportIds: managerAccess().reportIds,
  taskTypePermissions: managerAccess().taskTypePermissions,
};

export const SEED_ROLES: AppRoleRecord[] = [
  adminRole(ALL_TASK_TYPE_IDS),
  defineRole("role-board", "Board_Member", "Board Member", "Governance oversight — read-focused access", boardAccess()),
  defineRole("role-ceo", "Chief_Executive_Officer", "CEO", "Chief executive — full operational leadership", executiveAccess()),
  defineRole("role-exec-operations", "Operations_Executive", "Operations Executive", "Executive lead for service delivery and rostering", executiveAccess()),
  defineRole("role-exec-hr", "HR_Executive", "HR Executive", "Executive lead for people and culture", executiveAccess()),
  defineRole("role-exec-finance", "Finance_Executive", "CFO", "Chief financial officer", executiveAccess()),
  defineRole("role-exec-ict", "ICT_Executive", "ICT Executive", "Executive lead for systems and technology", executiveAccess()),
  defineRole("role-exec-quality", "Quality_Executive", "Quality Executive", "Executive lead for quality and compliance", executiveAccess()),
  defineRole("role-hr-manager", "HR_Manager", "HR Manager", "HR team leadership", managerAccess()),
  defineRole("role-hr-officer", "HR_Officer", "HR Officer", "HR administration and employee records", officerAccess(["employees", "employee-overview"])),
  defineRole("role-ict-manager", "ICT_Manager", "ICT Manager", "ICT team leadership and system support", managerAccess()),
  defineRole("role-ict-officer", "ICT_Officer", "ICT Officer", "ICT support and administration", officerAccess()),
  defineRole("role-finance-manager", "Finance_Manager", "Finance Manager", "Finance team leadership", managerAccess()),
  defineRole("role-finance-officer", "Finance_Officer", "Finance Officer", "Finance processing and contracts", officerAccess()),
  defineRole("role-quality-manager", "Quality_Manager", "Quality Manager", "Quality and compliance team leadership", managerAccess(["incidents-compliance", "incidents-dashboard"])),
  defineRole("role-quality-officer", "Quality_Officer", "Quality Officer", "Quality audits and compliance tasks", officerAccess(["incidents-compliance"])),
  defineRole("role-rostering-manager", "Rostering_Manager", "Rostering Manager", "Workforce roster planning and allocation", managerAccess()),
  defineRole("role-rostering-officer", "Rostering_Officer", "Rostering Officer", "Roster administration", officerAccess(["workforce-planning"])),
  defineRole("role-intake", "Intake_Coordinator", "Intake Coordinator", "Enquiries and convert-to-client process", INTAKE_ACCESS),
  defineRole("role-coordinator", "Support_Coordinator", "Support Coordinator", "Client records and service catalog", COORDINATOR_ACCESS),
  defineRole("role-team-leader", "Team_Leader", "Team Leader", "Site or team leadership — org structure and frontline oversight", TEAM_LEADER_ACCESS),
  defineRole("role-support-worker", "Support_Worker", "Support Worker", "Frontline staff — assigned tasks, clients, incidents, and rostered locations", supportWorkerAccess()),
];

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
    id: "user-ceo",
    username: "PatriciaChen",
    email: "patricia.chen@abilityerp.local",
    firstName: "Patricia",
    lastName: "Chen",
    phone: "",
    active: true,
    employeeBpId: "emp-ceo",
    notes: "CEO seed login",
    roleIds: ["role-ceo"],
  },
  {
    id: "user-michael",
    username: "MichaelSmith",
    email: "michael.smith@abilityerp.local",
    firstName: "Michael",
    lastName: "Smith",
    phone: "",
    active: true,
    employeeBpId: "emp-michael",
    notes: "Operations executive — accountable manager testing",
    roleIds: ["role-exec-operations"],
  },
  {
    id: "user-piper",
    username: "PiperCollins",
    email: "piper.collins@abilityerp.local",
    firstName: "Piper",
    lastName: "Collins",
    phone: "",
    active: true,
    employeeBpId: "emp-staff-133",
    notes: "Operations manager / team leader hub",
    roleIds: ["role-team-leader"],
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
  {
    id: "user-exec-hr",
    username: "DianeFoster",
    email: "diane.foster@abilityerp.local",
    firstName: "Diane",
    lastName: "Foster",
    phone: "",
    active: true,
    employeeBpId: "emp-exec-hr",
    notes: "HR executive",
    roleIds: ["role-exec-hr"],
  },
  {
    id: "user-exec-finance",
    username: "JamesWhitford",
    email: "james.whitford@abilityerp.local",
    firstName: "James",
    lastName: "Whitford",
    phone: "",
    active: true,
    employeeBpId: "emp-exec-finance",
    notes: "CFO",
    roleIds: ["role-exec-finance"],
  },
  {
    id: "user-exec-ict",
    username: "SamRivera",
    email: "sam.rivera@abilityerp.local",
    firstName: "Sam",
    lastName: "Rivera",
    phone: "",
    active: true,
    employeeBpId: "emp-exec-ict",
    notes: "ICT executive",
    roleIds: ["role-exec-ict"],
  },
  {
    id: "user-exec-quality",
    username: "MargaretHolt",
    email: "margaret.holt@abilityerp.local",
    firstName: "Margaret",
    lastName: "Holt",
    phone: "",
    active: true,
    employeeBpId: "emp-exec-quality",
    notes: "Quality executive",
    roleIds: ["role-exec-quality"],
  },
  {
    id: "user-rostering-mgr",
    username: "RileyShaw",
    email: "riley.shaw@abilityerp.local",
    firstName: "Riley",
    lastName: "Shaw",
    phone: "",
    active: true,
    employeeBpId: "emp-rostering-manager",
    notes: "Rostering manager",
    roleIds: ["role-rostering-manager"],
  },
  ...leadershipUsersFromLinks(),
  ...bulkStaffUserLinks.map((link) => ({
    id: link.userId,
    username: link.username,
    email: `${link.username.toLowerCase()}@abilityerp.local`,
    firstName: link.firstName,
    lastName: link.lastName,
    phone: "",
    active: true,
    employeeBpId: link.employeeId,
    notes: "Bulk seed support worker login",
    roleIds: ["role-support-worker"],
  })),
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

  const windowKeys = sanitizeAppWindowKeys([...new Set([...role.windowKeys, ...seed.windowKeys])]);
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
    role.windowKeys.every((k) => windowKeys.includes(k))
  ) {
    return { ...role, taskTypePermissions, reportIds: role.reportIds ?? reportIds };
  }
  return { ...role, windowKeys, processIds, reportIds, taskTypePermissions };
}
