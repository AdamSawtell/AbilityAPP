import type { HelpArticle } from "@/lib/help/types";

export const gettingStartedArticle: HelpArticle = {
  id: "article-getting-started",
  slug: "getting-started",
  title: "Getting started with AbilityVua",
  summary:
    "Sign in, pick your role, and learn how AbilityVua is organised for NDIS provider teams.",
  category: "Foundation",
  keywords: ["login", "sign in", "role", "welcome", "overview", "introduction"],
  relatedRoutes: ["/login", "/"],
  windowKeys: [],
  lastUpdated: "2026-06-26",
  sections: [
    {
      id: "what-is-abilityvua",
      title: "What AbilityVua is",
      body: "AbilityVua is the workspace for NDIS providers. You manage enquiries, clients, locations, employees, services, tasks, and reports in one place. The layout follows AbilityERP windows and tabs so teams can move between systems with familiar names.",
      bullets: [
        "Core: Home, Tasks, Enquiries, Clients, Locations, Reports",
        "People: Employees, My workplace, Incidents, Complaints",
        "Services: Products, price lists, contracts, service agreements",
        "Finance: claims, invoices, vendor invoices, reconciliation, and close",
        "Admin: System setup (organisation, reference data, roles, tasks) — link on the sign-in page",
      ],
    },
    {
      id: "sign-in",
      title: "Sign in",
      body: "Open the login page and enter your username and password. Your organisation administrator creates accounts and assigns roles.",
      steps: [
        "Go to the login page for your hosted site.",
        "Enter your username and password.",
        "Click Sign in.",
        "If you have more than one role, choose the role for this session from the profile menu at the bottom of the sidebar.",
        "The SuperUser demo account can switch to any active role for testing.",
      ],
      relatedRoutes: ["/login"],
    },
    {
      id: "roles",
      title: "Roles and what you can see",
      body: "Each role controls which sidebar items, record tabs, reports, and task types you can open. If a menu item is missing, your role does not include that window. Switch roles from your profile at the bottom of the sidebar when your account has multiple roles.\n\nExample: support workers see **My incidents** (only their own open reports). Coordinators and quality roles with **Can see all incidents** see the full register and dashboard.\n\n**Location access:** unless your role includes **Unrestricted location access (can see all)**, you only see support locations you are assigned to and clients linked to those locations. Client-related lists, tasks, rosters, billing, and incidents inherit that scope automatically.",
      relatedRoutes: ["/system/admin/roles"],
    },
    {
      id: "where-to-go-next",
      title: "Where to go next",
      body: "Read Navigation and workspace to learn tabs and saving. Then open the guide for the module you use most: Tasks, Enquiries, Clients, or Employees.",
      bullets: [
        "[Navigation and workspace](/help/navigation-and-workspace)",
        "[Home dashboard](/help/home-dashboard)",
        "[My workplace self-service](/help/my-workplace)",
        "[Workforce planning](/help/workforce-leave-calendar)",
        "[Tasks](/help/tasks)",
      ],
    },
  ],
};

