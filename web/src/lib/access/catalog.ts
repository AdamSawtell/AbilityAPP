/**
 * Registered windows (menus / functions) and processes for role-based access.
 *
 * **Surface rule (required):** each window is `app` or `system`, never both.
 * - `app` — workspace sidebar + role window keys (`app_role_window`).
 * - `system` — System nav only; any signed-in System operator may use it (no role grant).
 *
 * See `web/AGENTS.md` — Window surfaces.
 *
 * Dependent windows (parentWindowKey set) are tabs or sub-functions inside a parent
 * window — e.g. Credentials Assigned on Business Partner (Employee).
 */

import {
  CLIENT_DEPENDENT_WINDOWS,
  CONTRACT_DEPENDENT_WINDOWS,
  EMPLOYEE_DEPENDENT_WINDOWS,
  ENQUIRY_DEPENDENT_WINDOWS,
  INCIDENT_DEPENDENT_WINDOWS,
  INCIDENT_EXTRA_WINDOWS,
  LOCATION_DEPENDENT_WINDOWS,
  PRICE_LIST_DEPENDENT_WINDOWS,
  PRODUCT_DEPENDENT_WINDOWS,
  SERVICE_AGREEMENT_DEPENDENT_WINDOWS,
  SERVICE_BOOKING_DEPENDENT_WINDOWS,
  tabToWindowSlug,
} from "@/lib/access/detail-windows";
import { homePanelAccessWindows } from "@/lib/access/home-panels";
import type { AccessProcess, AccessWindow } from "@/lib/access/catalog-types";

export type { AccessProcess, AccessWindow, AccessWindowGroup, AccessWindowSurface } from "@/lib/access/catalog-types";

const PARENT_WINDOWS: AccessWindow[] = [
  { key: "home", label: "Home", group: "Core", href: "/", showInSidebar: true },
];

const TASK_WINDOWS: AccessWindow[] = [
  {
    key: "tasks",
    label: "Tasks",
    group: "Core",
    abilityErpName: "Request",
    showInSidebar: false,
  },
  {
    key: "tasks-assigned-to-me",
    label: "Assigned to me",
    group: "Core",
    href: "/tasks?scope=assigned-to-me",
    parentWindowKey: "tasks",
    abilityErpName: "Request — Assigned to me",
    showInSidebar: false,
  },
  {
    key: "tasks-for-my-role",
    label: "To my role",
    group: "Core",
    href: "/tasks?scope=my-role",
    parentWindowKey: "tasks",
    abilityErpName: "Request — To my role",
    showInSidebar: false,
  },
  {
    key: "tasks-all",
    label: "All tasks",
    group: "Core",
    href: "/tasks?scope=all",
    parentWindowKey: "tasks",
    abilityErpName: "Request — All",
    showInSidebar: false,
  },
  {
    key: "tasks-past",
    label: "Past",
    group: "Core",
    href: "/tasks?scope=past",
    parentWindowKey: "tasks",
    abilityErpName: "Request — Past",
    showInSidebar: false,
  },
];

const MODULE_WINDOWS: AccessWindow[] = [
  {
    key: "enquiries",
    label: "Enquiries",
    group: "Core",
    href: "/enquiries",
    abilityErpName: "Enquiry",
    showInSidebar: true,
  },
  {
    key: "clients",
    label: "Clients",
    group: "Core",
    href: "/clients",
    abilityErpName: "Support Receiver (BP)",
    showInSidebar: true,
  },
  {
    key: "incidents",
    label: "Incident reports",
    group: "People",
    href: "/incidents",
    abilityErpName: "Incident Report",
    showInSidebar: true,
  },
  {
    key: "locations",
    label: "Locations",
    group: "Locations",
    href: "/locations",
    abilityErpName: "Support Location",
    showInSidebar: true,
  },
  {
    key: "employees",
    label: "Employees",
    group: "People",
    href: "/employees",
    abilityErpName: "Business Partner (Employee)",
    showInSidebar: true,
  },
  {
    key: "products",
    label: "Products",
    group: "Services",
    href: "/products",
    abilityErpName: "Product",
    showInSidebar: true,
  },
  {
    key: "price-lists",
    label: "Price lists",
    group: "Services",
    href: "/price-lists",
    abilityErpName: "Price list",
    showInSidebar: true,
  },
  {
    key: "service-agreements",
    label: "Service agreements",
    group: "Services",
    href: "/service-agreements",
    abilityErpName: "Service agreement",
    showInSidebar: true,
  },
  {
    key: "contracts",
    label: "Contracts",
    group: "Services",
    href: "/contracts",
    abilityErpName: "Contract",
    showInSidebar: true,
  },
  {
    key: "reports",
    label: "Reports",
    group: "Core",
    href: "/reports",
    abilityErpName: "Reports",
    showInSidebar: true,
  },
];

