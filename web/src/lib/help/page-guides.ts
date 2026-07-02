import { HELP_ARTICLES } from "@/lib/help/articles";
import type { HelpArticle } from "@/lib/help/types";

export type PageGuideSurface = "app" | "system";

export type ResolvedPageGuide = {
  href: string;
  title: string;
  summary: string;
  surface: PageGuideSurface;
  slug: string;
};

/** System setup section → guide slug (must exist in HELP_ARTICLES). */
const SETUP_SECTION_GUIDE_SLUG: Record<string, string> = {
  organisation: "organisation-setup",
  tasks: "task-setup",
  enquiries: "enquiries-setup",
  clients: "clients-setup",
  locations: "locations-setup",
  people: "people-setup",
  workforce: "workforce-setup",
  incidents: "incidents-setup",
  services: "services-setup",
  reports: "reports-setup",
  ai: "ai-assistants-setup",
  integrations: "core-system-setup",
  admin: "roles-and-access",
};

/** Reference data section → guide slug. */
const REFERENCE_DATA_GUIDE_SLUG: Record<string, string> = {
  admin: "reference-data",
  organisation: "organisation-setup",
  tasks: "task-setup",
  enquiries: "enquiries-setup",
  clients: "clients-setup",
  locations: "locations-setup",
  people: "people-setup",
  workforce: "workforce-setup",
  incidents: "incidents-setup",
  services: "services-setup",
  reports: "reports-setup",
  ai: "ai-assistants-setup",
  integrations: "core-system-setup",
};

type RouteGuideRule = {
  prefix: string;
  slug: string;
  surface: PageGuideSurface;
};

/**
 * Longest-prefix wins. Keep specific paths above their parents.
 * Every AppShell / SystemShell route should match a rule or SETUP/REF maps.
 */