export const navigationArticle: HelpArticle = {
  id: "article-navigation",
  slug: "navigation-and-workspace",
  title: "Navigation and workspace",
  summary:
    "Use the sidebar, open record tabs, switch detail tabs inside a record, and save your work.",
  category: "Foundation",
  keywords: ["sidebar", "tabs", "workspace", "navigate", "open records", "save", "unsaved", "banner", "record header"],
  relatedRoutes: ["/"],
  windowKeys: [],
  lastUpdated: "2026-06-26",
  sections: [
    {
      id: "sidebar",
      title: "Sidebar navigation",
      body: "The left sidebar lists every module your role can access. Sections with a chevron expand to show list views and any records you already have open. Home and Tasks sit at the top when your role includes them.",
      bullets: [
        "Click a section name to open its list view.",
        "Use the chevron to expand or collapse sub-links without leaving your current page.",
        "Badge numbers on Tasks show overdue or open work.",
        "Open records appear under their module with an amber dot when you have unsaved changes.",
      ],
    },
    {
      id: "workspace-tabs",
      title: "Open record tabs",
      body: "When you open a client, enquiry, employee, or location, AbilityVua adds a tab across the top of the main area. You can keep several records open and switch between them. Close a tab with the × on the tab strip.",
      bullets: [
        "Pink tabs: enquiries",
        "Green tabs: clients",
        "Indigo tabs: employees",
        "Teal tabs: locations",
      ],
    },
    {
      id: "record-banner",
      title: "The record banner",
      body: "Every master record (clients, employees, locations, business partners/providers, and the organisation profile) opens with a consistent banner so you instantly recognise who or what you are viewing. A large photo, logo, or initials block sits on the left, the name and key details in the centre, and a quick-reference summary panel on the right.",
      bullets: [
        "Left: a large photo, organisation logo, or initials when no image is set as the visual anchor.",
        "Centre: the record name, a short subtitle, status badges (active, alerts, consents, credentials, registration), and contact details with icons.",
        "Right: a summary panel — funding and disability for clients, department and site for employees, capacity and city for locations, payment/ABN details for providers, and registration details for the organisation.",
        "Contact details live in the banner for the record they belong to; standalone contact records are not a separate workspace page yet.",
        "Status badges link straight to the relevant tab (for example alerts or restrictive practices).",
        "On tablet the summary stacks below; on mobile the photo moves above the details.",
      ],
    },
    {
      id: "detail-tabs",
      title: "Tabs inside a record",
      body: "Each record has its own tab menu on the left on desktop, or as chips on mobile. Tabs group related fields and line tables. Line tables on client records show a summary list; click a row to open the line drawer for full fields. Changes save with the parent record. The URL includes ?tab= so you can bookmark or share a specific tab.",
      bullets: [
        "Overview tabs show summary fields and key compliance flags.",
        "Line-item tabs such as Alerts, Activity, and Consents use editable tables with Add row.",
        "Activity lines (client, enquiry, employee, and location) can only be removed by an administrator. Other roles use Request deletion to create an admin task.",
        "Some tabs are placeholders while parity with AbilityERP is still in progress.",
      ],
    },
    {
      id: "create-records",
      title: "Create a new record",
      body: "Most list pages have a New button in the page header. New enquiries, employees, locations, contracts, and tasks each have a dedicated create flow. Clients are usually created by converting an enquiry.",
      bullets: [
        "Enquiries: New enquiry from the Enquiries list",
        "Employees: New employee from the Employees list",
        "Locations: New location from the Locations list",
        "Tasks: New task from Tasks or from a linked record",
        "Clients: convert from an enquiry — see [How do I create a new client?](/help/create-a-new-client)",
      ],
    },
    {
      id: "save-and-audit",
      title: "Save, discard, and audit trail",
      body: "Edit fields on a record and a bar appears at the bottom with Save and Discard. Line tables save with the record. The audit footer on each page shows who created and last updated the record.",
    },
    {
      id: "breadcrumbs",
      title: "Breadcrumbs and list links",
      body: "Detail pages show breadcrumbs back to the list. Record links in tables for search keys and document numbers open the related record in the workspace.",
    },
  ],
};

export const homeArticle: HelpArticle = {
  id: "article-home",
  slug: "home-dashboard",
  title: "Home dashboard",
  summary: "Your AI-first landing page with a daily briefing, collapsible sections, and the sidebar assistant.",
  category: "Core",
  keywords: ["home", "dashboard", "calendar", "welcome", "assistant", "briefing", "shifts", "roster", "leave"],
  relatedRoutes: ["/"],
  windowKeys: ["home"],
  lastUpdated: "2026-06-29",
  sections: [
    {
      id: "overview",
      title: "Assistant first",
      body: "Home opens with a daily briefing and suggested prompts matched to your role's assistant skills. Click a prompt to send it to the sidebar assistant (Ctrl+\\ toggles the panel). Coordinators and intake staff may see prepare prompts; support workers typically see activity and lookup prompts. The assistant prepares records — you review and save.",
      relatedRoutes: ["/"],
    },
    {
      id: "needs-attention",
      title: "Needs attention",
      body: "One collapsible panel combines NDIS overdue incidents, overdue tasks, workforce reviews, and My workplace action items. Expand or collapse the section; your choice is remembered on this device.",
    },
    {
      id: "today",
      title: "Today",
      body: "Task summary and your personal calendar live here. When your login is linked to an employee record, the calendar shows your allocated roster shifts, pending open-shift requests, approved and pending leave, and credential/document expiry dates — alongside tasks assigned to you and your role. Use the month, week, and day views to plan around your shifts. Click a shift to open My shifts, a request to open Open shifts, or a task to open it.",
      windowKeys: ["home"],
    },
    {
      id: "modules",
      title: "Modules",
      body: "Compact counts for enquiries, clients, incidents, and employees (based on your role). Support workers may see incident counts on Home even when the Incidents list shows only **My incidents**. Use More actions for other shortcuts — including **Report incident** when your role has the quick-report panel.",
    },
    {
      id: "home-panels",
      title: "Home dashboard panels",
      body: "Administrators assign Home panels per role under Admin → Roles → Home dashboard panels. Support workers typically see clients and tasks without enquiry panels unless Enquiries module access is granted.",
      relatedRoutes: ["/admin/roles"],
      windowKeys: ["admin-roles"],
    },
  ],
};
