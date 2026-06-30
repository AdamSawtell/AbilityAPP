/**
 * Registered windows (menus / functions) and processes for role-based access.
 *
 * **Surface rule (required):** each window is `app` or `system`, never both.
 * - `app` — workspace sidebar + role window keys (`app_role_window`).
 * - `system` — System nav only; any signed-in System operator may use it (no role grant).
 *
 * See `web/AGENTS.md` — Window surfaces.
 *
 * Dependent windows (parentWindowKey set) are tabs or sub-functions inside a parent
 * window — e.g. Credentials Assigned on Business Partner (Employee).
 */

import {
  CLIENT_DEPENDENT_WINDOWS,
  CONTRACT_DEPENDENT_WINDOWS,
  EMPLOYEE_DEPENDENT_WINDOWS,
  ENQUIRY_DEPENDENT_WINDOWS,
  FLEET_DEPENDENT_WINDOWS,
  MAINTENANCE_DEPENDENT_WINDOWS,
  INCIDENT_DEPENDENT_WINDOWS,
  INCIDENT_EXTRA_WINDOWS,
  LOCATION_FEATURE_WINDOWS,
  LOCATION_DEPENDENT_WINDOWS,
  PRICE_LIST_DEPENDENT_WINDOWS,
  PRODUCT_DEPENDENT_WINDOWS,
  SERVICE_AGREEMENT_DEPENDENT_WINDOWS,
  SERVICE_BOOKING_DEPENDENT_WINDOWS,
  tabToWindowSlug,
} from "@/lib/access/detail-windows";
import { homePanelAccessWindows } from "@/lib/access/home-panels";
import type { AccessProcess, AccessWindow } from "@/lib/access/catalog-types";

export type { AccessProcess, AccessWindow, AccessWindowGroup, AccessWindowSurface } from "@/lib/access/catalog-types";

const PARENT_WINDOWS: AccessWindow[] = [
  { key: "home", label: "Home", group: "Core", href: "/", showInSidebar: true },
];

const TASK_WINDOWS: AccessWindow[] = [
  {
    key: "tasks",
    label: "Tasks",
    group: "Core",
    abilityErpName: "Request",
    showInSidebar: false,
  },
  {
    key: "tasks-assigned-to-me",
    label: "Assigned to me",
    group: "Core",
    href: "/tasks?scope=assigned-to-me",
    parentWindowKey: "tasks",
    abilityErpName: "Request — Assigned to me",
    showInSidebar: false,
  },
  {
    key: "tasks-for-my-role",
    label: "To my role",
    group: "Core",
    href: "/tasks?scope=my-role",
    parentWindowKey: "tasks",
    abilityErpName: "Request — To my role",
    showInSidebar: false,
  },
  {
    key: "tasks-all",
    label: "All tasks",
    group: "Core",
    href: "/tasks?scope=all",
    parentWindowKey: "tasks",
    abilityErpName: "Request — All",
    showInSidebar: false,
  },
  {
    key: "tasks-past",
    label: "Past",
    group: "Core",
    href: "/tasks?scope=past",
    parentWindowKey: "tasks",
    abilityErpName: "Request — Past",
    showInSidebar: false,
  },
];

