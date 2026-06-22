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
  { prefix: "/system/admin/user-session-audit", slug: "user-session-audit", surface: "system" },
  { prefix: "/system/admin/process-audit", slug: "process-audit", surface: "system" },
  { prefix: "/system/admin/ai-query-audit", slug: "ai-query-audit", surface: "system" },
  { prefix: "/system/settings/time-and-date", slug: "time-and-date", surface: "system" },
  { prefix: "/system/settings/record-retention", slug: "record-retention", surface: "system" },
  { prefix: "/system/admin/task-automations", slug: "task-automations", surface: "system" },
  { prefix: "/system/admin/document-templates", slug: "document-templates", surface: "system" },
  { prefix: "/system/admin/document-registry", slug: "document-templates", surface: "system" },
  { prefix: "/system/admin/task-management", slug: "task-setup", surface: "system" },
  { prefix: "/system/admin/reports-advance", slug: "reports-setup", surface: "system" },
  { prefix: "/system/admin/organisation-structure", slug: "workforce-organisation", surface: "app" },
  { prefix: "/system/admin/roles", slug: "roles-and-access", surface: "system" },
  { prefix: "/system/tasks/task-automations", slug: "task-automations", surface: "system" },
  { prefix: "/system/tasks/task-management", slug: "task-setup", surface: "system" },
  { prefix: "/system/ai/assistants", slug: "ai-assistants-setup", surface: "system" },
  { prefix: "/system/org-chart-tiers", slug: "organisation-setup", surface: "system" },
  { prefix: "/system/organization", slug: "organisation-setup", surface: "system" },
  { prefix: "/system/reference-data", slug: "reference-data", surface: "system" },
  { prefix: "/system", slug: "core-system-setup", surface: "system" },

  // App — my workplace
  { prefix: "/my/open-shifts", slug: "my-workplace", surface: "app" },
  { prefix: "/my/shifts", slug: "my-workplace", surface: "app" },
  { prefix: "/my/credentials", slug: "my-workplace", surface: "app" },
  { prefix: "/my/contracts", slug: "my-workplace", surface: "app" },
  { prefix: "/my/availability", slug: "my-workplace", surface: "app" },
  { prefix: "/my/profile", slug: "my-workplace", surface: "app" },
  { prefix: "/my/leave", slug: "my-workplace", surface: "app" },
  { prefix: "/my", slug: "my-workplace", surface: "app" },

  // App — participant portal
  { prefix: "/portal/requests", slug: "participant-portal", surface: "app" },
  { prefix: "/portal/services", slug: "participant-portal", surface: "app" },
  { prefix: "/portal/budget", slug: "participant-portal", surface: "app" },
  { prefix: "/portal", slug: "participant-portal", surface: "app" },

  // App — workforce & admin
  { prefix: "/workforce-planning/organisation", slug: "workforce-organisation", surface: "app" },
  { prefix: "/workforce-planning", slug: "workforce-leave-calendar", surface: "app" },
  { prefix: "/admin/roles", slug: "roles-and-access", surface: "app" },
  { prefix: "/admin/reference-data", slug: "reference-data", surface: "system" },
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
  { prefix: "/business-partners", slug: "business-partners", surface: "app" },
  { prefix: "/products", slug: "services", surface: "app" },
  { prefix: "/price-lists", slug: "services", surface: "app" },
  { prefix: "/contracts", slug: "services", surface: "app" },
  { prefix: "/service-agreements", slug: "services", surface: "app" },
  { prefix: "/service-bookings/new", slug: "delivery", surface: "app" },
  { prefix: "/service-bookings", slug: "delivery", surface: "app" },
  { prefix: "/generate-timesheets", slug: "delivery", surface: "app" },
  { prefix: "/ndis-audit-pack", slug: "delivery", surface: "app" },
  { prefix: "/financial-close", slug: "delivery", surface: "app" },
  { prefix: "/board-reporting", slug: "delivery", surface: "app" },
  { prefix: "/invoice-reconciliation", slug: "delivery", surface: "app" },
  { prefix: "/multi-provider-budget", slug: "service-planning", surface: "app" },
  { prefix: "/my/timesheets", slug: "my-workplace", surface: "app" },
  { prefix: "/claim-reconciliation", slug: "delivery", surface: "app" },
  { prefix: "/generate-claims", slug: "delivery", surface: "app" },
  { prefix: "/claims", slug: "delivery", surface: "app" },
  { prefix: "/generate-invoices", slug: "delivery", surface: "app" },
  { prefix: "/invoices", slug: "delivery", surface: "app" },
  { prefix: "/plan-reconciliation", slug: "service-planning", surface: "app" },
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
