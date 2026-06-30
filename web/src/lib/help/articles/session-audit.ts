import type { HelpArticle } from "@/lib/help/types";

export const securitySettingsArticle: HelpArticle = {
  id: "article-security-settings",
  slug: "security-settings",
  title: "Security settings",
  summary: "Set the idle timeout that protects unattended workspace sessions.",
  category: "Admin",
  keywords: ["security", "session", "timeout", "idle", "sign out", "admin"],
  relatedRoutes: ["/admin/security", "/login"],
  windowKeys: ["admin-security"],
  lastUpdated: "2026-06-30",
  sections: [
    {
      id: "overview",
      title: "What Security settings controls",
      body: "Security settings controls the workspace idle timeout. When a staff session is inactive for the configured number of minutes, AbilityVua shows a 2-minute warning. If the user does not click Stay signed in, the app logs them out and records the session as timed out.",
    },
    {
      id: "configure-timeout",
      title: "Set the idle timeout",
      steps: [
        "Open Admin > Security settings.",
        "Enter a whole number of minutes from 5 to 120.",
        "Click Save security settings.",
        "Ask signed-in users to refresh or sign in again if you need the new value applied immediately.",
      ],
      relatedRoutes: ["/admin/security"],
    },
    {
      id: "user-warning",
      title: "What staff see",
      body: "Staff see a centred Session expiring modal with a countdown and a Stay signed in button. The modal does not close from Escape or backdrop click. If the countdown reaches zero, the login page shows that the session expired due to inactivity.",
    },
  ],
};

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

export const timeAndDateArticle: HelpArticle = {
  id: "article-time-and-date",
  slug: "time-and-date",
  title: "Time & date",
  summary:
    "Set the organisation timezone for the sidebar clock, My shifts, roster dates, and session audit display.",
  category: "System setup",
  keywords: ["timezone", "time", "date", "clock", "organisation", "IANA", "Australia"],
  relatedRoutes: ["/system/settings/time-and-date"],
  windowKeys: ["system-time-and-date"],
  lastUpdated: "2026-06-18",
  sections: [
    {
      id: "overview",
      title: "What Time & date does",
      body: "AbilityVua shows live date and time under the logo in the workspace and System sidebars. The clock uses the organisation timezone — not your browser’s local zone. You cannot set a manual offset; only the IANA timezone name changes how dates and times display.",
    },
    {
      id: "access",
      title: "Who can access it",
      body: "Anyone signed in to System setup can open and change the organisation timezone. You do not need Record retention admin rights.",
    },
    {
      id: "set-timezone",
      title: "Set organisation timezone",
      steps: [
        "Sign in to System setup.",
        "Open Organisation → Time & date in the sidebar (or click the clock under the logo when signed in to System).",
        "Choose an IANA timezone (for example Australia/Adelaide for South Australia).",
        "Click Save timezone. The sidebar clock and My shifts dates update immediately.",
      ],
      relatedRoutes: ["/system/settings/time-and-date"],
    },
    {
      id: "clock",
      title: "Sidebar clock",
      body: "Staff see the live clock under the AbilityVua logo. In System setup, clicking the clock opens Time & date. In the workspace, the clock is read-only unless you are also signed in to System.",
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
  lastUpdated: "2026-06-30",
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
        "Session audit stale-session timeout for closing old monitoring rows",
      ],
    },
    {
      id: "workspace-idle-timeout",
      title: "Workspace idle timeout",
      body: "The live user warning and automatic workspace sign-out are configured separately under Admin > Security settings.",
      relatedRoutes: ["/admin/security"],
    },
    {
      id: "timezone",
      title: "Organisation timezone",
      body: "Timezone is configured separately under Organisation → Time & date. See the [Time & date](/system/guides/time-and-date) guide.",
      relatedRoutes: ["/system/settings/time-and-date"],
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