const MODULE_WINDOWS: AccessWindow[] = [
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
    key: "incidents",
    label: "Incidents",
    group: "People",
    href: "/incidents",
    abilityErpName: "Incident Report",
    showInSidebar: true,
  },
  {
    key: "complaints",
    label: "Complaints and feedback",
    group: "People",
    href: "/complaints",
    abilityErpName: "Complaints and feedback",
    showInSidebar: true,
  },
  {
    key: "locations",
    label: "Locations",
    group: "Locations",
    href: "/locations",
    abilityErpName: "Support Location",
    showInSidebar: true,
  },
  {
    key: "fleet",
    label: "Fleet",
    group: "Locations",
    href: "/fleet",
    abilityErpName: "Fleet Vehicle",
    showInSidebar: true,
  },
  {
    key: "maintenance",
    label: "Maintenance",
    group: "Locations",
    href: "/maintenance",
    abilityErpName: "Maintenance Request",
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
  {
    key: "agency-workers",
    label: "Agency workers",
    group: "People",
    href: "/agency-workers",
    abilityErpName: "Agency worker",
    showInSidebar: true,
  },
  {
    key: "agency-timesheets",
    label: "Agency timesheets",
    group: "People",
    href: "/agency-timesheets",
    abilityErpName: "Agency timesheet",
    showInSidebar: true,
  },
  {
    key: "generate-agency-timesheets",
    label: "Generate agency timesheets",
    group: "People",
    href: "/generate-agency-timesheets",
    abilityErpName: "Generate agency timesheets",
    showInSidebar: true,
  },
  {
    key: "vendor-invoices",
    label: "Vendor invoices",
    group: "Finance",
    href: "/vendor-invoices",
    abilityErpName: "Vendor invoice",
    showInSidebar: true,
  },
  {
    key: "business-partners",
    label: "Business partners",
    group: "People",
    href: "/business-partners",
    abilityErpName: "Business partner",
    showInSidebar: true,
  },
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
    key: "reports",
    label: "Reports",
    group: "Core",
    href: "/reports",
    abilityErpName: "Reports",
    showInSidebar: true,
  },
];

function moduleWindow(key: string): AccessWindow {
  const window = MODULE_WINDOWS.find((w) => w.key === key);
  if (!window) throw new Error(`Missing module window: ${key}`);
  return window;
}

const DELIVERY_WINDOWS: AccessWindow[] = [
  {
    key: "service-bookings",
    label: "Service bookings",
    group: "Delivery",
    href: "/service-bookings",
    abilityErpName: "Service Booking",
    showInSidebar: true,
  },
  {
    key: "service-planning",
    label: "Service planning",
    group: "Delivery",
    href: "/service-planning",
    abilityErpName: "Service planning",
    showInSidebar: true,
  },
  {
    key: "multi-provider-budget",
    label: "Multi-provider budget",
    group: "Delivery",
    href: "/multi-provider-budget",
    parentWindowKey: "service-planning",
    abilityErpName: "Multi-provider budget",
    showInSidebar: false,
  },
  {
    key: "rostering",
    label: "Rostering",
    group: "Delivery",
    href: "/rostering",
    abilityErpName: "Booking Generator",
    showInSidebar: true,
  },
  {
    key: "timesheets",
    label: "Timesheets",
    group: "Delivery",
    href: "/timesheets",
    abilityErpName: "Timesheet",
    showInSidebar: true,
  },
  {
    key: "timesheet-approval",
    label: "Timesheet approval",
    group: "Delivery",
    href: "/timesheet-approval",
    abilityErpName: "Timesheet approval",
    showInSidebar: true,
  },
  {
    key: "generate-timesheets",
    label: "Generate timesheets",
    group: "Delivery",
    href: "/generate-timesheets",
    abilityErpName: "Generate Timesheets",
    showInSidebar: true,
  },
  {
    key: "claims",
    label: "Claims",
    group: "Finance",
    href: "/claims",
    abilityErpName: "Claim",
    showInSidebar: true,
  },
  {
    key: "generate-claims",
    label: "Generate claims",
    group: "Finance",
    href: "/generate-claims",
    abilityErpName: "Generate Claims",
    showInSidebar: true,
  },
  {
    key: "invoices",
    label: "Invoices",
    group: "Finance",
    href: "/invoices",
    abilityErpName: "Invoice",
    showInSidebar: true,
  },
  {
    key: "generate-invoices",
    label: "Generate invoices",
    group: "Finance",
    href: "/generate-invoices",
    abilityErpName: "Generate Invoices",
    showInSidebar: true,
  },
  {
    key: "plan-reconciliation",
    label: "Plan reconciliation",
    group: "Finance",
    href: "/plan-reconciliation",
    abilityErpName: "Plan reconciliation",
    showInSidebar: true,
  },
  {
    key: "claim-reconciliation",
    label: "Claim reconciliation",
    group: "Finance",
    href: "/claim-reconciliation",
    abilityErpName: "Claim reconciliation",
    showInSidebar: true,
  },
  {
    key: "invoice-reconciliation",
    label: "Invoice reconciliation",
    group: "Finance",
    href: "/invoice-reconciliation",
    abilityErpName: "Invoice reconciliation",
    showInSidebar: true,
  },
  {
    key: "financial-close",
    label: "Financial close",
    group: "Finance",
    href: "/financial-close",
    abilityErpName: "Financial close",
    showInSidebar: true,
  },
  {
    key: "ndis-audit-pack",
    label: "NDIS audit pack",
    group: "Delivery",
    href: "/ndis-audit-pack",
    abilityErpName: "NDIS audit pack",
    showInSidebar: true,
  },
  {
    key: "board-reporting",
    label: "Board reporting",
    group: "Delivery",
    href: "/board-reporting",
    abilityErpName: "Board reporting",
    showInSidebar: true,
  },
];

