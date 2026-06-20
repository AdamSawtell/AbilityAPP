import { moduleSetupGuideArticles } from "@/lib/help/articles/module-setup-guides";
import type { HelpArticle } from "@/lib/help/types";

export const coreSystemSetupArticle: HelpArticle = {
  id: "article-core-system-setup",
  slug: "core-system-setup",
  title: "Core system setup (go-live checklist)",
  summary:
    "Configure a new tenant in the right order: organisation, shared reference data, roles, tasks, workforce structure, and AI.",
  category: "System setup",
  keywords: [
    "system setup",
    "go live",
    "tenant",
    "configuration",
    "onboarding",
    "organisation",
    "reference data",
    "roles",
    "task types",
    "checklist",
  ],
  relatedRoutes: [
    "/system",
    "/system/organization",
    "/system/settings/time-and-date",
    "/system/reference-data/admin",
    "/system/admin/roles",
    "/system/admin/task-management",
    "/system/org-chart-tiers",
    "/system/ai/assistants",
  ],
  windowKeys: [],
  lastUpdated: "2026-06-17",
  sections: [
    {
      id: "open-system",
      title: "Open System setup",
      body: "System is separate from the day-to-day workspace. Open it from the link on the workspace sign-in screen. Sign in with a user who has system access (typically the same people who hold AbilityAPP Admin in the workspace).\n\nSystem mirrors the workspace sidebar: each module has setup pages and its own Reference data submenu. Shared dropdown lists live under Admin → Reference data once and apply everywhere they are used.",
      steps: [
        "From the workspace login page, click System setup.",
        "Sign in with your system user.",
        "Use the sidebar or System home cards to open each setup area.",
      ],
      relatedRoutes: ["/system", "/system/login"],
    },
    {
      id: "checklist-order",
      title: "Recommended setup order",
      body: "Follow this order for a clean go-live. You can revisit any step later.",
      steps: [
        "Organisation profile — legal name, branding, NDIS registration, incident SLA defaults.",
        "Time & date — organisation timezone for the sidebar clock, My shifts, and roster dates.",
        "Admin → Reference data — shared lists (gender, states, Yes/No, show as alert, relationships, and similar).",
        "Per-module Reference data — statuses and types for enquiries, clients, locations, people, incidents, and services.",
        "Roles — windows, processes, reports, and task-type permissions for each security role.",
        "Task management — task types and which roles can create each type.",
        "Task priority — Tasks → Reference data (Low, Normal, High by default).",
        "Org chart tiers — band labels for the workforce organisation chart.",
        "AI assistants — bots, prompts, and tools for the Home chat (optional).",
        "Task automations — rules that create tasks when records change (start with incidents if you use reportable incident workflows).",
      ],
      relatedRoutes: ["/system/guides/core-system-setup"],
    },
    {
      id: "shared-vs-module",
      title: "Shared lists vs module lists",
      body: "If a dropdown appears on more than one module (for example Gender on clients and employees), it is maintained under System → Admin → Reference data. The editor shows every page and tab that uses that list.\n\nLists that belong to one module only (for example enquiry status) sit under that module’s Reference data submenu.",
      relatedRoutes: ["/system/reference-data/admin", "/system/guides/reference-data"],
    },
    {
      id: "workspace-vs-system",
      title: "What stays in the workspace",
      body: "Day-to-day work — enquiries, clients, rostering, incidents, reports — stays in the workspace. System does not replace record entry.\n\nUser passwords and employee System access tab linking are still managed from the workspace (Employees → System access). Roles are configured in System → Admin → Roles.",
      bullets: [
        "System — tenant configuration, reference data, roles, task types, automations, AI",
        "Workspace — operational records, tasks, and exports",
      ],
    },
    {
      id: "day-to-day-help",
      title: "End-user how-to guides",
      body: "Staff how-to articles for using the workspace (navigation, creating clients, running reports) live in the workspace Help → How-to guide. System setup guides here focus on administrators configuring the tenant.",
      relatedRoutes: ["/help", "/help/getting-started"],
    },
  ],
};

