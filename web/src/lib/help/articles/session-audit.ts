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
  summary: "Configure how long session, process, and AI query monitoring data is kept. Audit records are permanent.",
  category: "System setup",
  keywords: ["retention", "session", "process", "ai query", "settings", "compliance", "delete"],
  relatedRoutes: ["/system/settings/record-retention"],
  windowKeys: ["admin-record-retention"],
  lastUpdated: "2026-06-20",
  sections: [
    {
      id: "overview",
      title: "Retention vs audit",
      body: "User session, process audit, and AI query metadata can be removed after the configured retention period (default 90 days). The existing audit trail for record changes is permanent and is never deleted by retention settings.",
    },
    {
      id: "settings",
      title: "Available settings",
      bullets: [
        "User session data retention (days)",
        "Process audit data retention (days)",
        "AI query audit metadata retention (days)",
        "Allow multiple concurrent sessions per user — Allow, Warn, or Prevent",
        "Session idle timeout (minutes)",
        "Organisation timezone for display",
      ],
    },
  ],
};

export const processAuditArticle: HelpArticle = {
  id: "article-process-audit",
  slug: "process-audit",
  title: "Process Audit",
  summary: "Review process executions, investigate flagged runs, and export process activity for compliance.",
  category: "System setup",
  keywords: ["process", "audit", "workflow", "security", "risk", "investigation"],
  relatedRoutes: ["/system/admin/process-audit"],
  windowKeys: ["admin-process-audit"],
  lastUpdated: "2026-06-20",
  sections: [
    {
      id: "overview",
      title: "What Process Audit does",
      body: "Process Audit records every execution of catalogued business processes — leave approval, credential review, task assignment, and more. Administrators can review dashboards, filter executions, investigate risk flags, and export data. Record field changes still come from the existing audit trail.",
    },
    {
      id: "access",
      title: "Who can access it",
      body: "System operators have full access from System setup. Optional workspace roles include Security Administrator (investigation and sensitive fields) and Audit Viewer (read-only, restricted fields).",
    },
    {
      id: "investigation",
      title: "Investigating a process execution",
      steps: [
        "Open System setup → Admin → Process Audit.",
        "Use dashboard filters or the execution list to find a run.",
        "Click Investigate to open the forensic view.",
        "Review risk indicators, timeline, and linked entity.",
        "Add investigation notes and update risk status if you have permission.",
      ],
    },
  ],
};

export const aiQueryAuditArticle: HelpArticle = {
  id: "article-ai-query-audit",
  slug: "ai-query-audit",
  title: "AI Query Audit",
  summary: "Review AI assistant usage, investigate flagged queries, and export query activity for compliance.",
  category: "System setup",
  keywords: ["ai", "query", "audit", "assistant", "chat", "security", "risk"],
  relatedRoutes: ["/system/admin/ai-query-audit"],
  windowKeys: ["admin-ai-query-audit"],
  lastUpdated: "2026-06-20",
  sections: [
    {
      id: "overview",
      title: "What AI Query Audit does",
      body: "AI Query Audit monitors AI assistant usage across the workspace. Chat content is stored once in the AI chat log; this module adds risk scoring, investigation tools, and compliance export without duplicating messages elsewhere.",
    },
    {
      id: "access",
      title: "Who can access it",
      body: "System operators have full access from System setup. Optional workspace roles include Security Administrator (investigation and full query text) and Audit Viewer (read-only, masked sensitive fields).",
    },
    {
      id: "investigation",
      title: "Investigating a query",
      steps: [
        "Open System setup → Admin → AI Query Audit.",
        "Use dashboard filters or the query list to find an interaction.",
        "Click Investigate to open the forensic view.",
        "Review risk indicators, query content, and tool calls.",
        "Add investigation notes and update risk status if you have permission.",
      ],
    },
  ],
};