const WORKFORCE_WINDOWS: AccessWindow[] = [
  {
    key: "workforce-planning",
    label: "Workforce planning",
    group: "Workforce planning",
    href: "/workforce-planning",
    abilityErpName: "Workforce planning",
    showInSidebar: true,
  },
  {
    key: "workforce-organisation",
    label: "Organisation structure",
    group: "Workforce planning",
    href: "/workforce-planning/organisation",
    parentWindowKey: "workforce-planning",
    abilityErpName: "Organisation structure",
    showInSidebar: true,
  },
  {
    key: "training-meetings",
    label: "Training and meetings",
    group: "Workforce planning",
    href: "/workforce-planning/training",
    parentWindowKey: "workforce-planning",
    abilityErpName: "Training and meeting scheduling",
    showInSidebar: true,
  },
  {
    key: "workforce-org-edit",
    label: "Edit organisation structure",
    group: "Workforce planning",
    parentWindowKey: "workforce-organisation",
    abilityErpName: "Organisation structure — edit",
    showInSidebar: false,
  },
  {
    key: "workforce-org-chart-tier",
    label: "Edit org chart tiers",
    group: "Workforce planning",
    parentWindowKey: "workforce-organisation",
    abilityErpName: "Organisation structure — chart tiers",
    showInSidebar: false,
  },
];

const MY_WORKPLACE_WINDOWS: AccessWindow[] = [
  {
    key: "my-workplace",
    label: "My workplace",
    group: "My workplace",
    href: "/my",
    abilityErpName: "My workplace",
    showInSidebar: true,
  },
  {
    key: "my-leave",
    label: "My leave",
    group: "My workplace",
    href: "/my/leave",
    parentWindowKey: "my-workplace",
    abilityErpName: "My leave",
    showInSidebar: false,
  },
  {
    key: "my-profile",
    label: "About me",
    group: "My workplace",
    href: "/my/profile",
    parentWindowKey: "my-workplace",
    abilityErpName: "About me",
    showInSidebar: false,
  },
  {
    key: "my-availability",
    label: "My availability",
    group: "My workplace",
    href: "/my/availability",
    parentWindowKey: "my-workplace",
    abilityErpName: "My availability",
    showInSidebar: false,
  },
  {
    key: "my-contracts",
    label: "My contracts",
    group: "My workplace",
    href: "/my/contracts",
    parentWindowKey: "my-workplace",
    abilityErpName: "My contracts",
    showInSidebar: false,
  },
  {
    key: "my-open-shifts",
    label: "Open shifts",
    group: "My workplace",
    href: "/my/open-shifts",
    parentWindowKey: "my-workplace",
    abilityErpName: "Open shifts marketplace",
    showInSidebar: false,
  },
  {
    key: "my-shifts",
    label: "My shifts",
    group: "My workplace",
    href: "/my/shifts",
    parentWindowKey: "my-workplace",
    abilityErpName: "My shifts check-in",
    showInSidebar: false,
  },
  {
    key: "my-timesheets",
    label: "My timesheets",
    group: "My workplace",
    href: "/my/timesheets",
    parentWindowKey: "my-workplace",
    abilityErpName: "My timesheets",
    showInSidebar: false,
  },
  {
    key: "my-credentials",
    label: "My credentials",
    group: "My workplace",
    href: "/my/credentials",
    parentWindowKey: "my-workplace",
    abilityErpName: "My credentials",
    showInSidebar: false,
  },
];

const REPORT_WINDOWS: AccessWindow[] = [
  {
    key: "reports-advance",
    label: "Reports Advance",
    group: "Core",
    surface: "system",
    parentWindowKey: "reports",
    href: "/system/admin/reports-advance",
    abilityErpName: "Reports — SQL console",
    showInSidebar: false,
  },
];

