import type { HelpArticle } from "@/lib/help/types";

export const priceUpdateReviewArticle: HelpArticle = {
  id: "article-price-update-review",
  slug: "price-update-review",
  title: "Price Dependant Updater",
  summary: "Review NDIS import impacts and safely apply approved rate changes to agreements, bookings, plans, and draft billing.",
  category: "System setup",
  keywords: ["price update", "NDIS", "impact", "variation", "consent", "agreement", "AB-0012"],
  relatedRoutes: ["/system/services/price-update-review", "/system/services/ndis-price-importer"],
  windowKeys: ["system-price-update-review"],
  lastUpdated: "2026-06-28",
  sections: [
    {
      id: "overview",
      title: "What this updater does",
      body: "After AB-0011 imports a new NDIS price guide, the Price Dependant Updater analyses dependent records — service agreements, bookings, plan budgets, monthly service plans, and draft claims/invoices — and classifies each impact by risk before any mutation.",
      relatedRoutes: ["/system/services/price-update-review"],
    },
    {
      id: "workflow",
      title: "Workflow",
      steps: [
        "Complete an AB-0011 import and apply the batch first.",
        "Open System → Services → Price Dependant Updater.",
        "Select the applied import batch and run impact analysis.",
        "Review the impact table — filter by safe, review, consent, or protected.",
        "Approve safe rows, create variation tasks for active/signed agreements, or ignore with reason.",
        "Record consent evidence before approving consent-required agreement rows.",
        "Confirm and apply approved updates only.",
        "Close the run when all impacts are resolved, ignored, protected, or applied.",
      ],
      relatedRoutes: ["/system/services/price-update-review"],
    },
    {
      id: "guardrails",
      title: "Checks and balances",
      bullets: [
        "Active and signed service agreements are not changed without consent evidence or a variation task.",
        "Submitted or accepted claims and issued or paid invoices are protected.",
        "Service dates before the new effective start are not repriced.",
        "Plan budget funding totals are not changed automatically — review projected spend only.",
        "Every run and apply action is stored with audit metadata.",
      ],
      relatedRoutes: ["/system/services/price-update-review"],
    },
  ],
};