const DELIVERY_WINDOWS: AccessWindow[] = [
  {
    key: "service-bookings",
    label: "Service bookings",
    group: "Delivery",
    href: "/service-bookings",
    abilityErpName: "Service Booking",
    showInSidebar: true,
  },
  {
    key: "service-planning",
    label: "Service planning",
    group: "Delivery",
    href: "/service-planning",
    abilityErpName: "Service planning",
    showInSidebar: true,
  },
  {
    key: "rostering",
    label: "Rostering",
    group: "Delivery",
    href: "/rostering",
    abilityErpName: "Booking Generator",
    showInSidebar: true,
  },
  {
    key: "timesheets",
    label: "Timesheets",
    group: "Delivery",
    href: "/timesheets",
    abilityErpName: "Timesheet",
    showInSidebar: true,
  },
  {
    key: "generate-timesheets",
    label: "Generate timesheets",
    group: "Delivery",
    href: "/generate-timesheets",
    abilityErpName: "Generate Timesheets",
    showInSidebar: true,
  },
  {
    key: "claims",
    label: "Claims",
    group: "Delivery",
    href: "/claims",
    abilityErpName: "Claim",
    showInSidebar: true,
  },
  {
    key: "generate-claims",
    label: "Generate claims",
    group: "Delivery",
    href: "/generate-claims",
    abilityErpName: "Generate Claims",
    showInSidebar: true,
  },
  {
    key: "invoices",
    label: "Invoices",
    group: "Delivery",
    href: "/invoices",
    abilityErpName: "Invoice",
    showInSidebar: true,
  },
  {
    key: "generate-invoices",
    label: "Generate invoices",
    group: "Delivery",
    href: "/generate-invoices",
    abilityErpName: "Generate Invoices",
    showInSidebar: true,
  },
];

const WORKFORCE_WINDOWS: AccessWindow[] = [
  {
    key: "workforce-planning",
    label: "Workforce planning",
    group: "Workforce planning",
    href: "/workforce-planning",
    abilityErpName: "Workforce planning",
    showInSidebar: true,
  },
  {
    key: "workforce-organisation",
    label: "Organisation structure",
    group: "Workforce planning",
    href: "/workforce-planning/organisation",
    parentWindowKey: "workforce-planning",
    abilityErpName: "Organisation structure",
    showInSidebar: true,
  },
  {
    key: "workforce-org-edit",
    label: "Edit organisation structure",
    group: "Workforce planning",
    parentWindowKey: "workforce-organisation",
    abilityErpName: "Organisation structure — edit",
    showInSidebar: false,
  },
  {
    key: "workforce-org-chart-tier",
    label: "Edit org chart tiers",
    group: "Workforce planning",
    parentWindowKey: "workforce-organisation",
    abilityErpName: "Organisation structure — chart tiers",
    showInSidebar: false,
  },
];

const MY_WORKPLACE_WINDOWS: AccessWindow[] = [
  {
    key: "my-workplace",
    label: "My workplace",
    group: "My workplace",
    href: "/my",
    abilityErpName: "My workplace",
    showInSidebar: true,
  },
  {
    key: "my-leave",
    label: "My leave",
    group: "My workplace",
    href: "/my/leave",
    parentWindowKey: "my-workplace",
    abilityErpName: "My leave",
    showInSidebar: false,
  },
  {
    key: "my-profile",
    label: "About me",
    group: "My workplace",
    href: "/my/profile",
    parentWindowKey: "my-workplace",
    abilityErpName: "About me",
    showInSidebar: false,
  },
  {
    key: "my-availability",
    label: "My availability",
    group: "My workplace",
    href: "/my/availability",
    parentWindowKey: "my-workplace",
    abilityErpName: "My availability",
    showInSidebar: false,
  },
  {
    key: "my-contracts",
    label: "My contracts",
    group: "My workplace",
    href: "/my/contracts",
    parentWindowKey: "my-workplace",
    abilityErpName: "My contracts",
    showInSidebar: false,
  },
  {
    key: "my-open-shifts",
    label: "Open shifts",
    group: "My workplace",
    href: "/my/open-shifts",
    parentWindowKey: "my-workplace",
    abilityErpName: "Open shifts marketplace",
    showInSidebar: false,
  },
  {
    key: "my-shifts",
    label: "My shifts",
    group: "My workplace",
    href: "/my/shifts",
    parentWindowKey: "my-workplace",
    abilityErpName: "My shifts check-in",
    showInSidebar: false,
  },
  {
    key: "my-credentials",
    label: "My credentials",
    group: "My workplace",
    href: "/my/credentials",
    parentWindowKey: "my-workplace",
    abilityErpName: "My credentials",
    showInSidebar: false,
  },
];

