import type { HelpArticle } from "@/lib/help/types";

export const employeesArticle: HelpArticle = {
  id: "article-employees",
  slug: "employees",
  title: "Employees",
  summary: "HR records, credentials, leave, documents, compliance, and workforce review for staff.",
  category: "People",
  keywords: [
    "employee",
    "business partner",
    "credential",
    "document",
    "compliance",
    "work rights",
    "payroll",
    "leave approval",
    "credential review",
    "how to",
  ],
  relatedRoutes: ["/employees", "/employees/new", "/workforce-planning#reviews"],
  windowKeys: ["employees"],
  lastUpdated: "2026-06-19",
  sections: [
    {
      id: "employee-list",
      title: "Employees list",
      body: "The Employees list shows every staff member. Open a row to view or edit their file.",
      relatedRoutes: ["/employees"],
    },
    {
      id: "create-employee",
      title: "Create an employee",
      steps: [
        "Open People → Employees.",
        "Click New employee.",
        "Complete Overview, Contact, and Employment tabs.",
        "Save the record.",
        "Add credentials and documents on the Compliance and HR file tabs.",
      ],
      relatedRoutes: ["/employees/new"],
    },
    {
      id: "tab-groups",
      title: "Employee tab groups",
      bullets: [
        "Employee: Overview, Contact, Address, Emergency contacts, Employment, Work rights, Payroll, Leave, Schedule, Schedule template",
        "Compliance: Credentials Assigned, Alerts",
        "HR file: Documents, Activity, Skills and languages",
        "Organisation: System access",
      ],
    },
    {
      id: "leave",
      title: "Leave tab (HR view)",
      body: "Shows leave entitlements, balances, and requests. Staff submit from My workplace; managers and HR approve in Workforce planning → Review queue or on this tab. Approved leave reduces the matching entitlement balance.",
      windowKeys: ["employee-leave"],
      relatedRoutes: ["/workforce-planning#reviews", "/help/workforce-leave-calendar"],
    },
    {
      id: "credentials",
      title: "Credentials Assigned",
      body: "Track certifications, checks, and licences with issue and expiry dates. Staff can submit from My workplace with status Pending review until HR sets Current or Rejected. Expiry dates appear on Home calendar when the record is linked to your user account.",
      windowKeys: ["employee-credentials-assigned"],
    },
    {
      id: "documents",
      title: "Documents",
      body: "Store HR documents with type, reference or PDF URL, and expiry. Set Staff visible and Requires acknowledgement for items that should appear in My workplace → Contracts. Document expiry feeds the Home personal calendar for your own employee record.",
      windowKeys: ["employee-documents"],
    },
    {
      id: "schedule",
      title: "Schedule and template",
      body: "Schedule shows assigned roster shifts on a week calendar. Schedule template is the worker's weekly availability pattern — editable by coordinators with Workforce planning access, or by the worker on My workplace → Availability.",
      relatedRoutes: ["/workforce-planning#worker-supply", "/my/availability"],
      windowKeys: ["employee-schedule", "employee-schedule-template", "workforce-planning"],
    },
    {
      id: "review-access",
      title: "Who approves leave and credentials",
      bullets: [
        "Credential review: CEO, HR executive, HR manager, HR officer",
        "Leave approval: HR roles above, plus rostering manager and team leader for direct reports",
        "Workforce planning review queue is the fastest path; tasks are also created for assignees",
      ],
      relatedRoutes: ["/workforce-planning#reviews"],
    },
    {
      id: "system-access",
      title: "System access",
      body: "Link the employee to an AbilityVua user account. Administrators manage access under System → Admin → Roles and Employee → System access.",
      relatedRoutes: ["/system/admin/roles"],
      windowKeys: ["employee-system-access", "admin-roles"],
    },
  ],
};

export const businessPartnersArticle: HelpArticle = {
  id: "article-business-partners",
  slug: "business-partners",
  title: "Business partners",
  summary: "External organisations — plan managers, vendors, referrers, and NDIS partners — with communication and payment preferences.",
  category: "People",
  keywords: ["business partner", "plan manager", "vendor", "referrer", "invoice delivery", "payment terms"],
  relatedRoutes: ["/business-partners", "/business-partners/new"],
  windowKeys: ["business-partners"],
  lastUpdated: "2026-06-19",
  sections: [
    {
      id: "partner-list",
      title: "Business partners list",
      body: "People → Business partners lists plan managers, vendors, referrers, and other external organisations. Open a row to edit contact, communication, and payment details.",
      relatedRoutes: ["/business-partners"],
    },
    {
      id: "create-partner",
      title: "Create a business partner",
      steps: [
        "Open People → Business partners.",
        "Click New business partner.",
        "Enter search key, legal name, and partner type.",
        "Set communication and invoice delivery preferences.",
        "Add payment terms and remittance email for finance handoff.",
        "Save the record.",
      ],
      relatedRoutes: ["/business-partners/new"],
    },
    {
      id: "client-link",
      title: "Link to clients",
      body: "On a client Overview tab, use Billing & communication to set plan management type and default plan manager. On BP Associations, pick Directory partner to link a registry record or keep a free-text contact name for guardians and family.",
      relatedRoutes: ["/clients"],
      windowKeys: ["clients", "client-bp-associations"],
    },
  ],
};

export const agencyWorkersArticle: HelpArticle = {
  id: "article-agency-workers",
  slug: "agency-workers",
  title: "Agency workers",
  summary:
    "Register workers employed by agency vendors — flagged separately from internal employees and linked to who they work for.",
  category: "People",
  keywords: ["agency worker", "agency staffing", "vendor", "NDIS agency", "relief worker"],
  relatedRoutes: ["/agency-workers", "/agency-workers/new"],
  windowKeys: ["agency-workers", "rostering"],
  lastUpdated: "2026-06-24",
  sections: [
    {
      id: "agency-worker-register",
      title: "Agency worker register",
      body: "Agency workers are not full employee records. Each worker is linked to a staffing vendor business partner (NDIS agency or Vendor type).",
      steps: [
        "Open People → Agency workers.",
        "Click Add agency worker.",
        "Select Works for (agency vendor) — e.g. StaffPlus Agency.",
        "Enter name, contact, qualifications, and skills.",
        "Save — the worker appears in the register and can be proposed on agency shift requests.",
      ],
      relatedRoutes: ["/agency-workers", "/agency-workers/new"],
    },
    {
      id: "agency-coverage",
      title: "Request agency coverage on roster",
      body: "From Rostering → Gaps, use Request agency on a vacant shift to open the agency workflow: create request, propose worker, send shift pack email, confirm (with site orientation check), and complete.",
      relatedRoutes: ["/rostering"],
      windowKeys: ["rostering"],
    },
  ],
};
