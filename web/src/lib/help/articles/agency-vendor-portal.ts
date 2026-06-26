import type { HelpArticle } from "@/lib/help/types";

export const agencyVendorPortalArticle: HelpArticle = {
  id: "article-agency-vendor-portal",
  slug: "agency-vendor-portal",
  title: "Agency vendor portal",
  summary:
    "Agency staffing vendors sign in with a magic link, confirm shift coverage, propose workers, and submit invoices against approved agency timesheets.",
  category: "Core",
  keywords: [
    "agency portal",
    "vendor portal",
    "staffing agency",
    "shift pack",
    "agency worker",
    "vendor invoice",
    "magic link",
  ],
  relatedRoutes: [
    "/agency-portal",
    "/agency-portal/help",
    "/agency-portal/requests",
    "/agency-portal/timesheets",
    "/agency-portal/invoices",
  ],
  windowKeys: [],
  portalOnly: true,
  lastUpdated: "2026-06-25",
  sections: [
    {
      id: "overview",
      title: "What the agency vendor portal is",
      body: "The agency vendor portal is separate from the staff app. Providers email shift packs from roster Gaps; vendors confirm coverage and propose a worker here. Provider staff then complete final roster confirmation after orientation checks.\n\nThe home page is a dashboard. A 'Your next step' banner tells you the single most important action right now, summary tiles show how many shift requests await you, how many approved timesheets are ready to invoice, how many invoices are with finance, and how many are paid. Action cards carry live count badges so you can jump straight to the right place.\n\nDemo vendor: roster@staffplus.example (StaffPlus Agency).",
      relatedRoutes: ["/agency-portal"],
    },
    {
      id: "sign-in",
      title: "Sign in",
      steps: [
        "Open /agency-portal/login — the page shows your provider logo, name, address, and contact details.",
        "Enter the email on the vendor business partner record (demo: roster@staffplus.example).",
        "Request a sign-in link and open the demo link when shown.",
        "Use **How to use this portal** on the sign-in page for this guide, or **Staff sign in** for the staff app.",
      ],
      relatedRoutes: ["/agency-portal/login"],
    },
    {
      id: "shift-requests",
      title: "Confirm shift coverage",
      steps: [
        "Open Shift requests after the provider has sent a shift pack email.",
        "Open a request with status Sent.",
        "Select the agency worker who will attend and add continuity notes if needed.",
        "Select Confirm coverage. Status becomes Worker proposed for staff roster confirmation.",
      ],
      relatedRoutes: ["/agency-portal/requests"],
    },
    {
      id: "timesheets",
      title: "Review agency timesheets",
      steps: [
        "Open Timesheets after the provider has completed agency-covered shifts and generated agency timesheets.",
        "Review the period, approved hours, and vendor cost.",
        "If hours do not look right, contact the provider before submitting an invoice.",
      ],
      relatedRoutes: ["/agency-portal/timesheets"],
    },
    {
      id: "invoices",
      title: "Submit invoices",
      steps: [
        "After the provider approves an agency timesheet, open Invoices.",
        "Choose the approved timesheet, enter your invoice number, date, and amount.",
        "Attach your invoice document: PDF or image (JPEG, PNG, WebP), max 10 MB. This is required; finance cannot process without it.",
        "Submit. Finance reviews the invoice and attached document in Vendor invoices in the staff app.",
      ],
      relatedRoutes: ["/agency-portal/invoices"],
    },
    {
      id: "support-escalation",
      title: "Support and escalation",
      body:
        "Use the right support path so requests reach the provider team that can resolve them. Do not include participant-sensitive information in unsupported email threads; use the shift request, timesheet, or invoice reference where possible.",
      bullets: [
        "Shift pack, worker availability, or proposed worker change: contact the provider rostering team.",
        "Timesheet hours or shift completion question: contact provider rostering or operations.",
        "Invoice upload, invoice amount, or payment status: contact provider finance/AP.",
        "Magic-link or portal sign-in problem: contact the provider support/admin contact shown in the portal footer.",
        "Urgent participant safety, worker conduct, or safeguarding concern: call the provider immediately and ask for the operational escalation pathway.",
      ],
      relatedRoutes: ["/agency-portal/help"],
    },
  ],
};