const ROUTE_GUIDE_RULES: RouteGuideRule[] = [
  // System — specific admin setup
  { prefix: "/system/services/price-update-review", slug: "price-update-review", surface: "system" },
  { prefix: "/system/services/ndis-price-importer", slug: "ndis-price-importer", surface: "system" },
  { prefix: "/system/admin/user-session-audit", slug: "user-session-audit", surface: "system" },
  { prefix: "/system/admin/process-audit", slug: "process-audit", surface: "system" },
  { prefix: "/system/admin/ai-query-audit", slug: "ai-query-audit", surface: "system" },
  { prefix: "/system/settings/time-and-date", slug: "time-and-date", surface: "system" },
  { prefix: "/system/settings/leave", slug: "workforce-setup", surface: "system" },
  { prefix: "/system/settings/shift-monitoring", slug: "workforce-setup", surface: "system" },
  { prefix: "/system/settings/availability", slug: "workforce-setup", surface: "system" },
  { prefix: "/system/settings/incident-management", slug: "incidents-setup", surface: "system" },
  { prefix: "/system/settings/buddy-shifts", slug: "delivery", surface: "system" },
  { prefix: "/system/settings/record-retention", slug: "record-retention", surface: "system" },
  { prefix: "/system/admin/task-automations", slug: "task-automations", surface: "system" },
  { prefix: "/system/admin/document-templates", slug: "document-templates", surface: "system" },
  { prefix: "/system/admin/document-email", slug: "document-templates", surface: "system" },
  { prefix: "/system/admin/document-registry", slug: "document-templates", surface: "system" },
  { prefix: "/system/admin/task-management", slug: "task-setup", surface: "system" },
  { prefix: "/system/admin/reports-advance", slug: "reports-setup", surface: "system" },
  { prefix: "/system/admin/organisation-structure", slug: "workforce-organisation", surface: "app" },
  { prefix: "/system/admin/roles", slug: "roles-and-access", surface: "system" },
  { prefix: "/system/tasks/task-automations", slug: "task-automations", surface: "system" },
  { prefix: "/system/tasks/task-management", slug: "task-setup", surface: "system" },
  { prefix: "/system/ai/assistants", slug: "ai-assistants-setup", surface: "system" },
  { prefix: "/system/org-chart-tiers", slug: "organisation-setup", surface: "system" },
  { prefix: "/fleet", slug: "fleet", surface: "app" },
  { prefix: "/maintenance", slug: "maintenance", surface: "app" },
  { prefix: "/system/organization", slug: "organisation-setup", surface: "system" },
  { prefix: "/system/reference-data", slug: "reference-data", surface: "system" },
  { prefix: "/system", slug: "core-system-setup", surface: "system" },

  // App — my workplace
  { prefix: "/my/open-shifts", slug: "my-workplace", surface: "app" },
  { prefix: "/system/reports/mobile-sync", slug: "employee-mobile", surface: "system" },
  { prefix: "/m/login", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/credentials", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/profile", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/more", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/notifications", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/availability", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/leave", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/services", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/open-shifts", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/messages", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/install", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/id", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/tasks", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/timesheets", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/schedule", slug: "employee-mobile", surface: "app" },
  { prefix: "/m/today", slug: "employee-mobile", surface: "app" },
  { prefix: "/m", slug: "employee-mobile", surface: "app" },
  { prefix: "/my/shifts", slug: "my-workplace", surface: "app" },
  { prefix: "/my/credentials", slug: "my-workplace", surface: "app" },
  { prefix: "/my/contracts", slug: "my-workplace", surface: "app" },
  { prefix: "/my/availability", slug: "my-workplace", surface: "app" },
  { prefix: "/my/profile", slug: "my-workplace", surface: "app" },
  { prefix: "/my/leave", slug: "my-workplace", surface: "app" },
  { prefix: "/my", slug: "my-workplace", surface: "app" },

  // App — participant portal
  { prefix: "/portal/help", slug: "participant-portal-guide", surface: "app" },
  { prefix: "/portal/requests", slug: "participant-portal-guide", surface: "app" },
  { prefix: "/portal/services", slug: "participant-portal-guide", surface: "app" },
  { prefix: "/portal/budget", slug: "participant-portal-guide", surface: "app" },
  { prefix: "/portal", slug: "participant-portal-guide", surface: "app" },
  // App — agency vendor portal
  { prefix: "/agency-portal/help", slug: "agency-vendor-portal", surface: "app" },
  { prefix: "/agency-portal/requests", slug: "agency-vendor-portal", surface: "app" },
  { prefix: "/agency-portal/timesheets", slug: "agency-vendor-portal", surface: "app" },
  { prefix: "/agency-portal/invoices", slug: "agency-vendor-portal", surface: "app" },
  { prefix: "/agency-portal", slug: "agency-vendor-portal", surface: "app" },
  { prefix: "/vendor-invoices", slug: "finance", surface: "app" },

  // App — workforce & admin
  { prefix: "/workforce-planning/training", slug: "training-meetings", surface: "app" },
  { prefix: "/workforce-planning/organisation", slug: "workforce-organisation", surface: "app" },
  { prefix: "/workforce-planning", slug: "workforce-leave-calendar", surface: "app" },
  { prefix: "/system/settings/security", slug: "security-settings", surface: "system" },
  { prefix: "/admin/security", slug: "security-settings", surface: "system" },
  { prefix: "/admin/roles", slug: "roles-and-access", surface: "app" },
  { prefix: "/admin/communications", slug: "admin-communications", surface: "app" },
  { prefix: "/admin/reference-data", slug: "reference-data", surface: "system" },
  { prefix: "/admin/pay-periods", slug: "workforce-organisation", surface: "app" },
  { prefix: "/admin/organization", slug: "organisation-setup", surface: "system" },
  { prefix: "/admin/task-automations", slug: "task-automations", surface: "system" },
  { prefix: "/admin/task-management", slug: "task-setup", surface: "system" },
  { prefix: "/admin/ai-agents", slug: "ai-assistants-setup", surface: "system" },
  { prefix: "/admin/users", slug: "employees", surface: "app" },

  // App — modules
  { prefix: "/tasks", slug: "tasks", surface: "app" },
  { prefix: "/enquiries", slug: "enquiries", surface: "app" },
  { prefix: "/clients", slug: "clients", surface: "app" },
  { prefix: "/incidents/compliance", slug: "incident-reports", surface: "app" },
  { prefix: "/incidents/dashboard", slug: "incident-reports", surface: "app" },
  { prefix: "/incidents", slug: "incident-reports", surface: "app" },
  { prefix: "/complaints", slug: "complaints-feedback", surface: "app" },
  { prefix: "/locations", slug: "locations", surface: "app" },
  { prefix: "/employees", slug: "employees", surface: "app" },
  { prefix: "/agency-workers", slug: "agency-workers", surface: "app" },
  { prefix: "/agency-timesheets", slug: "agency-workers", surface: "app" },
  { prefix: "/generate-agency-timesheets", slug: "agency-workers", surface: "app" },
  { prefix: "/business-partners", slug: "business-partners", surface: "app" },
  { prefix: "/products", slug: "services", surface: "app" },
  { prefix: "/price-lists", slug: "services", surface: "app" },
  { prefix: "/contracts", slug: "services", surface: "app" },
  { prefix: "/service-agreements", slug: "services", surface: "app" },
  { prefix: "/service-bookings/new", slug: "delivery", surface: "app" },
  { prefix: "/service-bookings", slug: "delivery", surface: "app" },
  { prefix: "/generate-timesheets", slug: "delivery", surface: "app" },
  { prefix: "/ndis-audit-pack", slug: "delivery", surface: "app" },
  { prefix: "/financial-close", slug: "finance", surface: "app" },
  { prefix: "/board-reporting", slug: "delivery", surface: "app" },
  { prefix: "/invoice-reconciliation", slug: "finance", surface: "app" },
  { prefix: "/multi-provider-budget", slug: "service-planning", surface: "app" },
  { prefix: "/my/timesheets", slug: "my-workplace", surface: "app" },
  { prefix: "/claim-reconciliation", slug: "finance", surface: "app" },
  { prefix: "/generate-claims", slug: "finance", surface: "app" },
  { prefix: "/claims", slug: "finance", surface: "app" },
  { prefix: "/generate-invoices", slug: "finance", surface: "app" },
  { prefix: "/invoices", slug: "finance", surface: "app" },
  { prefix: "/plan-reconciliation", slug: "finance", surface: "app" },
  { prefix: "/service-planning", slug: "service-planning", surface: "app" },
  { prefix: "/timesheets", slug: "delivery", surface: "app" },
  { prefix: "/timesheet-approval", slug: "delivery", surface: "app" },
  { prefix: "/rostering", slug: "delivery", surface: "app" },
  { prefix: "/reports/advance", slug: "reports-setup", surface: "system" },
  { prefix: "/reports", slug: "reports", surface: "app" },
  { prefix: "/", slug: "home-dashboard", surface: "app" },
].sort((a, b) => b.prefix.length - a.prefix.length) as RouteGuideRule[];