const ADMIN_WINDOWS: AccessWindow[] = [
  {
    key: "admin-organization",
    label: "Organisation",
    group: "Admin",
    href: "/admin/organization",
    abilityErpName: "Client Organization",
    showInSidebar: false,
  },
  {
    key: "admin-security",
    label: "Security settings",
    group: "Admin",
    href: "/admin/security",
    abilityErpName: "Security settings",
    showInSidebar: true,
  },
  {
    key: "admin-reference-data",
    label: "Reference data",
    group: "Admin",
    href: "/admin/reference-data",
    abilityErpName: "Reference data / System configurator",
    showInSidebar: false,
  },
  {
    key: "admin-pay-periods",
    label: "Pay periods",
    group: "Admin",
    href: "/admin/pay-periods",
    abilityErpName: "Pay period definitions",
    showInSidebar: false,
  },
  {
    key: "admin-roles",
    label: "Roles",
    group: "Admin",
    href: "/admin/roles",
    abilityErpName: "Role",
    showInSidebar: true,
  },
  {
    key: "admin-communications",
    label: "Communications",
    group: "Admin",
    href: "/admin/communications",
    abilityErpName: "Admin communications hub",
    showInSidebar: true,
  },
  {
    key: "admin-task-management",
    label: "Task management",
    group: "Admin",
    surface: "system",
    href: "/system/admin/task-management",
    abilityErpName: "Request type / Task management",
    showInSidebar: true,
  },
  {
    key: "admin-task-automations",
    label: "Task automations",
    group: "Admin",
    surface: "system",
    href: "/system/admin/task-automations",
    abilityErpName: "Task automation rules",
    showInSidebar: true,
  },
  {
    key: "admin-document-templates",
    label: "Document templates",
    group: "Admin",
    surface: "system",
    href: "/system/admin/document-templates",
    abilityErpName: "Document templates",
    showInSidebar: true,
  },
  {
    key: "admin-document-email",
    label: "Email content",
    group: "Admin",
    surface: "system",
    href: "/system/admin/document-email",
    abilityErpName: "Document email content",
    showInSidebar: true,
  },
  {
    key: "admin-document-registry",
    label: "Document registry",
    group: "Admin",
    surface: "system",
    href: "/system/admin/document-registry",
    abilityErpName: "Generated document registry",
    showInSidebar: false,
  },
  {
    key: "admin-user-session-audit",
    label: "User Session Audit",
    group: "Admin",
    surface: "system",
    href: "/system/admin/user-session-audit",
    abilityErpName: "User Session Audit",
    showInSidebar: true,
  },
  {
    key: "admin-process-audit",
    label: "Process Audit",
    group: "Admin",
    surface: "system",
    href: "/system/admin/process-audit",
    abilityErpName: "Process Audit",
    showInSidebar: true,
  },
  {
    key: "admin-ai-query-audit",
    label: "AI Query Audit",
    group: "Admin",
    surface: "system",
    href: "/system/admin/ai-query-audit",
    abilityErpName: "AI Query Audit",
    showInSidebar: true,
  },
  {
    key: "system-time-and-date",
    label: "Time & date",
    group: "Admin",
    surface: "system",
    href: "/system/settings/time-and-date",
    abilityErpName: "Time & date",
    showInSidebar: false,
  },
  {
    key: "system-incident-management",
    label: "Incident management",
    group: "Admin",
    surface: "system",
    href: "/system/settings/incident-management",
    abilityErpName: "Incident management",
    showInSidebar: false,
  },
  {
    key: "system-leave-policy",
    label: "Leave self-service",
    group: "Admin",
    surface: "system",
    href: "/system/settings/leave",
    abilityErpName: "Leave self-service",
    showInSidebar: false,
  },
  {
    key: "system-shift-monitoring",
    label: "Shift check-in monitoring",
    group: "Admin",
    surface: "system",
    href: "/system/settings/shift-monitoring",
    abilityErpName: "Shift check-in monitoring",
    showInSidebar: false,
  },
  {
    key: "system-availability-policy",
    label: "Availability hours",
    group: "Admin",
    surface: "system",
    href: "/system/settings/availability",
    abilityErpName: "Availability hours",
    showInSidebar: false,
  },
  {
    key: "system-price-update-review",
    label: "Price Dependant Updater",
    group: "Services",
    surface: "system",
    href: "/system/services/price-update-review",
    abilityErpName: "Price Dependant Updater",
    showInSidebar: true,
  },
  {
    key: "system-ndis-price-importer",
    label: "NDIS Price Guide Importer",
    group: "Services",
    surface: "system",
    href: "/system/services/ndis-price-importer",
    abilityErpName: "NDIS Price Guide Importer",
    showInSidebar: true,
  },
  {
    key: "admin-record-retention",
    label: "Record retention settings",
    group: "Admin",
    surface: "system",
    href: "/system/settings/record-retention",
    abilityErpName: "Record retention settings",
    showInSidebar: false,
  },
  {
    key: "admin-ai-agents",
    label: "AI assistants",
    group: "Admin",
    href: "/admin/ai-agents",
    abilityErpName: "AI assistants",
    showInSidebar: false,
  },
];

