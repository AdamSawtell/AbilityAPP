/**
 * Registered windows (menus / functions) and processes for role-based access.
 * Keys are stored in app_role_window and app_role_process.
 */

export type AccessWindow = {
  key: string;
  label: string;
  group: "Core" | "Services" | "Admin";
  href: string;
  abilityErpName?: string;
};

export type AccessProcess = {
  id: string;
  label: string;
  description: string;
};

export const ACCESS_WINDOWS: AccessWindow[] = [
  { key: "home", label: "Home", group: "Core", href: "/" },
  {
    key: "enquiries",
    label: "Enquiries",
    group: "Core",
    href: "/enquiries",
    abilityErpName: "Enquiry",
  },
  {
    key: "clients",
    label: "Clients",
    group: "Core",
    href: "/clients",
    abilityErpName: "Support Receiver (BP)",
  },
  { key: "products", label: "Products", group: "Services", href: "/products", abilityErpName: "Product" },
  {
    key: "price-lists",
    label: "Price lists",
    group: "Services",
    href: "/price-lists",
    abilityErpName: "Price list",
  },
  {
    key: "service-agreements",
    label: "Service agreements",
    group: "Services",
    href: "/service-agreements",
    abilityErpName: "Service agreement",
  },
  {
    key: "contracts",
    label: "Contracts",
    group: "Services",
    href: "/contracts",
    abilityErpName: "Contract",
  },
  {
    key: "admin-reference-data",
    label: "Reference data",
    group: "Admin",
    href: "/admin/reference-data",
    abilityErpName: "Reference data / System configurator",
  },
  {
    key: "admin-users",
    label: "Users",
    group: "Admin",
    href: "/admin/users",
    abilityErpName: "User",
  },
  {
    key: "admin-roles",
    label: "Roles",
    group: "Admin",
    href: "/admin/roles",
    abilityErpName: "Role",
  },
];

export const ACCESS_PROCESSES: AccessProcess[] = [
  {
    id: "enquiry-to-client",
    label: "Enquiry → Client",
    description: "Convert an enquiry to a support receiver client",
  },
];

export const ALL_WINDOW_KEYS = ACCESS_WINDOWS.map((w) => w.key);
export const ALL_PROCESS_IDS = ACCESS_PROCESSES.map((p) => p.id);

export function windowByKey(key: string) {
  return ACCESS_WINDOWS.find((w) => w.key === key);
}

export function processById(id: string) {
  return ACCESS_PROCESSES.find((p) => p.id === id);
}
