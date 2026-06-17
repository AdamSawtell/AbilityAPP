import type { HelpArticle } from "@/lib/help/types";

export const gettingStartedArticle: HelpArticle = {
  id: "article-getting-started",
  slug: "getting-started",
  title: "Getting started with AbilityAPP",
  summary:
    "Sign in, pick your role, and learn how AbilityAPP is organised for NDIS provider teams.",
  category: "Foundation",
  keywords: ["login", "sign in", "role", "welcome", "overview", "introduction"],
  relatedRoutes: ["/login", "/"],
  windowKeys: [],
  lastUpdated: "2025-06-15",
  sections: [
    {
      id: "what-is-abilityapp",
      title: "What AbilityAPP is",
      body: "AbilityAPP is the workspace for NDIS providers. You manage enquiries, clients, locations, employees, services, tasks, and reports in one place. The layout follows AbilityERP windows and tabs so teams can move between systems with familiar names.",
      bullets: [
        "Core: Home, Tasks, Enquiries, Clients, Locations, Reports",
        "People: Employees",
        "Services: Products, price lists, contracts, service agreements",
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
        "If you have more than one role, choose the role for this session.",
      ],
      relatedRoutes: ["/login"],
    },
    {
      id: "roles",
      title: "Roles and what you can see",
      body: "Each role controls which sidebar items, record tabs, reports, and task types you can open. If a menu item is missing, your role does not include that window. Switch roles from your profile at the bottom of the sidebar when your account has multiple roles.",
      relatedRoutes: ["/system/admin/roles"],
    },
    {
      id: "where-to-go-next",
      title: "Where to go next",
      body: "Read Navigation and workspace to learn tabs and saving. Then open the guide for the module you use most: Tasks, Enquiries, Clients, or Employees.",
      bullets: [
        "[Navigation and workspace](/help/navigation-and-workspace)",
        "[Home dashboard](/help/home-dashboard)",
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
  keywords: ["sidebar", "tabs", "workspace", "navigate", "open records", "save", "unsaved"],
  relatedRoutes: ["/"],
  windowKeys: [],
  lastUpdated: "2025-06-15",
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
      body: "When you open a client, enquiry, employee, or location, AbilityAPP adds a tab across the top of the main area. You can keep several records open and switch between them. Close a tab with the × on the tab strip.",
      bullets: [
        "Pink tabs: enquiries",
        "Green tabs: clients",
        "Indigo tabs: employees",
        "Teal tabs: locations",
      ],
    },
    {
      id: "detail-tabs",
      title: "Tabs inside a record",
      body: "Each record has its own tab menu on the left on desktop, or as chips on mobile. Tabs group related fields and line tables. The URL includes ?tab= so you can bookmark or share a specific tab.",
      bullets: [
        "Overview tabs show summary fields and key compliance flags.",
        "Line-item tabs such as Alerts, Activity, and Consents use editable tables with Add row.",
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
  summary: "Your landing page with summary cards, recent records, tasks, and a personal calendar.",
  category: "Core",
  keywords: ["home", "dashboard", "calendar", "welcome", "summary"],
  relatedRoutes: ["/"],
  windowKeys: ["home"],
  lastUpdated: "2025-06-15",
  sections: [
    {
      id: "overview",
      title: "What Home shows",
      body: "Home gives you counts and shortcuts for the modules your role can access. Cards link straight to Enquiries, Clients, Employees, or Tasks.",
      relatedRoutes: ["/"],
    },
    {
      id: "recent-lists",
      title: "Recent enquiries and clients",
      body: "Short lists show the latest enquiries and clients so you can jump back into active work. Click a row to open the full record.",
    },
    {
      id: "personal-calendar",
      title: "Personal calendar",
      body: "The calendar on Home is personal to you. It combines tasks assigned to you or your role that have due dates, plus compliance dates for your employee record only: credential expiry, document expiry, visa, and driver licence.",
      bullets: [
        "Month, week, and day views use the controls above the calendar.",
        "Click an event to open the linked task or your employee record.",
        "Tasks appear once even if they match both Assigned to me and To my role.",
      ],
      windowKeys: ["home"],
    },
  ],
};