export const ACCESS_WINDOWS: AccessWindow[] = [
  ...PARENT_WINDOWS,
  ...homePanelAccessWindows(),
  ...TASK_WINDOWS,
  moduleWindow("enquiries"),
  ...ENQUIRY_DEPENDENT_WINDOWS,
  moduleWindow("clients"),
  ...CLIENT_DEPENDENT_WINDOWS,
  moduleWindow("incidents"),
  ...INCIDENT_DEPENDENT_WINDOWS,
  ...INCIDENT_EXTRA_WINDOWS,
  moduleWindow("complaints"),
  ...LOCATION_DEPENDENT_WINDOWS,
  moduleWindow("locations"),
  ...LOCATION_FEATURE_WINDOWS,
  ...FLEET_DEPENDENT_WINDOWS,
  moduleWindow("fleet"),
  ...MAINTENANCE_DEPENDENT_WINDOWS,
  moduleWindow("maintenance"),
  ...EMPLOYEE_DEPENDENT_WINDOWS,
  moduleWindow("employees"),
  moduleWindow("agency-workers"),
  moduleWindow("agency-timesheets"),
  moduleWindow("generate-agency-timesheets"),
  moduleWindow("vendor-invoices"),
  ...WORKFORCE_WINDOWS,
  ...MY_WORKPLACE_WINDOWS,
  moduleWindow("business-partners"),
  moduleWindow("products"),
  ...PRODUCT_DEPENDENT_WINDOWS,
  moduleWindow("price-lists"),
  ...PRICE_LIST_DEPENDENT_WINDOWS,
  moduleWindow("service-agreements"),
  ...SERVICE_AGREEMENT_DEPENDENT_WINDOWS,
  moduleWindow("contracts"),
  ...CONTRACT_DEPENDENT_WINDOWS,
  ...DELIVERY_WINDOWS,
  ...SERVICE_BOOKING_DEPENDENT_WINDOWS,
  moduleWindow("reports"),
  ...REPORT_WINDOWS,
  ...ADMIN_WINDOWS,
];

export const TASK_WINDOW_KEYS = TASK_WINDOWS.map((w) => w.key);

