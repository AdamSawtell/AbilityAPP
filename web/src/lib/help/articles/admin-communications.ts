import type { HelpArticle } from "@/lib/help/types";

export const adminCommunicationsArticle: HelpArticle = {
  id: "article-admin-communications",
  slug: "admin-communications",
  title: "Admin communications hub",
  summary: "Send in-app messages to staff with acknowledgment tracking for policy updates and operational notices.",
  category: "Admin",
  keywords: ["communications", "message", "announcement", "acknowledgment", "compliance", "broadcast"],
  relatedRoutes: ["/admin/communications"],
  windowKeys: ["admin-communications"],
  lastUpdated: "2026-06-28",
  sections: [
    {
      id: "overview",
      title: "What it does",
      body: "The Communications hub lets authorised administrators publish in-app messages to all users or selected roles. Messages can require a forced acknowledgment modal on login or appear as a dismissible home banner.",
      relatedRoutes: ["/admin/communications"],
      windowKeys: ["admin-communications"],
    },
    {
      id: "compose",
      title: "Compose and publish",
      body: "Open Admin → Communications. Enter a title and body (basic **bold**, bullet lines starting with -, and links). Choose the audience, acknowledgment requirement, optional publish and expiry times, then Preview and Publish.",
      steps: [
        "Open Admin → Communications → Compose.",
        "Enter title and body; check the estimated recipient count.",
        "Choose All users or Selected roles.",
        "Set Require acknowledgment and display method (modal or banner).",
        "Optionally schedule publish or expiry.",
        "Preview, then Publish message.",
      ],
      relatedRoutes: ["/admin/communications"],
      windowKeys: ["admin-communications"],
    },
    {
      id: "history",
      title: "Sent messages and acknowledgment register",
      body: "Published messages are read-only. Open Sent messages to view acknowledgment stats, close or re-open a message, remind pending recipients, or export the acknowledgment register as CSV.",
      relatedRoutes: ["/admin/communications"],
      windowKeys: ["admin-communications"],
    },
    {
      id: "recipients",
      title: "What staff see",
      body: "When a message requires acknowledgment, staff see a company message modal after sign-in until they confirm I have read and understood. FYI banner messages appear at the top of the workspace and can be dismissed.",
    },
  ],
};