export const systemReferenceDataArticle: HelpArticle = {
  id: "article-system-reference-data",
  slug: "reference-data",
  title: "Reference data in System",
  summary: "Maintain dropdown options per module. Shared lists are edited once under Admin and show where they are used.",
  category: "System setup",
  keywords: ["reference data", "dropdown", "options", "shared lists", "admin reference data", "system"],
  relatedRoutes: ["/system/reference-data/admin", "/system/reference-data/enquiries", "/system/reference-data/clients"],
  windowKeys: ["admin-reference-data"],
  lastUpdated: "2026-06-17",
  sections: [
    {
      id: "where-to-open",
      title: "Where to open reference data",
      body: "In System, expand any sidebar section and choose Reference data as the last submenu item. You only see lists for that module.\n\nCross-module lists (gender, state, country, Yes/No, show as alert, contact relationship, and similar) are under System → Admin → Reference data.",
      steps: [
        "Open System and pick a module (for example Clients).",
        "Click Reference data at the bottom of that section’s submenu.",
        "Select a list on the left; edit one option per line on the right.",
        "Click Save options.",
      ],
      relatedRoutes: ["/system/reference-data"],
    },
    {
      id: "shared-usage",
      title: "Shared lists and where they appear",
      body: "When you open a shared list, the editor shows Shared across workspace with every module and tab that reads it. For example Show as alert is used on client, location, and employee alert lines.\n\nEdit a shared list once — all modules pick up the change on the next save or refresh.",
      bullets: [
        "Yes / No — support plan fields, primary contact flags, location assignment flags",
        "Show as alert — alert, consent, risk, and need-rule lines on clients, locations, and employees",
        "Gender — client profile, employee profile, enquiry participant",
        "Address type, state, country — client locations, employee addresses, location overview",
        "Contact relationship — client contacts and employee emergency contacts",
      ],
      relatedRoutes: ["/system/reference-data/admin"],
    },
    {
      id: "module-lists",
      title: "Module-specific lists",
      body: "Each module owns its operational statuses and types. Examples:",
      bullets: [
        "Enquiries — enquiry status, source, query types",
        "Clients — client status, plan types, goal types, alert types",
        "Locations — location type, status, assignment roles",
        "People — credentials, skills, employment types, departments",
        "Tasks — task priority",
        "Incidents — severity, category, party types, notification targets",
        "Services — products, agreements, contracts",
      ],
    },
    {
      id: "storage",
      title: "Where options are stored",
      body: "When Supabase is connected, reference data is stored in the database and shared across browsers. In local demo mode, options are kept in the browser until you connect Supabase.",
    },
  ],
};

export const systemOrganisationArticle: HelpArticle = {
  id: "article-system-organisation",
  slug: "organisation-setup",
  title: "Organisation profile, time & date, and org chart tiers",
  summary: "Set provider branding, organisation timezone, NDIS details, incident defaults, and chart tier labels before workforce setup.",
  category: "System setup",
  keywords: ["organisation", "logo", "NDIS", "provider", "org chart tiers", "branding", "SLA"],
  relatedRoutes: ["/system/organization", "/system/org-chart-tiers", "/system/settings/time-and-date"],
  windowKeys: ["admin-organization", "workforce-org-chart-tier"],
  lastUpdated: "2026-06-17",
  sections: [
    {
      id: "organisation-profile",
      title: "Organisation profile",
      body: "System → Organisation → Organisation profile holds the legal and display name, logo URL, contact details, and NDIS registration fields shown on sign-in and used in templates.\n\nIncident investigation SLA days on this record feed task automations for overdue investigations.",
      steps: [
        "Open System → Organisation → Organisation profile.",
        "Complete Provider details and Contact sections.",
        "Set Incident investigation SLA days if you use investigation automations.",
        "Save. The audit footer records the change.",
      ],
      relatedRoutes: ["/system/organization"],
    },
    {
      id: "time-and-date",
      title: "Time & date",
      body: "System → Organisation → Time & date sets the IANA timezone for the live clock under the logo, My shifts, roster dates, and session audit timestamps.\n\nAnyone signed in to System setup can change it — you do not need Record retention admin rights.",
      steps: [
        "Open System → Organisation → Time & date.",
        "Pick your region (for example Australia/Adelaide).",
        "Save timezone. The sidebar clock updates immediately.",
      ],
      relatedRoutes: ["/system/settings/time-and-date", "/system/guides/time-and-date"],
    },
    {
      id: "org-chart-tiers",
      title: "Org chart tiers",
      body: "System → Organisation → Org chart tiers defines the band labels and sort order on the workforce organisation chart (for example Executive, Management, Frontline).\n\nAssigning people to positions stays in Workforce planning → Organisation structure in the workspace.",
      steps: [
        "Open System → Organisation → Org chart tiers.",
        "Add or reorder tier rows — label and sort order.",
        "Save. Existing positions use the updated tier names on the chart.",
      ],
      relatedRoutes: ["/system/org-chart-tiers", "/workforce-planning/organisation"],
    },
  ],
};