export const ACCESS_PROCESSES: AccessProcess[] = [
  {
    id: "ai-prepare-record",
    label: "AI prepare record",
    description: "Assistant prepares a draft for human review and save on a form",
  },
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
  {
    id: "assign-location-client",
    label: "Assign client to location",
    description: "Link support receivers to a support location",
    parentWindowKey: "location-clients",
  },
  {
    id: "assign-location-employee",
    label: "Assign employee to location",
    description: "Link staff to a support location",
    parentWindowKey: "location-employees",
  },
  {
    id: "assign-location-product",
    label: "Assign product to location",
    description: "Link products and services offered at a support location",
    parentWindowKey: "location-products-and-services",
  },
  {
    id: "report-incident",
    label: "Report incident",
    description: "Create and submit an incident report with linked parties and evidence",
    parentWindowKey: "incidents",
  },
  {
    id: "notify-ndis-reportable",
    label: "Notify NDIS Commission",
    description: "Record NDIS reportable incident notification within required timeframes",
    parentWindowKey: "incidents",
  },
  {
    id: "assign-task",
    label: "Assign task",
    description: "Create and assign a task on a record (user or role)",
  },
  {
    id: "request-activity-deletion",
    label: "Request activity deletion",
    description: "Ask an administrator to remove an activity line from a client, enquiry, employee, or location record",
  },
  {
    id: "request-agency-coverage",
    label: "Request agency coverage",
    description: "Create an agency shift request for a vacant roster shift",
    parentWindowKey: "rostering",
  },
  {
    id: "send-agency-shift-pack",
    label: "Send agency shift pack",
    description: "Email shift details to the agency vendor via mailto draft",
    parentWindowKey: "rostering",
  },
  {
    id: "confirm-agency-shift",
    label: "Confirm agency shift",
    description: "Confirm agency worker proposed in the portal after orientation check",
    parentWindowKey: "rostering",
  },
  {
    id: "complete-agency-shift",
    label: "Complete agency shift",
    description: "Mark agency-covered shift as completed",
    parentWindowKey: "rostering",
  },
  {
    id: "approve-vendor-invoice",
    label: "Approve vendor invoice",
    description: "Approve agency vendor invoice submitted from the agency portal",
    parentWindowKey: "vendor-invoices",
  },
  {
    id: "mark-vendor-invoice-paid",
    label: "Mark vendor invoice paid",
    description: "Mark approved agency vendor invoice as paid",
    parentWindowKey: "vendor-invoices",
  },
  {
    id: "action-task",
    label: "Action task",
    description: "Start, complete or cancel tasks assigned to you or your role",
  },
  {
    id: "submit-leave-request",
    label: "Submit leave request",
    description: "Staff submit leave for manager approval",
    parentWindowKey: "my-leave",
  },
  {
    id: "submit-employee-credential",
    label: "Submit credential",
    description: "Staff submit credentials with evidence for HR review and sign-off",
    parentWindowKey: "my-credentials",
  },
  {
    id: "submit-leave-on-behalf",
    label: "Submit leave on behalf",
    description: "Managers and rostering staff submit leave for an employee from workforce planning",
    parentWindowKey: "workforce-planning",
  },
  {
    id: "review-employee-credential",
    label: "Review employee credential",
    description: "HR reviews staff-submitted credentials and signs off or rejects with feedback",
    parentWindowKey: "workforce-planning",
  },
  {
    id: "approve-leave-request",
    label: "Approve leave request",
    description: "Managers and HR approve or decline pending leave requests",
    parentWindowKey: "workforce-planning",
  },
  {
    id: "approve-timesheet",
    label: "Approve timesheet",
    description: "Supervisors approve submitted timesheets within their management line or site scope",
    parentWindowKey: "timesheet-approval",
  },
  {
    id: "print-invoice",
    label: "Print invoice",
    description: "Print or download an invoice using the assigned document template",
    parentWindowKey: "invoices",
  },
  {
    id: "batch-print-invoices",
    label: "Batch print invoices",
    description: "Generate documents for multiple invoices in one run",
    parentWindowKey: "invoices",
  },
  {
    id: "print-service-agreement",
    label: "Print service agreement",
    description: "Print or download a service agreement using the assigned document template",
    parentWindowKey: "service-agreements",
  },
  {
    id: "print-agreement-variation",
    label: "Print agreement variation",
    description: "Print or download an agreement variation document",
    parentWindowKey: "service-agreements",
  },
  {
    id: "print-employee-contract",
    label: "Generate employee contract",
    description: "Generate an employment contract document and HR file line",
    parentWindowKey: "employee-documents",
  },
  {
    id: "print-employee-offer",
    label: "Generate offer of employment",
    description: "Generate an offer letter, save to the document registry, and add an HR file line",
    parentWindowKey: "employee-documents",
  },
  {
    id: "print-enquiry-acknowledgement",
    label: "Print enquiry acknowledgement",
    description: "Print or download an acknowledgement letter for a new enquiry",
    parentWindowKey: "enquiries",
  },
  {
    id: "print-remittance-cover",
    label: "Print remittance cover",
    description: "Print a remittance advice cover sheet for invoice reconciliation",
    parentWindowKey: "invoice-reconciliation",
  },
  {
    id: "print-participant-statement",
    label: "Print participant statement",
    description: "Print a participant service statement from the client Overview tab",
    parentWindowKey: "client-overview",
  },
  {
    id: "print-board-report",
    label: "Print board report",
    description: "Print or export a board report pack to the document registry",
    parentWindowKey: "board-reporting",
  },
  {
    id: "send-invoice",
    label: "Send invoice via email",
    description: "Generate invoice PDF, save to the registry, and hand off via Send via Email",
    parentWindowKey: "invoices",
  },
  {
    id: "print-claim-batch",
    label: "Print claim batch summary",
    description: "Print a claim batch cover sheet and line summary",
    parentWindowKey: "claims",
  },
  {
    id: "print-incident-notification",
    label: "Print incident notification",
    description: "Print a formal incident notification letter",
    parentWindowKey: "incidents",
  },
  {
    id: "print-audit-pack",
    label: "Print audit pack report",
    description: "Print the NDIS audit readiness report for a selected month",
    parentWindowKey: "ndis-audit-pack",
  },
  {
    id: "print-consent-schedule",
    label: "Print consent schedule",
    description: "Print participant consent and information sharing schedule from Overview",
    parentWindowKey: "client-overview",
  },
  {
    id: "print-support-plan",
    label: "Print support plan",
    description: "Print the participant support plan for workers, coordinators, and audits",
    parentWindowKey: "client-support-plan",
  },
  {
    id: "send-support-plan",
    label: "Send support plan via email",
    description: "Generate support plan PDF, save to the registry, and hand off via Send via Email",
    parentWindowKey: "client-support-plan",
  },
  {
    id: "print-employee-separation",
    label: "Generate separation letter",
    description: "Generate an employment separation letter and HR file line",
    parentWindowKey: "employee-documents",
  },
  {
    id: "manage-session-audit-risk",
    label: "Investigate session risk",
    description: "Review flagged sessions, update risk status, and add investigation notes",
    parentWindowKey: "admin-user-session-audit",
  },
  {
    id: "view-session-sensitive-session-data",
    label: "View sensitive session data",
    description: "View IP address, device information, and user agent in session audit",
    parentWindowKey: "admin-user-session-audit",
  },
  {
    id: "manage-process-audit-risk",
    label: "Investigate process risk",
    description: "Review flagged process executions, update risk status, and add investigation notes",
    parentWindowKey: "admin-process-audit",
  },
  {
    id: "view-process-audit-sensitive",
    label: "View sensitive process data",
    description: "View IP address, device information, and user agent in process audit",
    parentWindowKey: "admin-process-audit",
  },
  {
    id: "manage-ai-query-audit-risk",
    label: "Investigate AI query risk",
    description: "Review flagged AI queries, update risk status, and add investigation notes",
    parentWindowKey: "admin-ai-query-audit",
  },
  {
    id: "view-ai-query-audit-sensitive",
    label: "View sensitive AI query data",
    description: "View full query text, IP address, and device information in AI query audit",
    parentWindowKey: "admin-ai-query-audit",
  },
  {
    id: "manage-retention-settings",
    label: "Manage retention settings",
    description: "Configure record retention policies and session security settings",
    parentWindowKey: "admin-record-retention",
  },
];

