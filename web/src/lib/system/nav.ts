/**
 * System sidebar navigation — mirrors workspace `sidebar-nav.tsx` section order and format.
 *
 * DEV NOTE — keep in sync with the app
 * ------------------------------------
 * Whenever you add a new **main menu section** in `web/src/components/sidebar-nav.tsx`,
 * add a matching section here in `SYSTEM_NAV_SECTIONS` with the same:
 *   - label and order (Organisation directly under Home; AI under Reports; Integrations above Admin)
 *   - icon name (add to `SystemNavIconName` + `system-nav-icons.tsx` if new)
 *   - expandable header + submenu pattern
 *
 * Module setup pages (task management, reports advance, org structure, etc.) sit under their
 * workspace module — not under Admin. Roles live in workspace Admin (`/admin/roles`).
 *
 * **How-to guide** is pinned to the bottom of `system-nav.tsx` (mirrors workspace `/help`).
 *
 * Every section's submenu must end with **Reference data** (use `withReferenceData`).
 * Assign each list in `reference-data-sections.ts` when adding keys in `reference-data.ts`.
 *
 * Also update `SYSTEM_HOME_LINKS` when a setup page ships.
 */

export type SystemNavIconName =
  | "home"
  | "task"
  | "enquiry"
  | "client"
  | "location"
  | "employee"
  | "workforce"
  | "incident"
  | "services"
  | "report"
  | "admin"
  | "ai"
  | "organisation"
  | "integrations"
  | "guides";

export type SystemNavLink = {
  href?: string;
  label: string;
  match?: (path: string) => boolean;
  comingSoon?: boolean;
};

export type SystemNavSection = {
  key: string;
  label: string;
  icon: SystemNavIconName;
  links: SystemNavLink[];
  emptyMessage?: string;
};

export function systemReferenceDataHref(sectionKey: string) {
  return `/system/reference-data/${sectionKey}`;
}

export function referenceDataNavLink(sectionKey: string): SystemNavLink {
  const href = systemReferenceDataHref(sectionKey);
  return {
    href,
    label: "Reference data",
    match: (p) => p.startsWith(href),
  };
}

/** Reference data is always the last submenu item for a section. */
export function withReferenceData(sectionKey: string, links: SystemNavLink[]): SystemNavLink[] {
  const withoutRef = links.filter((l) => l.label !== "Reference data");
  return [...withoutRef, referenceDataNavLink(sectionKey)];
}

/** @deprecated Use withReferenceData — module setup pages are not sidebar items. */
export function withModuleNav(sectionKey: string, links: SystemNavLink[]): SystemNavLink[] {
  return withReferenceData(sectionKey, links);
}

export function systemNavSectionLabel(sectionKey: string): string {
  return SYSTEM_NAV_SECTIONS.find((s) => s.key === sectionKey)?.label ?? sectionKey;
}

export const SYSTEM_NAV_SECTIONS: SystemNavSection[] = [
  {
    key: "organisation",
    label: "Organisation",
    icon: "organisation",
    links: withModuleNav("organisation", [
      {
        href: "/system/organization",
        label: "Organisation profile",
        match: (p) => p.startsWith("/system/organization"),
      },
      {
        href: "/system/org-chart-tiers",
        label: "Org chart tiers",
        match: (p) => p.startsWith("/system/org-chart-tiers"),
      },
    ]),
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: "task",
    links: withModuleNav("tasks", [
      {
        href: "/system/admin/task-management",
        label: "Task management",
        match: (p) => p.startsWith("/system/admin/task-management"),
      },
      {
        href: "/system/admin/task-automations",
        label: "Task automations",
        match: (p) => p.startsWith("/system/admin/task-automations"),
      },
    ]),
  },
  {
    key: "enquiries",
    label: "Enquiries",
    icon: "enquiry",
    links: withModuleNav("enquiries", []),
  },
  {
    key: "clients",
    label: "Clients",
    icon: "client",
    links: withModuleNav("clients", []),
  },
  {
    key: "locations",
    label: "Locations",
    icon: "location",
    links: withModuleNav("locations", []),
  },
  {
    key: "people",
    label: "People",
    icon: "employee",
    links: withModuleNav("people", []),
  },
  {
    key: "workforce",
    label: "Workforce planning",
    icon: "workforce",
    links: withModuleNav("workforce", []),
  },
  {
    key: "incidents",
    label: "Incident reports",
    icon: "incident",
    links: withModuleNav("incidents", []),
  },
  {
    key: "services",
    label: "Services",
    icon: "services",
    links: withModuleNav("services", []),
  },
  {
    key: "reports",
    label: "Reports",
    icon: "report",
    links: withModuleNav("reports", [
      {
        href: "/system/admin/reports-advance",
        label: "Reports Advance",
        match: (p) => p.startsWith("/system/admin/reports-advance"),
      },
    ]),
  },
  {
    key: "ai",
    label: "AI",
    icon: "ai",
    links: withModuleNav("ai", [
      {
        href: "/system/ai/assistants",
        label: "AI assistants",
        match: (p) => p.startsWith("/system/ai/assistants"),
      },
    ]),
  },
  {
    key: "integrations",
    label: "Integrations",
    icon: "integrations",
    links: withModuleNav("integrations", []),
  },
  {
    key: "admin",
    label: "Admin",
    icon: "admin",
    links: withModuleNav("admin", [
      {
        href: "/system/admin/user-session-audit",
        label: "User Session Audit",
        match: (p) => p.startsWith("/system/admin/user-session-audit"),
      },
    ]),
  },
  {
    key: "system-settings",
    label: "System Settings",
    icon: "admin",
    links: [
      {
        href: "/system/settings/record-retention",
        label: "Record retention settings",
        match: (p) => p.startsWith("/system/settings/record-retention"),
      },
    ],
  },
];

export const SYSTEM_HOME_LINKS: {
  sectionKey: string;
  href?: string;
  title: string;
  description: string;
  comingSoon?: boolean;
}[] = [
  {
    sectionKey: "organisation",
    href: "/system/organization",
    title: "Organisation profile",
    description: "Legal name, branding, NDIS registration, and provider details shown on sign-in.",
  },
  {
    sectionKey: "organisation",
    href: "/system/org-chart-tiers",
    title: "Org chart tiers",
    description: "Define chart band labels and order. Position assignment stays in Workforce planning.",
  },
  {
    sectionKey: "tasks",
    href: "/system/admin/task-management",
    title: "Task management",
    description: "Request types, defaults, and how tasks behave across the workspace.",
  },
  {
    sectionKey: "tasks",
    href: "/system/admin/task-automations",
    title: "Task automations",
    description: "Rules that create or assign tasks when records change or schedules fire.",
  },
  {
    sectionKey: "reports",
    href: "/system/admin/reports-advance",
    title: "Reports Advance",
    description: "Read-only SQL console for advanced exports and investigations.",
  },
  {
    sectionKey: "ai",
    href: "/system/ai/assistants",
    title: "AI assistants",
    description: "Configure bots, prompts, tools, and which roles can use them on Home.",
  },
  {
    sectionKey: "admin",
    href: "/system/admin/user-session-audit",
    title: "User Session Audit",
    description: "Login activity, risk detection, session investigation, and compliance export.",
  },
  {
    sectionKey: "system-settings",
    href: "/system/settings/record-retention",
    title: "Record retention settings",
    description: "Retention for user session data, concurrent session policy, and timeout rules.",
  },
  {
    sectionKey: "guides",
    href: "/system/guides",
    title: "Setup guides",
    description: "Go-live checklist and how-to articles for organisation, reference data, roles, tasks, and AI.",
  },
];
