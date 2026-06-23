import type { HelpArticle } from "@/lib/help/types";

export const complaintsFeedbackArticle: HelpArticle = {
  id: "article-complaints",
  slug: "complaints-feedback",
  title: "Complaints and feedback",
  summary: "View the complaints register drawn from client Activity and complaint-category incidents.",
  category: "People",
  keywords: ["complaint", "feedback", "quality", "register", "participant"],
  relatedRoutes: ["/complaints"],
  windowKeys: ["complaints"],
  lastUpdated: "2026-06-22",
  sections: [
    {
      id: "overview",
      title: "How complaints are logged",
      body: "AbilityVua does not use a separate complaints database. Log complaints on the client Activity tab (type Complaint) or as an incident with category Complaint. Feedback uses Activity type Feedback.",
      steps: [
        "Clients → open participant → Activity → Add activity → type Complaint or Feedback.",
        "Or Incidents → Report incident → category Complaint for formal complaint workflow.",
        "Open People → Complaints and feedback to review the combined register.",
      ],
      relatedRoutes: ["/complaints", "/clients", "/incidents"],
    },
    {
      id: "export",
      title: "Export and board reporting",
      body: "Export CSV from the register for quality review. Board reporting and the NDIS audit pack include complaints summary sections for the selected period.",
      relatedRoutes: ["/complaints", "/board-reporting", "/ndis-audit-pack"],
    },
  ],
};