export const MY_WORKPLACE_WINDOW_KEYS = MY_WORKPLACE_WINDOWS.map((w) => w.key);

export const ALL_WINDOW_KEYS = ACCESS_WINDOWS.map((w) => w.key);

/** Windows assignable via workspace roles — excludes System-surface windows. */
export const APP_WINDOW_KEYS = ACCESS_WINDOWS.filter((w) => w.surface !== "system").map((w) => w.key);

/** Delivery group windows shown in the workspace sidebar (catalog-driven). */
export function deliverySidebarWindows(): AccessWindow[] {
  return DELIVERY_WINDOWS.filter((w) => w.group === "Delivery" && w.showInSidebar !== false && w.href);
}

/** Finance group windows shown in the workspace sidebar (catalog-driven). */
export function financeSidebarWindows(): AccessWindow[] {
  return ACCESS_WINDOWS.filter((w) => w.group === "Finance" && w.showInSidebar !== false && w.href);
}

export const SYSTEM_SURFACE_WINDOW_KEYS = ACCESS_WINDOWS.filter((w) => w.surface === "system").map((w) => w.key);

export function windowSurface(key: string): "app" | "system" {
  return windowByKey(key)?.surface ?? "app";
}

export function isSystemSurfaceWindow(key: string): boolean {
  return windowSurface(key) === "system";
}

