/**
 * Registered windows (menus / functions) and processes for role-based access.
 * Keys are stored in app_role_window and app_role_process.
 *
 * Dependent windows (parentWindowKey set) are tabs or sub-functions inside a parent
 * window — e.g. Credentials Assigned on Business Partner (Employee).
 */

export type AccessWindowGroup = "Core" | "People" | "Services" | "Admin";

export type AccessWindow = {
  key: string;
  label: string;
  group: AccessWindowGroup;
  /** Sidebar route; omit for tab-only dependent windows */
  href?: string;
  abilityErpName?: string;
  /** Parent window required for access (AbilityERP dependent window) */
  parentWindowKey?: string;
  /** Employee detail tab label when this window maps to a tab */
  employeeTab?: string;
  /** False for dependent tab windows — they do not appear in the main sidebar */
  showInSidebar?: boolean;
};

export type AccessProcess = {
  id: string;
  label: string;
  description: string;
  /** Optional parent window for process visibility */
  parentWindowKey?: string;
};

export const ACCESS_WINDOWS: AccessWindow[] = [
  { key: "home", label: "Home", group: "Core", href: "/", showInSidebar: true },
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
  // --- Employee dependent windows (tabs on BP Employee) ---
  {
    key: "employee-overview",
    label: "Overview",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Overview",
    abilityErpName: "Business Partner (Employee) — Overview",
    showInSidebar: false,
  },
  {
    key: "employee-contact",
    label: "Contact",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Contact",
    abilityErpName: "Business Partner (Employee) — Contact",
    showInSidebar: false,
  },
  {
    key: "employee-employment",
    label: "Employment",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Employment",
    abilityErpName: "Business Partner (Employee) — Employment",
    showInSidebar: false,
  },
  {
    key: "employee-credentials-assigned",
    label: "Credentials Assigned",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Credentials Assigned",
    abilityErpName: "Credentials Assigned",
    showInSidebar: false,
  },
  {
    key: "employee-locations",
    label: "Address",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Address",
    abilityErpName: "Business Partner (Employee) — Location",
    showInSidebar: false,
  },
  {
    key: "employee-emergency-contacts",
    label: "Emergency contacts",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Emergency contacts",
    abilityErpName: "Emergency contacts",
    showInSidebar: false,
  },
  {
    key: "employee-work-rights",
    label: "Work rights",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Work rights",
    abilityErpName: "Work rights",
    showInSidebar: false,
  },
  {
    key: "employee-payroll",
    label: "Payroll",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Payroll",
    abilityErpName: "Payroll / bank",
    showInSidebar: false,
  },
  {
    key: "employee-leave",
    label: "Leave",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Leave",
    abilityErpName: "Leave entitlements",
    showInSidebar: false,
  },
  {
    key: "employee-alerts",
    label: "Alerts",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Alerts",
    abilityErpName: "Employee alerts",
    showInSidebar: false,
  },
  {
    key: "employee-documents",
    label: "Documents",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Documents",
    abilityErpName: "HR documents",
    showInSidebar: false,
  },
  {
    key: "employee-activity",
    label: "Activity",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Activity",
    abilityErpName: "Employee activity",
    showInSidebar: false,
  },
  {
    key: "employee-skills",
    label: "Skills & languages",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "Skills & languages",
    abilityErpName: "Skills & languages",
    showInSidebar: false,
  },
  {
    key: "employee-system-access",
    label: "System access",
    group: "People",
    parentWindowKey: "employees",
    employeeTab: "System access",
    abilityErpName: "User / Role link",
    showInSidebar: false,
  },
  // --- Services ---
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
];

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
];

export const ALL_WINDOW_KEYS = ACCESS_WINDOWS.map((w) => w.key);
export const ALL_PROCESS_IDS = ACCESS_PROCESSES.map((p) => p.id);

export const EMPLOYEE_DEPENDENT_WINDOWS = ACCESS_WINDOWS.filter((w) => w.parentWindowKey === "employees");

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

export function employeeTabsForRole(windowKeys: string[]) {
  if (!canAccessWindow(windowKeys, "employees")) return [];
  return EMPLOYEE_DEPENDENT_WINDOWS.filter((w) => w.employeeTab && canAccessWindow(windowKeys, w.key)).map(
    (w) => w.employeeTab!
  );
}

export function windowKeyForEmployeeTab(tab: string) {
  return EMPLOYEE_DEPENDENT_WINDOWS.find((w) => w.employeeTab === tab)?.key;
}
