/**
 * Registered windows (menus / functions) and processes for role-based access.
 * Keys are stored in app_role_window and app_role_process.
 *
 * Dependent windows (parentWindowKey set) are tabs or sub-functions inside a parent
 * window — e.g. Credentials Assigned on Business Partner (Employee).
 */

import {
  CLIENT_DEPENDENT_WINDOWS,
  CONTRACT_DEPENDENT_WINDOWS,
  EMPLOYEE_DEPENDENT_WINDOWS,
  ENQUIRY_DEPENDENT_WINDOWS,
  PRICE_LIST_DEPENDENT_WINDOWS,
  PRODUCT_DEPENDENT_WINDOWS,
  SERVICE_AGREEMENT_DEPENDENT_WINDOWS,
} from "@/lib/access/detail-windows";
import type { AccessProcess, AccessWindow } from "@/lib/access/catalog-types";

export type { AccessProcess, AccessWindow, AccessWindowGroup } from "@/lib/access/catalog-types";

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
    href: "/tasks/assigned-to-me",
    parentWindowKey: "tasks",
    abilityErpName: "Request — Assigned to me",
    showInSidebar: false,
  },
  {
    key: "tasks-for-my-role",
    label: "To my role",
    group: "Core",
    href: "/tasks/my-role",
    parentWindowKey: "tasks",
    abilityErpName: "Request — To my role",
    showInSidebar: false,
  },
  {
    key: "tasks-all",
    label: "All tasks",
    group: "Core",
    href: "/tasks/all",
    parentWindowKey: "tasks",
    abilityErpName: "Request — All",
    showInSidebar: false,
  },
  {
    key: "tasks-past",
    label: "Past",
    group: "Core",
    href: "/tasks/past",
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
    key: "admin-reference-data",
    label: "Reference data",
    group: "Admin",
    href: "/admin/reference-data",
    abilityErpName: "Reference data / System configurator",
    showInSidebar: true,
  },
  {
    key: "admin-users",
    label: "Users",
    group: "Admin",
    href: "/admin/users",
    abilityErpName: "User",
    showInSidebar: true,
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
    href: "/admin/task-management",
    abilityErpName: "Request type / Task management",
    showInSidebar: true,
  },
];

export const ACCESS_WINDOWS: AccessWindow[] = [
  ...PARENT_WINDOWS,
  ...TASK_WINDOWS,
  MODULE_WINDOWS[0],
  ...ENQUIRY_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[1],
  ...CLIENT_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[2],
  ...EMPLOYEE_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[3],
  ...PRODUCT_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[4],
  ...PRICE_LIST_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[5],
  ...SERVICE_AGREEMENT_DEPENDENT_WINDOWS,
  MODULE_WINDOWS[6],
  ...CONTRACT_DEPENDENT_WINDOWS,
  ...MODULE_WINDOWS.slice(7),
];

export const TASK_WINDOW_KEYS = TASK_WINDOWS.map((w) => w.key);

export const ACCESS_PROCESSES: AccessProcess[] = [
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
    id: "assign-task",
    label: "Assign task",
    description: "Create and assign a task on a record (user or role)",
  },
  {
    id: "action-task",
    label: "Action task",
    description: "Start, complete or cancel tasks assigned to you or your role",
  },
];

export const ALL_WINDOW_KEYS = ACCESS_WINDOWS.map((w) => w.key);
export const ALL_PROCESS_IDS = ACCESS_PROCESSES.map((p) => p.id);

export { EMPLOYEE_DEPENDENT_WINDOWS, CLIENT_DEPENDENT_WINDOWS };

export function windowByKey(key: string) {
  return ACCESS_WINDOWS.find((w) => w.key === key);
}

export function processById(id: string) {
  return ACCESS_PROCESSES.find((p) => p.id === id);
}

export function childWindows(parentKey: string) {
  return ACCESS_WINDOWS.filter((w) => w.parentWindowKey === parentKey);
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
    (w) => w.showInSidebar !== false && w.href && canAccessWindow(windowKeys, w.key)
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

/** @deprecated Use detailTabsForRole("employees", windowKeys) */
export function employeeTabsForRole(windowKeys: string[]) {
  return detailTabsForRole("employees", windowKeys);
}

/** @deprecated Use windowKeyForDetailTab("employees", tab) */
export function windowKeyForEmployeeTab(tab: string) {
  return windowKeyForDetailTab("employees", tab);
}