const REPORT_WINDOWS: AccessWindow[] = [
  {
    key: "reports-advance",
    label: "Reports Advance",
    group: "Core",
    surface: "system",
    parentWindowKey: "reports",
    href: "/system/admin/reports-advance",
    abilityErpName: "Reports — SQL console",
    showInSidebar: false,
  },
];

const ADMIN_WINDOWS: AccessWindow[] = [
  {
    key: "admin-organization",
    label: "Organisation",
    group: "Admin",
    href: "/admin/organization",
    abilityErpName: "Client Organization",
    showInSidebar: false,
  },
  {
    key: "admin-reference-data",
    label: "Reference data",
    group: "Admin",
    href: "/admin/reference-data",
    abilityErpName: "Reference data / System configurator",
    showInSidebar: false,
  },
  {
    key: "admin-roles",
    label: "Roles",
    group: "Admin",
    href: "/admin/roles",
    abilityErpName: "Role",
    showInSidebar: true,
  },
  {
    key: "admin-task-management",
    label: "Task management",
    group: "Admin",
    surface: "system",
    href: "/system/admin/task-management",
    abilityErpName: "Request type / Task management",
    showInSidebar: true,
  },
  {
    key: "admin-task-automations",
    label: "Task automations",
    group: "Admin",
    surface: "system",
    href: "/system/admin/task-automations",
    abilityErpName: "Task automation rules",
    showInSidebar: true,
  },
  {
    key: "admin-user-session-audit",
    label: "User Session Audit",
    group: "Admin",
    surface: "system",
    href: "/system/admin/user-session-audit",
    abilityErpName: "User Session Audit",
    showInSidebar: true,
  },
  {
    key: "admin-process-audit",
    label: "Process Audit",
    group: "Admin",
    surface: "system",
    href: "/system/admin/process-audit",
    abilityErpName: "Process Audit",
    showInSidebar: true,
  },
  {
    key: "admin-ai-query-audit",
    label: "AI Query Audit",
    group: "Admin",
    surface: "system",
    href: "/system/admin/ai-query-audit",
    abilityErpName: "AI Query Audit",
    showInSidebar: true,
  },
  {
    key: "system-time-and-date",
    label: "Time & date",
    group: "Admin",
    surface: "system",
    href: "/system/settings/time-and-date",
    abilityErpName: "Time & date",
    showInSidebar: false,
  },
  {
    key: "admin-record-retention",
    label: "Record retention settings",
    group: "Admin",
    surface: "system",
    href: "/system/settings/record-retention",
    abilityErpName: "Record retention settings",
    showInSidebar: false,
  },
  {
    key: "admin-ai-agents",
    label: "AI assistants",
    group: "Admin",
    href: "/admin/ai-agents",
    abilityErpName: "AI assistants",
    showInSidebar: false,
  },
];

export const ACCESS_WINDOWS: AccessWindow[] = [
  ...PARENT_WINDOWS,
  ...homePanelAccessWindows(),
  ...TASK_WINDOWS,
  MODULE_WINDOWS[0],
  ...ENQUIRY_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[1],
  ...CLIENT_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[2],
  ...INCIDENT_DEPENDENT_WINDOWS,
  ...INCIDENT_EXTRA_WINDOWS,
  MODULE_WINDOWS[3],
  ...LOCATION_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[4],
  ...EMPLOYEE_DEPENDENT_WINDOWS,
  ...WORKFORCE_WINDOWS,
  ...MY_WORKPLACE_WINDOWS,
  MODULE_WINDOWS[5],
  ...PRODUCT_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[6],
  ...PRICE_LIST_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[7],
  ...SERVICE_AGREEMENT_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[8],
  ...CONTRACT_DEPENDENT_WINDOWS,
  ...DELIVERY_WINDOWS,
  ...SERVICE_BOOKING_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[9],
  ...REPORT_WINDOWS,
  ...ADMIN_WINDOWS,
];

export const TASK_WINDOW_KEYS = TASK_WINDOWS.map((w) => w.key);

