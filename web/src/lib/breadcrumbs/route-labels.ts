import { ACCESS_WINDOWS } from "@/lib/access/catalog";
import { ACCESS_REPORTS } from "@/lib/reports/catalog";
import { SYSTEM_HOME_LINKS, SYSTEM_NAV_SECTIONS } from "@/lib/system/nav";

/** Normalise href/path for breadcrumb lookup (no query, no trailing slash). */
export function normalizeBreadcrumbPath(pathOrHref: string): string {
  const withoutQuery = pathOrHref.split("?")[0] ?? pathOrHref;
  if (withoutQuery === "" || withoutQuery === "/") return "/";
  return withoutQuery.replace(/\/+$/, "");
}

const MANUAL_ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/help": "How-to guide",
  "/system": "System",
  "/system/guides": "How-to guide",
  "/system/reference-data": "Reference data",
  "/system/login": "Sign in",
  "/admin": "Admin",
  "/incidents/dashboard": "Dashboard",
  "/incidents/compliance": "Compliance",
  "/tasks/all": "All tasks",
  "/tasks/past": "Past",
  "/tasks/my-role": "To my role",
  "/tasks/assigned-to-me": "Assigned to me",
  "/workforce-planning/organisation": "Organisation structure",
  "/workforce-planning/training": "Training and meetings",
  "/reports/advance": "Advance",
  "/agency-portal": "Agency portal",
  "/portal": "Participant portal",
  "/login": "Sign in",
};

const STATIC_SEGMENT_LABELS: Record<string, string> = {
  new: "New",
  dashboard: "Dashboard",
  compliance: "Compliance",
  advance: "Advance",
  organisation: "Organisation structure",
  training: "Training and meetings",
  login: "Sign in",
  guides: "How-to guide",
  setup: "Module setup",
  budget: "Budget",
  services: "Services",
  requests: "Requests",
  help: "Help",
  profile: "About me",
};

/** Parent path segment → entity list module key for dynamic ID resolution. */
export const ENTITY_LIST_SEGMENTS = new Set([
  "clients",
  "employees",
  "locations",
  "incidents",
  "enquiries",
  "business-partners",
  "agency-workers",
  "contracts",
  "service-bookings",
  "service-agreements",
  "service-planning",
  "products",
  "price-lists",
  "invoices",
  "claims",
  "timesheets",
  "agency-timesheets",
  "vendor-invoices",
  "board-reporting",
  "fleet",
  "maintenance",
  "tasks",
  "reports",
]);

/** Sub-routes under a module that are not record IDs. */
const RESERVED_ENTITY_SUBROUTES: Record<string, Set<string>> = {
  incidents: new Set(["new", "dashboard", "compliance"]),
  tasks: new Set(["new", "all", "past", "my-role", "assigned-to-me"]),
  fleet: new Set(["new"]),
  locations: new Set(["new"]),
  employees: new Set(["new"]),
  clients: new Set(["new"]),
  enquiries: new Set(["new"]),
  contracts: new Set(["new"]),
  "business-partners": new Set(["new"]),
  "agency-workers": new Set(["new"]),
  "service-bookings": new Set(["new"]),
  maintenance: new Set(["new"]),
  "board-reporting": new Set(["new"]),
  reports: new Set(["advance"]),
};

let cachedRouteLabels: ReadonlyMap<string, string> | null = null;

export function buildRouteLabelMap(): ReadonlyMap<string, string> {
  if (cachedRouteLabels) return cachedRouteLabels;

  const map = new Map<string, string>();

  function add(pathOrHref: string, label: string) {
    const path = normalizeBreadcrumbPath(pathOrHref);
    if (!map.has(path)) map.set(path, label);
  }

  for (const [path, label] of Object.entries(MANUAL_ROUTE_LABELS)) {
    add(path, label);
  }

  for (const window of ACCESS_WINDOWS) {
    if (window.href) add(window.href, window.label);
  }

  for (const link of SYSTEM_HOME_LINKS) {
    if (link.href) add(link.href, link.title);
  }

  for (const section of SYSTEM_NAV_SECTIONS) {
    for (const link of section.links) {
      if (link.href) add(link.href, link.label);
    }
  }

  for (const report of ACCESS_REPORTS) {
    add(`/reports/${report.id}`, report.label);
  }

  cachedRouteLabels = map;
  return map;
}

export function labelForPath(path: string, routeLabels: ReadonlyMap<string, string>): string | undefined {
  return routeLabels.get(normalizeBreadcrumbPath(path));
}

export function labelForStaticSegment(segment: string): string | undefined {
  return STATIC_SEGMENT_LABELS[segment];
}

export function isEntityIdSegment(parentSegment: string, segment: string): boolean {
  if (!ENTITY_LIST_SEGMENTS.has(parentSegment)) return false;
  const reserved = RESERVED_ENTITY_SUBROUTES[parentSegment];
  if (reserved?.has(segment)) return false;
  if (segment === "new") return false;
  return true;
}


export function humanizeSegment(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function taskScopeLabel(scope: string | null | undefined): string | undefined {
  if (!scope) return undefined;
  const map: Record<string, string> = {
    "assigned-to-me": "Assigned to me",
    "my-role": "To my role",
    all: "All tasks",
    past: "Past",
  };
  return map[scope];
}
