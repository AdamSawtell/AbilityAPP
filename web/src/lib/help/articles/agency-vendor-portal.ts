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
    "/agency-portal/requests",
    "/agency-portal/timesheets",
    "/agency-portal/invoices",
  ],
  windowKeys: [],
  lastUpdated: "2026-06-25",
  sections: [
    {
      id: "overview",
      title: "What the agency vendor portal is",
      body: "The agency vendor portal is separate from the staff app. Providers email shift packs via mailto from roster Gaps; vendors confirm coverage and propose a worker here — staff then confirm on roster after orientation checks.\n\n• **Demo:** https://app.abilityvua.com/agency-portal/login\n• **Local:** http://localhost:3000/agency-portal/login\n\nDemo vendor: roster@staffplus.example (StaffPlus Agency).",
      relatedRoutes: ["/agency-portal"],
    },
    {
      id: "sign-in",
      title: "Sign in",
      steps: [
        "Open /agency-portal/login.",
        "Enter the email on the vendor business partner record (demo: roster@staffplus.example).",
        "Request a sign-in link and open the demo link when shown.",
      ],
      relatedRoutes: ["/agency-portal/login"],
    },
    {
      id: "shift-requests",
      title: "Confirm shift coverage",
      steps: [
        "Open **Shift requests** after the provider has sent a shift pack email.",
        "Open a request with status **Sent**.",
        "Select the agency worker who will attend and add continuity notes if needed.",
        "Select **Confirm coverage** — status becomes **Worker proposed** for staff roster confirmation.",
      ],
      relatedRoutes: ["/agency-portal/requests"],
    },
    {
      id: "invoices",
      title: "Submit invoices",
      steps: [
        "After the provider approves an agency timesheet, open **Invoices**.",
        "Choose the approved timesheet, enter your invoice number, date, and amount.",
        "Attach your invoice document — **PDF or image (JPEG, PNG, WebP), max 10 MB**. This is required; finance cannot process without it.",
        "Submit — finance reviews the invoice and attached document in **Vendor invoices** in the staff app.",
      ],
      relatedRoutes: ["/agency-portal/invoices", "/vendor-invoices"],
    },
  ],
};