export const ACCESS_PROCESSES: AccessProcess[] = [
  {
    id: "ai-prepare-record",
    label: "AI prepare record",
    description: "Assistant prepares a draft for human review and save on a form",
  },
  {
    id: "enquiry-to-client",
    label: "Enquiry → Client",
    description: "Convert an enquiry to a support receiver client",
  },
  {
    id: "assign-employee-credential",
    label: "Assign employee credential",
    description: "Add or update credentials assigned on an employee record",
    parentWindowKey: "employee-credentials-assigned",
  },
  {
    id: "assign-location-client",
    label: "Assign client to location",
    description: "Link support receivers to a support location",
    parentWindowKey: "location-clients",
  },
  {
    id: "assign-location-employee",
    label: "Assign employee to location",
    description: "Link staff to a support location",
    parentWindowKey: "location-employees",
  },
  {
    id: "assign-location-product",
    label: "Assign product to location",
    description: "Link products and services offered at a support location",
    parentWindowKey: "location-products-and-services",
  },
  {
    id: "report-incident",
    label: "Report incident",
    description: "Create and submit an incident report with linked parties and evidence",
    parentWindowKey: "incidents",
  },
  {
    id: "notify-ndis-reportable",
    label: "Notify NDIS Commission",
    description: "Record NDIS reportable incident notification within required timeframes",
    parentWindowKey: "incidents",
  },
  {
    id: "assign-task",
    label: "Assign task",
    description: "Create and assign a task on a record (user or role)",
  },
  {
    id: "action-task",
    label: "Action task",
    description: "Start, complete or cancel tasks assigned to you or your role",
  },
  {
    id: "submit-leave-request",
    label: "Submit leave request",
    description: "Staff submit leave for manager approval",
    parentWindowKey: "my-leave",
  },
  {
    id: "submit-employee-credential",
    label: "Submit credential",
    description: "Staff submit credentials with evidence for HR review and sign-off",
    parentWindowKey: "my-credentials",
  },
  {
    id: "submit-leave-on-behalf",
    label: "Submit leave on behalf",
    description: "Managers and rostering staff submit leave for an employee from workforce planning",
    parentWindowKey: "workforce-planning",
  },
  {
    id: "review-employee-credential",
    label: "Review employee credential",
    description: "HR reviews staff-submitted credentials and signs off or rejects with feedback",
    parentWindowKey: "workforce-planning",
  },
  {
    id: "approve-leave-request",
    label: "Approve leave request",
    description: "Managers and HR approve or decline pending leave requests",
    parentWindowKey: "workforce-planning",
  },
  {
    id: "manage-session-audit-risk",
    label: "Investigate session risk",
    description: "Review flagged sessions, update risk status, and add investigation notes",
    parentWindowKey: "admin-user-session-audit",
  },
  {
    id: "view-session-sensitive-session-data",
    label: "View sensitive session data",
    description: "View IP address, device information, and user agent in session audit",
    parentWindowKey: "admin-user-session-audit",
  },
  {
    id: "manage-process-audit-risk",
    label: "Investigate process risk",
    description: "Review flagged process executions, update risk status, and add investigation notes",
    parentWindowKey: "admin-process-audit",
  },
  {
    id: "view-process-audit-sensitive",
    label: "View sensitive process data",
    description: "View IP address, device information, and user agent in process audit",
    parentWindowKey: "admin-process-audit",
  },
  {
    id: "manage-ai-query-audit-risk",
    label: "Investigate AI query risk",
    description: "Review flagged AI queries, update risk status, and add investigation notes",
    parentWindowKey: "admin-ai-query-audit",
  },
  {
    id: "view-ai-query-audit-sensitive",
    label: "View sensitive AI query data",
    description: "View full query text, IP address, and device information in AI query audit",
    parentWindowKey: "admin-ai-query-audit",
  },
  {
    id: "manage-retention-settings",
    label: "Manage retention settings",
    description: "Configure record retention policies and session security settings",
    parentWindowKey: "admin-record-retention",
  },
];

export const MY_WORKPLACE_WINDOW_KEYS = MY_WORKPLACE_WINDOWS.map((w) => w.key);

export const ALL_WINDOW_KEYS = ACCESS_WINDOWS.map((w) => w.key);

/** Windows assignable via workspace roles — excludes System-surface windows. */
export const APP_WINDOW_KEYS = ACCESS_WINDOWS.filter((w) => w.surface !== "system").map((w) => w.key);