export const systemRolesAccessArticle: HelpArticle = {
  id: "article-system-roles",
  slug: "roles-and-access",
  title: "Roles and access",
  summary: "Define security roles, window access, business processes, reports, and link users from employee records.",
  category: "System setup",
  keywords: ["roles", "access", "windows", "permissions", "users", "security", "system admin"],
  relatedRoutes: ["/admin/roles", "/employees"],
  windowKeys: ["admin-roles", "employee-system-access"],
  lastUpdated: "2026-06-17",
  sections: [
    {
      id: "roles-page",
      title: "Configure roles",
      body: "Admin → Roles in the workspace is where you maintain security roles. Each role bundles:",
      bullets: [
        "Windows — sidebar items, record tabs, and admin screens",
        "Processes — actions such as enquiry-to-client",
        "Reports — which exports appear in the catalog",
        "Task types — see, select, and create rights per task type (also configured on Task management)",
      ],
      steps: [
        "Open Admin → Roles in the workspace sidebar.",
        "Select a role or click Add role.",
        "Tick windows, processes, and reports for that role.",
        "Save the role.",
      ],
      relatedRoutes: ["/admin/roles"],
    },
    {
      id: "users",
      title: "Users and logins",
      body: "User accounts are linked from employee records. Open an employee → System access tab to connect a login and assign roles.\n\nWorkspace Admin → Users redirects to the employee list for this workflow.",
      relatedRoutes: ["/employees"],
      windowKeys: ["employee-system-access"],
    },
    {
      id: "org-positions",
      title: "Roles vs org chart positions",
      body: "Security roles control app access. Org chart positions in Workforce planning assign holders to slots in the reporting tree. Each position links to exactly one security role — many positions can share the same role.\n\nSee [Workforce organisation structure](/help/workforce-organisation) for the position tree and automations.",
      relatedRoutes: ["/workforce-planning/organisation", "/help/workforce-organisation"],
    },
  ],
};

export const systemTasksSetupArticle: HelpArticle = {
  id: "article-system-tasks-setup",
  slug: "task-setup",
  title: "Task types, priority, and automations",
  summary: "Configure task types and role permissions, task priority options, and automation rules in System.",
  category: "System setup",
  keywords: ["task management", "task types", "task priority", "task automations", "system tasks"],
  relatedRoutes: [
    "/system/admin/task-management",
    "/system/admin/task-automations",
    "/system/reference-data/tasks",
    "/system/guides/task-automations",
  ],
  windowKeys: ["admin-task-management", "admin-task-automations"],
  lastUpdated: "2026-06-17",
  sections: [
    {
      id: "task-types",
      title: "Task management",
      body: "Task types (Review, Approve, Check, and custom types) are full records with descriptions and sort order — not simple reference lists. Configure them under System → Tasks → Task management.\n\nOn the same page, set per-role permissions: can see, can select when creating, and can create.",
      relatedRoutes: ["/system/admin/task-management"],
    },
    {
      id: "task-priority",
      title: "Task priority",
      body: "Priority dropdown options (default Low, Normal, High) are reference data under System → Tasks → Reference data. They apply to the task form and task automations.",
      relatedRoutes: ["/system/reference-data/tasks"],
    },
    {
      id: "automations",
      title: "Task automations",
      body: "System → Admin → Task automations holds rules that create tasks when records change or on schedules. All rule types run when their triggers fire.\n\nFor step-by-step configuration, read [Task automations](/system/guides/task-automations).",
      relatedRoutes: ["/system/admin/task-automations", "/system/guides/task-automations"],
    },
  ],
};

export const systemAiSetupArticle: HelpArticle = {
  id: "article-system-ai-setup",
  slug: "ai-assistants-setup",
  title: "AI assistants setup",
  summary: "Configure bots on Home: prompts, tools, models, and which roles can use each assistant.",
  category: "System setup",
  keywords: ["AI", "assistant", "chatbot", "home chat", "tools", "prompt"],
  relatedRoutes: ["/system/ai/assistants"],
  windowKeys: ["admin-ai-agents"],
  lastUpdated: "2026-06-17",
  sections: [
    {
      id: "open-assistants",
      title: "Open AI assistants",
      steps: [
        "Open System → AI → AI assistants.",
        "Select an assistant or create one.",
        "Set name, description, system prompt, and enabled tools.",
        "Choose which roles may use the assistant on Home.",
        "Save.",
      ],
      relatedRoutes: ["/system/ai/assistants"],
    },
    {
      id: "training-assistant",
      title: "Training assistant and help search",
      body: "The default training assistant uses help_search to answer how-to questions from the in-app guide. Keep workspace help articles updated when you ship new features — see [Maintaining this guide](/help/maintaining-this-guide).",
      relatedRoutes: ["/help/maintaining-this-guide"],
    },
  ],
};

export const SYSTEM_SETUP_ARTICLES: HelpArticle[] = [
  coreSystemSetupArticle,
  systemReferenceDataArticle,
  systemOrganisationArticle,
  systemRolesAccessArticle,
  systemTasksSetupArticle,
  systemAiSetupArticle,
  ...moduleSetupGuideArticles,
];

export const SYSTEM_SETUP_GUIDE_SLUGS = SYSTEM_SETUP_ARTICLES.map((a) => a.slug);

export function systemSetupArticleBySlug(slug: string): HelpArticle | undefined {
  return SYSTEM_SETUP_ARTICLES.find((a) => a.slug === slug);
}