export function appRoleWindows() {
  return ACCESS_WINDOWS.filter((w) => w.surface !== "system");
}

export function sanitizeAppWindowKeys(windowKeys: string[]): string[] {
  return windowKeys.filter((key) => !isSystemSurfaceWindow(key));
}

export const ALL_PROCESS_IDS = ACCESS_PROCESSES.map((p) => p.id);

export { EMPLOYEE_DEPENDENT_WINDOWS, CLIENT_DEPENDENT_WINDOWS, LOCATION_DEPENDENT_WINDOWS };

export function windowByKey(key: string) {
  return ACCESS_WINDOWS.find((w) => w.key === key);
}

export function processById(id: string) {
  return ACCESS_PROCESSES.find((p) => p.id === id);
}

export function childWindows(parentKey: string) {
  return ACCESS_WINDOWS.filter((w) => w.parentWindowKey === parentKey);
}

export function appChildWindows(parentKey: string) {
  return childWindows(parentKey).filter((w) => w.surface !== "system");
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
    (w) =>
      w.surface !== "system" &&
      w.showInSidebar !== false &&
      w.href &&
      canAccessWindow(windowKeys, w.key)
  );
}

export function detailTabsForRole(parentWindowKey: string, windowKeys: string[]): string[] {
  if (!canAccessWindow(windowKeys, parentWindowKey)) return [];
  return childWindows(parentWindowKey)
    .filter((w) => w.detailTab && canAccessWindow(windowKeys, w.key))
    .map((w) => w.detailTab!);
}

export function windowKeyForDetailTab(parentWindowKey: string, tab: string) {
  return childWindows(parentWindowKey).find((w) => w.detailTab === tab)?.key;
}

const DETAIL_TAB_KEY_PREFIX: Record<string, string> = {
  clients: "client",
  employees: "employee",
  locations: "location",
  fleet: "fleet",
  enquiries: "enquiry",
  incidents: "incident",
};

const DETAIL_TAB_KEY_OVERRIDES: Record<string, Record<string, string>> = {
  employees: {
    Address: "employee-locations",
    "Skills & languages": "employee-skills",
  },
  locations: {
    "Contact & address": "location-contact-and-address",
    "Products & services": "location-products-and-services",
  },
};

/** Catalog key for a detail tab, with naming-convention fallback when the catalog is stale. */
export function resolveDetailWindowKey(parentWindowKey: string, tab: string): string | undefined {
  const fromCatalog = windowKeyForDetailTab(parentWindowKey, tab);
  if (fromCatalog) return fromCatalog;
  const prefix = DETAIL_TAB_KEY_PREFIX[parentWindowKey];
  if (!prefix) return undefined;
  const overrides = DETAIL_TAB_KEY_OVERRIDES[parentWindowKey];
  return overrides?.[tab] ?? `${prefix}-${tabToWindowSlug(tab)}`;
}

/** Tab list in UI group order, gated by role window keys (resilient to catalog/session drift). */
export function allowedDetailTabsFromGroups(
  parentWindowKey: string,
  tabGroups: readonly { tabs: readonly string[] }[],
  windowKeys: string[]
): string[] {
  if (!canAccessWindow(windowKeys, parentWindowKey)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const group of tabGroups) {
    for (const tab of group.tabs) {
      if (seen.has(tab)) continue;
      seen.add(tab);
      const key = resolveDetailWindowKey(parentWindowKey, tab);
      if (key && canAccessWindow(windowKeys, key)) out.push(tab);
    }
  }
  return out;
}

/** @deprecated Use detailTabsForRole("employees", windowKeys) */
export function employeeTabsForRole(windowKeys: string[]) {
  return detailTabsForRole("employees", windowKeys);
}

/** @deprecated Use windowKeyForDetailTab("employees", tab) */
export function windowKeyForEmployeeTab(tab: string) {
  return windowKeyForDetailTab("employees", tab);
}