const EXCLUDED_PATH_PREFIXES = [
  "/login",
  "/help",
  "/system/login",
  "/system/guides",
];

function articleBySlug(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

function toResolved(slug: string, surface: PageGuideSurface): ResolvedPageGuide | null {
  const article = articleBySlug(slug);
  if (!article) return null;
  return {
    slug,
    surface,
    href: surface === "system" ? `/system/guides/${slug}` : `/help/${slug}`,
    title: article.title,
    summary: article.summary,
  };
}

function isExcluded(pathname: string): boolean {
  return EXCLUDED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function matchPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || (prefix !== "/" && pathname.startsWith(`${prefix}/`));
}

/** Resolve the how-to guide for the current pathname. */
export function resolvePageGuide(pathname: string): ResolvedPageGuide | null {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  if (isExcluded(path)) return null;

  const setupMatch = path.match(/^\/system\/setup\/([^/]+)/);
  if (setupMatch) {
    const slug = SETUP_SECTION_GUIDE_SLUG[setupMatch[1]] ?? `${setupMatch[1]}-setup`;
    return toResolved(slug, "system") ?? toResolved("core-system-setup", "system");
  }

  const refMatch = path.match(/^\/system\/reference-data\/([^/]+)/);
  if (refMatch) {
    const slug = REFERENCE_DATA_GUIDE_SLUG[refMatch[1]] ?? "reference-data";
    return toResolved(slug, "system") ?? toResolved("reference-data", "system");
  }

  for (const rule of ROUTE_GUIDE_RULES) {
    if (matchPrefix(path, rule.prefix)) {
      return toResolved(rule.slug, rule.surface);
    }
  }

  return null;
}

/** Slugs referenced by route rules — used for coverage checks in dev. */
export function allPageGuideSlugs(): string[] {
  const slugs = new Set<string>([
    ...ROUTE_GUIDE_RULES.map((r) => r.slug),
    ...Object.values(SETUP_SECTION_GUIDE_SLUG),
    ...Object.values(REFERENCE_DATA_GUIDE_SLUG),
  ]);
  return [...slugs].sort();
}

/** Returns slugs used in rules that have no matching article. */
export function missingPageGuideArticles(): string[] {
  return allPageGuideSlugs().filter((slug) => !articleBySlug(slug));
}
