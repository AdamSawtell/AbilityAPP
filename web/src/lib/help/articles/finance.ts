import type { HelpArticle } from "@/lib/help/types";

export const financeArticle: HelpArticle = {
  id: "article-finance",
  slug: "finance",
  title: "Finance",
  summary:
    "Claims, invoices, vendor invoices, reconciliation, and financial close for finance and operations staff.",
  category: "Finance",
  keywords: [
    "finance",
    "claims",
    "invoices",
    "vendor invoices",
    "agency portal",
    "accounts payable",
    "reconciliation",
    "financial close",
  ],
  relatedRoutes: [
    "/claims",
    "/generate-claims",
    "/invoices",
    "/generate-invoices",
    "/vendor-invoices",
    "/plan-reconciliation",
    "/claim-reconciliation",
    "/invoice-reconciliation",
    "/financial-close",
  ],
  windowKeys: [],
  lastUpdated: "2026-06-25",
  sections: [
    {
      id: "finance-menu",
      title: "Finance menu",
      body:
        "Finance groups billing and accounts payable work in one sidebar menu. Access is still controlled by each window and process grant; the menu only shows links your role can open.",
      bullets: [
        "Claims and Generate claims: create and review NDIS claim batches.",
        "Invoices and Generate invoices: create participant/plan-manager invoices and send them by email handoff.",
        "Vendor invoices: review agency invoices submitted from the vendor portal.",
        "Plan, claim, and invoice reconciliation: compare planned, claimed, invoiced, and paid amounts.",
        "Financial close: complete month-end checks and variance review.",
      ],
    },
    {
      id: "vendor-invoices",
      title: "Agency vendor invoices",
      body:
        "Agency vendors submit invoices in their separate agency portal after an agency timesheet is approved. The vendor must attach a PDF or image of the invoice; finance reviews that document in the staff app before approval or payment.",
      steps: [
        "Open Finance -> Vendor invoices.",
        "Open a submitted invoice and review the timesheet, amount, invoice number, notes, and attached document.",
        "If the details match the approved timesheet, use Approve invoice.",
        "After payment is complete in the external payment process, use Mark paid.",
        "If details do not match, contact the vendor using the escalation path below before processing.",
      ],
      relatedRoutes: ["/vendor-invoices"],
    },
    {
      id: "vendor-escalation",
      title: "Vendor support and escalation",
      body:
        "Use the right contact path so shift, timesheet, and payment issues reach the right internal owner. Keep participant details inside AbilityVua or approved secure channels; do not send participant-sensitive details in unsupported email threads.",
      bullets: [
        "Shift pack, coverage, or proposed worker issue: Rostering team.",
        "Timesheet hours or approved-timesheet dispute: Rostering or operations manager.",
        "Invoice document, invoice number, amount, or payment status issue: Finance/AP team.",
        "Magic-link login or portal access issue: System administrator or provider support contact.",
        "Safeguarding, worker conduct, or participant risk concern: escalate immediately to the operational manager and incident pathway.",
      ],
    },
    {
      id: "claims-invoices",
      title: "Claims and participant invoices",
      steps: [
        "Generate timesheets and approve eligible timesheets before billing.",
        "Use Generate claims to preview and create claim batches.",
        "Use Claims to review validation, print claim summaries, and import remittance advice.",
        "Use Generate invoices to create invoice records when billing is ready.",
        "Open an invoice to Print, PDF, or Send via Email using the document section.",
      ],
      relatedRoutes: ["/generate-claims", "/claims", "/generate-invoices", "/invoices"],
    },
    {
      id: "reconciliation-close",
      title: "Reconciliation and close",
      body:
        "Reconciliation pages help finance compare plan budgets, claims, invoices, payments, and close readiness. Financial close should be used after claims, invoices, and payment advice are reviewed for the selected month.",
      relatedRoutes: [
        "/plan-reconciliation",
        "/claim-reconciliation",
        "/invoice-reconciliation",
        "/financial-close",
      ],
    },
  ],
};
