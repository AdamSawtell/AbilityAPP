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
  lastUpdated: "2026-06-24",
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
    {
      id: "agency-workers-tab",
      title: "Agency workers on staffing vendors",
      body:
        "When a business partner is type **Vendor** or **NDIS agency**, an **Agency workers** tab lists every relief worker linked to that vendor. Open StaffPlus Agency → Agency workers to see Jane Agency and Mike Relief in demo seed.\n\n" +
        "Use **Add agency worker** on the tab to pre-fill **Works for** with this vendor. Worker rows link to the agency register; rostering still uses Rostering → Gaps for coverage requests.",
      steps: [
        "Open People → Business partners and open a staffing vendor (e.g. StaffPlus Agency).",
        "Click the Agency workers tab — count badge shows linked workers.",
        "Open a worker row to edit qualifications and skills.",
        "Click Add agency worker to register someone new for this vendor.",
      ],
      relatedRoutes: ["/business-partners", "/agency-workers"],
      windowKeys: ["business-partners", "agency-workers"],
    },
  ],
};

export const agencyWorkersArticle: HelpArticle = {
  id: "article-agency-workers",
  slug: "agency-workers",
  title: "How to manage agency staff",
  summary:
    "Register relief workers employed by staffing vendors, keep them separate from your payroll employees, and fill vacant roster shifts through the agency coverage workflow.",
  category: "People",
  keywords: [
    "agency worker",
    "agency staffing",
    "agency staff",
    "vendor",
    "NDIS agency",
    "relief worker",
    "staffing vendor",
    "site orientation",
    "vacant shift",
    "roster gaps",
  ],
  relatedRoutes: ["/agency-workers", "/agency-workers/new", "/rostering", "/business-partners"],
  windowKeys: ["agency-workers", "rostering"],
  lastUpdated: "2026-06-23",
  sections: [
    {
      id: "agency-why-separate",
      title: "Why agency workers are not employees",
      body:
        "Agency staff are employed and paid by a third-party staffing vendor — not on your payroll. AbilityVua keeps them in a dedicated register so rostering, compliance, and audit stay clear about who is internal and who is supplied.\n\n" +
        "An agency worker record holds contact details, qualifications, and skills, and is always linked to **who they work for** (the vendor business partner). They do not get an employee HR file, My workplace login, or leave entitlements in your organisation. When a shift is covered by agency staff, the roster shift records the agency worker and vendor instead of an internal employee.\n\n" +
        "This separation matters for NDIS continuity of care, vendor invoicing (planned in a later slice), and site orientation rules — the same person may work at multiple sites through the same agency.",
      bullets: [
        "Internal employees — full HR file, credentials, My workplace, payroll export.",
        "Agency workers — vendor-linked register only; coverage workflow on vacant shifts.",
        "Roster shifts can show an **Agency** badge when coverage_source is agency.",
      ],
      relatedRoutes: ["/agency-workers", "/employees"],
    },
    {
      id: "agency-vendors",
      title: "Set up staffing vendors first",
      body:
        "Before you register workers, ensure each staffing agency exists as a **business partner** with type Vendor or NDIS agency. The vendor record supplies the legal entity name, email for shift packs, and the link every agency worker must point to.\n\n" +
        "On vendor business partners, open the **Agency workers** tab to see the worker pool for that agency and add new workers with **Works for** pre-filled.",
      steps: [
        "Open Business partners and locate or create the staffing vendor.",
        "Confirm type is appropriate (Vendor / agency) and email is correct — shift packs use mailto handoff to this address.",
        "Note the vendor name; you will select it as **Works for** on each agency worker and when requesting coverage.",
      ],
      relatedRoutes: ["/business-partners"],
    },
    {
      id: "agency-worker-register",
      title: "Register agency workers",
      body:
        "The agency worker register is under **People → Agency workers**. Each row is one named person supplied by one vendor. Coordinators and rostering staff with write access can add and edit records; the register is searchable by name and vendor.\n\n" +
        "Capture enough detail for roster matching: mobile phone, qualifications, and skills tags help when proposing a worker on a gap. Status **Active** means the worker can be proposed on new requests; set **Inactive** when the agency advises they are no longer available.",
      steps: [
        "Open People → Agency workers.",
        "Click Add agency worker.",
        "Select **Works for** — the staffing vendor business partner (required).",
        "Enter legal/preferred name, contact phone and email, qualifications, and skills.",
        "Save — audit footer records create/update; worker appears in the register and in the agency shift request picker.",
      ],
      relatedRoutes: ["/agency-workers", "/agency-workers/new"],
    },
    {
      id: "agency-site-orientation",
      title: "Site orientation (continuity of care)",
      body:
        "NDIS practice expects workers to be oriented to a site before delivering support there. AbilityVua tracks **site orientation** rows per worker type (agency or employee), location, and date.\n\n" +
        "Record orientations on **Locations → Site orientation** (all workers at that site) or on an **Agency worker** record (all sites for that worker). When you **confirm** an agency worker on a shift, the system checks orientation for that location — missing, expired, or a gap of one month or more since the worker last worked there blocks confirm until orientation is saved.\n\n" +
        "The agency shift drawer shows the gate result and an inline form when confirm is blocked. Demo: Jane Agency has orientation at Glenelg SIL (oriented 2025-09-01).",
      bullets: [
        "Orientation is checked at **Confirm agency shift**, not at request creation.",
        "Confirm is hard-blocked when orientation is missing, expired, or the 1-month site gap applies.",
        "Record orientation on the location tab, worker record, or inline in the agency drawer.",
      ],
      relatedRoutes: ["/locations", "/agency-workers"],
      windowKeys: ["agency-workers", "locations", "rostering"],
    },
    {
      id: "agency-find-gaps",
      title: "Find vacant shifts that need agency cover",
      body:
        "Agency coverage starts from roster **gaps** — shifts with no internal employee assigned, or weeks where authorised bookings lack staffed coverage. Open **Rostering**, set the week (demo vacant shift **BERN-TUE-VAC** is in the week starting **2025-10-06**), and switch to the **Gaps** tab.\n\n" +
        "Vacant shifts listed here are eligible for **Request agency**. Shifts already covered by agency staff (confirmed worker on file) drop out of the vacant gap count so you do not double-request.",
      steps: [
        "Open Rostering and navigate to the week with the vacant shift.",
        "Open the **Gaps** tab — review vacant shifts and under-covered booking weeks.",
        "Locate the shift that needs external cover (client, location, date, and time shown on the row).",
      ],
      relatedRoutes: ["/rostering"],
      windowKeys: ["rostering"],
    },
    {
      id: "agency-request-coverage",
      title: "Request agency coverage",
      body:
        "Click **Request agency** on a gap row to open the agency shift request drawer. You need the **Request agency coverage** process grant (rostering manager, rostering officer, coordinator, exec operations, or admin roles).\n\n" +
        "The request creates an **agency_shift_request** linked to the roster shift and vendor. If an open request already exists for that shift, the drawer reopens the existing request instead of duplicating. Document number is assigned for audit and email subject lines.",
      steps: [
        "On Gaps, click **Request agency** for the vacant shift.",
        "Select the **staffing vendor** (must match workers you will propose).",
        "Optionally enter skills required and continuity notes for the agency.",
        "Save — request status is **Open**; shift remains vacant until confirm.",
      ],
      relatedRoutes: ["/rostering"],
      windowKeys: ["rostering"],
    },
    {
      id: "agency-propose-and-send",
      title: "Propose a worker and send the shift pack",
      body:
        "After the request is open, propose a registered agency worker from the vendor’s pool. Status moves to **Worker proposed**. Then **Send shift pack** builds a structured email (client, location, date/time, shift ref, skills, proposed worker) and marks the request **Sent**.\n\n" +
        "Send uses your email client via **mailto** — AbilityVua does not send SMTP on your behalf. After the vendor replies (phone or email), continue in the drawer. Saved files and print log on the request record audit who sent the pack and when.",
      steps: [
        "In the agency drawer, pick **Propose worker** — choose an active agency worker for that vendor.",
        "Click **Send shift pack** — review the email draft; use **Open email draft** when ready.",
        "Vendor confirms availability off-system; return to AbilityVua to confirm or choose another worker.",
      ],
      windowKeys: ["rostering"],
    },
    {
      id: "agency-confirm-complete",
      title: "Confirm on roster and complete after delivery",
      body:
        "**Confirm agency shift** assigns the agency worker to the roster shift: coverage_source becomes agency, employee is cleared, vendor and request ids are stored. The week calendar shows the worker name with an **Agency** badge. Orientation must pass unless you override in a future admin slice.\n\n" +
        "After the shift is delivered, **Complete agency shift** closes the request and sets shift status to **Completed** for handoff to timesheet and claiming workflows (agency timesheet and vendor invoice paths are planned in WP-AG.4–5).",
      steps: [
        "Click **Confirm agency shift** — resolve any orientation error first.",
        "Verify the week view shows the worker with the Agency badge.",
        "After service delivery, click **Complete agency shift** in the drawer.",
        "Audit trail on the shift and request records who confirmed and completed.",
      ],
      relatedRoutes: ["/rostering"],
      windowKeys: ["rostering"],
    },
    {
      id: "agency-roles-audit",
      title: "Who can do what",
      body:
        "Window **agency-workers** (write) and all four agency processes are granted to Admin, CEO, Exec Operations, Rostering Manager, Rostering Officer, and Coordinator demo roles. Intake coordinators without rostering process grants will see the register but not **Request agency** on gaps.\n\n" +
        "Every save and document action writes to the record audit footer and process audit. Shift packs use template **send-agency-shift-pack**; see **How to print and send** from the request drawer when document actions are shown.",
      bullets: [
        "request-agency-coverage — start request from Gaps.",
        "send-agency-shift-pack — email pack to vendor.",
        "confirm-agency-shift — assign worker on roster + orientation gate.",
        "complete-agency-shift — close request after delivery.",
      ],
      relatedRoutes: ["/agency-workers", "/rostering"],
    },
    {
      id: "agency-future-slices",
      title: "Coming in later slices",
      body:
        "WP-AG.1 delivers the register, gap request workflow, orientation check at confirm, and roster badges. **WP-AG.2** adds the **Agency workers** tab on vendor business partners. Planned next: full site orientation UI on locations (WP-AG.3), agency timesheet lines and vendor cost (WP-AG.4), and vendor invoice AP-lite (WP-AG.5).",
    },
  ],
};
