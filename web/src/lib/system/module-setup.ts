import type { SystemReferenceSectionKey } from "@/lib/system/reference-data-sections";

export type ModuleSetupLink = {
  href: string;
  label: string;
  description: string;
};

export type ModuleSetupConfig = {
  sectionKey: SystemReferenceSectionKey;
  title: string;
  summary: string;
  checklist: string[];
  setupLinks: ModuleSetupLink[];
  workspaceLinks: ModuleSetupLink[];
  guideSlug?: string;
};

function refDataLink(sectionKey: SystemReferenceSectionKey): ModuleSetupLink {
  return {
    href: `/system/reference-data/${sectionKey}`,
    label: "Reference data",
    description: `Dropdown options used in this module.`,
  };
}

export const MODULE_SETUP_CONFIG: Record<SystemReferenceSectionKey, ModuleSetupConfig> = {
  organisation: {
    sectionKey: "organisation",
    title: "Organisation setup",
    summary: "Legal identity, branding, NDIS registration, and org chart tier labels.",
    checklist: [
      "Set organisation profile and incident investigation SLA.",
      "Define org chart tier bands before assigning positions in Workforce planning.",
    ],
    setupLinks: [
      {
        href: "/system/organization",
        label: "Organisation profile",
        description: "Name, logo, contact details, and NDIS fields.",
      },
      {
        href: "/system/org-chart-tiers",
        label: "Org chart tiers",
        description: "Chart band labels and sort order.",
      },
      refDataLink("organisation"),
    ],
    workspaceLinks: [],
    guideSlug: "organisation-setup",
  },
  tasks: {
    sectionKey: "tasks",
    title: "Tasks setup",
    summary: "Task types, priority options, and automations that create work for roles.",
    checklist: [
      "Configure task types and role permissions under Admin → Task management.",
      "Set priority options in Reference data.",
      "Add automation rules when records change.",
    ],
    setupLinks: [
      { href: "/system/admin/task-management", label: "Task management", description: "Types and role permissions." },
      { href: "/system/admin/task-automations", label: "Task automations", description: "Rules that create tasks." },
      refDataLink("tasks"),
    ],
    workspaceLinks: [
      { href: "/tasks", label: "Tasks hub", description: "Where staff work tasks." },
      { href: "/tasks/my-role", label: "My role", description: "Tasks for the signed-in role." },
    ],
    guideSlug: "task-setup",
  },
  enquiries: {
    sectionKey: "enquiries",
    title: "Enquiries setup",
    summary: "Intake statuses, sources, and participant options before go-live.",
    checklist: [
      "Review enquiry status and source lists.",
      "Align saved query filters with how coordinators work the list.",
    ],
    setupLinks: [refDataLink("enquiries")],
    workspaceLinks: [
      { href: "/enquiries", label: "Enquiries list", description: "Intake pipeline." },
      { href: "/enquiries/new", label: "New enquiry", description: "Create a test enquiry after setup." },
    ],
    guideSlug: "enquiries-setup",
  },
  clients: {
    sectionKey: "clients",
    title: "Clients setup",
    summary: "Client statuses, alert types, support plan options, and profile lists.",
    checklist: [
      "Set client status values to match your intake workflow.",
      "Configure alert, consent, and risk types before loading clients.",
      "Review support plan reference lists (goals, documents, assessments).",
    ],
    setupLinks: [refDataLink("clients")],
    workspaceLinks: [
      { href: "/clients", label: "Clients list", description: "Support receiver register." },
    ],
    guideSlug: "clients-setup",
  },
  locations: {
    sectionKey: "locations",
    title: "Locations setup",
    summary: "Site types, statuses, and alert options for support locations.",
    checklist: ["Set location type and status lists.", "Configure location alert types."],
    setupLinks: [refDataLink("locations")],
    workspaceLinks: [
      { href: "/locations", label: "Locations list", description: "Support sites." },
      { href: "/locations/new", label: "New location", description: "Create a test site." },
    ],
    guideSlug: "locations-setup",
  },
  people: {
    sectionKey: "people",
    title: "People setup",
    summary: "Employee profile, credential, and employment reference lists.",
    checklist: [
      "Set employment status and department lists.",
      "Configure credential types and statuses for compliance tracking.",
    ],
    setupLinks: [refDataLink("people")],
    workspaceLinks: [
      { href: "/employees", label: "Employees list", description: "Staff register." },
    ],
    guideSlug: "people-setup",
  },
  workforce: {
    sectionKey: "workforce",
    title: "Workforce planning setup",
    summary: "Leave types and statuses. Position tree is under Admin → Organisation structure.",
    checklist: [
      "Set leave type and leave request status options.",
      "Configure org chart tiers, then maintain positions under Organisation structure.",
    ],
    setupLinks: [
      refDataLink("workforce"),
      {
        href: "/system/admin/organisation-structure",
        label: "Organisation structure",
        description: "Position tree and holders (System Admin).",
      },
    ],
    workspaceLinks: [
      { href: "/workforce-planning", label: "Leave calendar", description: "Organisation leave view." },
    ],
    guideSlug: "workforce-setup",
  },
  incidents: {
    sectionKey: "incidents",
    title: "Incident reports setup",
    summary: "Statuses, severity, parties, and NDIS reportable types.",
    checklist: [
      "Align incident status and severity with your quality framework.",
      "Set party types and NDIS reportable categories.",
      "Configure task automations for reportable and SLA workflows.",
    ],
    setupLinks: [
      refDataLink("incidents"),
      { href: "/system/admin/task-automations", label: "Task automations", description: "Incident task rules." },
    ],
    workspaceLinks: [
      { href: "/incidents", label: "Incidents list", description: "Incident register." },
      { href: "/incidents/dashboard", label: "Incident dashboard", description: "SLA and compliance view." },
    ],
    guideSlug: "incidents-setup",
  },
  services: {
    sectionKey: "services",
    title: "Services setup",
    summary: "Products, agreements, contracts, and funding reference lists.",
    checklist: [
      "Configure product categories and units of measure.",
      "Set service agreement and contract status options.",
    ],
    setupLinks: [refDataLink("services")],
    workspaceLinks: [
      { href: "/products", label: "Products", description: "Service catalogue." },
      { href: "/service-agreements", label: "Service agreements", description: "Client agreements." },
    ],
    guideSlug: "services-setup",
  },
  reports: {
    sectionKey: "reports",
    title: "Reports setup",
    summary: "Report catalogue access is controlled by roles. Use Reports Advance for ad-hoc SQL.",
    checklist: [
      "Grant report windows per role under Admin → Roles.",
      "Use Reports Advance for one-off exports (admin only).",
    ],
    setupLinks: [
      refDataLink("reports"),
      { href: "/system/admin/reports-advance", label: "Reports Advance", description: "Read-only SQL console." },
    ],
    workspaceLinks: [{ href: "/reports", label: "Reports", description: "Standard report catalogue." }],
    guideSlug: "reports-setup",
  },
  ai: {
    sectionKey: "ai",
    title: "AI setup",
    summary: "Assistants, prompts, tools, and role access for Home chat.",
    checklist: ["Configure at least one assistant for training/help.", "Limit production assistants by role."],
    setupLinks: [
      { href: "/system/ai/assistants", label: "AI assistants", description: "Bots and prompts." },
      refDataLink("ai"),
    ],
    workspaceLinks: [{ href: "/", label: "Home", description: "Where assistants appear in chat." }],
    guideSlug: "ai-assistants-setup",
  },
  integrations: {
    sectionKey: "integrations",
    title: "Integrations setup",
    summary: "External connectors and integration reference data (expand as connectors ship).",
    checklist: ["Review integration reference lists when a connector is enabled."],
    setupLinks: [refDataLink("integrations")],
    workspaceLinks: [],
  },
  admin: {
    sectionKey: "admin",
    title: "Admin setup",
    summary: "Roles, shared reference data, task admin, reports advance, and organisation structure.",
    checklist: [
      "Configure shared reference data first (gender, states, Yes/No, alerts).",
      "Set roles, task types, and automations.",
      "Maintain organisation structure for manager routing.",
    ],
    setupLinks: [
      { href: "/system/admin/roles", label: "Roles", description: "Windows and permissions." },
      { href: "/system/reference-data/admin", label: "Shared reference data", description: "Cross-module lists." },
      { href: "/system/admin/task-management", label: "Task management", description: "Task types." },
      { href: "/system/admin/task-automations", label: "Task automations", description: "Automation rules." },
      { href: "/system/admin/organisation-structure", label: "Organisation structure", description: "Position tree." },
      { href: "/system/admin/reports-advance", label: "Reports Advance", description: "SQL console." },
    ],
    workspaceLinks: [],
    guideSlug: "roles-and-access",
  },
};

export function moduleSetupHref(sectionKey: SystemReferenceSectionKey): string {
  return `/system/setup/${sectionKey}`;
}

export function moduleSetupConfig(sectionKey: string): ModuleSetupConfig | null {
  if (!(sectionKey in MODULE_SETUP_CONFIG)) return null;
  return MODULE_SETUP_CONFIG[sectionKey as SystemReferenceSectionKey];
}
