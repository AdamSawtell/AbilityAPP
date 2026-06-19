import type { HelpArticle } from "@/lib/help/types";

export const userSessionAuditArticle: HelpArticle = {
  id: "article-user-session-audit",
  slug: "user-session-audit",
  title: "User Session Audit",
  summary: "Review login activity, investigate flagged sessions, and export session data for compliance.",
  category: "System setup",
  keywords: ["session", "audit", "login", "security", "risk", "investigation"],
  relatedRoutes: ["/system/admin/user-session-audit"],
  windowKeys: ["admin-user-session-audit"],
  lastUpdated: "2026-06-20",
  sections: [
    {
      id: "overview",
      title: "What User Session Audit does",
      body: "User Session Audit records every login attempt and workspace session. Administrators can review dashboards, filter sessions, investigate risk flags, and export data. Record changes during a session are shown from the existing audit trail — not duplicated.",
    },
    {
      id: "access",
      title: "Who can access it",
      body: "System operators have full access from System setup. Optional workspace roles include Security Administrator (investigation and sensitive fields) and Audit Viewer (read-only, restricted fields).",
    },
    {
      id: "investigation",
      title: "Investigating a session",
      steps: [
        "Open System setup → Admin → User Session Audit.",
        "Use dashboard filters or the session list to find a session.",
        "Click Investigate to open the forensic view.",
        "Review risk indicators, timeline, and related audit activity.",
        "Add investigation notes and update risk status if you have permission.",
      ],
    },
  ],
};

export const recordRetentionArticle: HelpArticle = {
  id: "article-record-retention",
  slug: "record-retention",
  title: "Record retention settings",
  summary: "Configure how long user session data is kept. Audit records are permanent.",
  category: "System setup",
  keywords: ["retention", "session", "settings", "compliance", "delete"],
  relatedRoutes: ["/system/settings/record-retention"],
  windowKeys: ["admin-record-retention"],
  lastUpdated: "2026-06-20",
  sections: [
    {
      id: "overview",
      title: "Retention vs audit",
      body: "User session records can be removed after the configured retention period (default 90 days). The existing audit trail for record changes is permanent and is never deleted by retention settings.",
    },
    {
      id: "settings",
      title: "Available settings",
      bullets: [
        "User session data retention (days)",
        "Allow multiple concurrent sessions per user — Allow, Warn, or Prevent",
        "Session idle timeout (minutes)",
        "Organisation timezone for display",
      ],
    },
  ],
};