export const SYSTEM_SURFACE_WINDOW_KEYS = ACCESS_WINDOWS.filter((w) => w.surface === "system").map((w) => w.key);

export function windowSurface(key: string): "app" | "system" {
  return windowByKey(key)?.surface ?? "app";
}

export function isSystemSurfaceWindow(key: string): boolean {
  return windowSurface(key) === "system";
}

export function appRoleWindows() {
  return ACCESS_WINDOWS.filter((w) => w.surface !== "system");
}

export function sanitizeAppWindowKeys(windowKeys: string[]): string[] {
  return windowKeys.filter((key) => !isSystemSurfaceWindow(key));
}

export const ALL_PROCESS_IDS = ACCESS_PROCESSES.map((p) => p.id);

export { EMPLOYEE_DEPENDENT_WINDOWS, CLIENT_DEPENDENT_WINDOWS, LOCATION_DEPENDENT_WINDOWS };

export function windowByKey(key: string) {
  return ACCESS_WINDOWS.find((w) => w.key === key);
}

export function processById(id: string) {
  return ACCESS_PROCESSES.find((p) => p.id === id);
}

export function childWindows(parentKey: string) {
  return ACCESS_WINDOWS.filter((w) => w.parentWindowKey === parentKey);
}

export function appChildWindows(parentKey: string) {
  return childWindows(parentKey).filter((w) => w.surface !== "system");
}

/** True when the role grants the window and any required parent window. */
export function canAccessWindow(windowKeys: string[], key: string): boolean {
  if (!windowKeys.includes(key)) return false;
  const win = windowByKey(key);
  if (win?.parentWindowKey && !windowKeys.includes(win.parentWindowKey)) return false;
  return true;
}

export function sidebarWindows(windowKeys: string[]) {
  return ACCESS_WINDOWS.filter(
    (w) =>
      w.surface !== "system" &&
      w.showInSidebar !== false &&
      w.href &&
      canAccessWindow(windowKeys, w.key)
  );
}

export function detailTabsForRole(parentWindowKey: string, windowKeys: string[]): string[] {
  if (!canAccessWindow(windowKeys, parentWindowKey)) return [];
  return childWindows(parentWindowKey)
    .filter((w) => w.detailTab && canAccessWindow(windowKeys, w.key))
    .map((w) => w.detailTab!);
}

export function windowKeyForDetailTab(parentWindowKey: string, tab: string) {
  return childWindows(parentWindowKey).find((w) => w.detailTab === tab)?.key;
}

const DETAIL_TAB_KEY_PREFIX: Record<string, string> = {
  clients: "client",
  employees: "employee",
  locations: "location",
  enquiries: "enquiry",
  incidents: "incident",
};

const DETAIL_TAB_KEY_OVERRIDES: Record<string, Record<string, string>> = {
  employees: {
    Address: "employee-locations",
    "Skills & languages": "employee-skills",
  },
  locations: {
    "Contact & address": "location-contact-and-address",
    "Products & services": "location-products-and-services",
  },
};

/** Catalog key for a detail tab, with naming-convention fallback when the catalog is stale. */
export function resolveDetailWindowKey(parentWindowKey: string, tab: string): string | undefined {
  const fromCatalog = windowKeyForDetailTab(parentWindowKey, tab);
  if (fromCatalog) return fromCatalog;
  const prefix = DETAIL_TAB_KEY_PREFIX[parentWindowKey];
  if (!prefix) return undefined;
  const overrides = DETAIL_TAB_KEY_OVERRIDES[parentWindowKey];
  return overrides?.[tab] ?? `${prefix}-${tabToWindowSlug(tab)}`;
}

/** Tab list in UI group order, gated by role window keys (resilient to catalog/session drift). */
export function allowedDetailTabsFromGroups(
  parentWindowKey: string,
  tabGroups: readonly { tabs: readonly string[] }[],
  windowKeys: string[]
): string[] {
  if (!canAccessWindow(windowKeys, parentWindowKey)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      if (seen.has(tab)) continue;
      seen.add(tab);
      const key = resolveDetailWindowKey(parentWindowKey, tab);
      if (key && canAccessWindow(windowKeys, key)) out.push(tab);
    }
  }
  return out;
}

/** @deprecated Use detailTabsForRole("employees", windowKeys) */
export function employeeTabsForRole(windowKeys: string[]) {
  return detailTabsForRole("employees", windowKeys);
}

/** @deprecated Use windowKeyForDetailTab("employees", tab) */
export function windowKeyForEmployeeTab(tab: string) {
  return windowKeyForDetailTab("employees", tab);
}
