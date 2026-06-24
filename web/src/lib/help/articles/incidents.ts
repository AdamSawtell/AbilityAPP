import type { HelpArticle } from "@/lib/help/types";

export const incidentsArticle: HelpArticle = {
  id: "article-incidents",
  slug: "incident-reports",
  title: "Incident reports",
  summary: "Report incidents, track NDIS reportable notifications, and maintain an audit-ready record.",
  category: "Core",
  keywords: [
    "incident",
    "report incident",
    "NDIS",
    "reportable",
    "safeguards",
    "investigation",
    "compliance",
    "notification",
  ],
  relatedRoutes: ["/incidents", "/incidents/new", "/incidents/compliance", "/incidents/dashboard"],
  windowKeys: ["incidents"],
  lastUpdated: "2026-06-25",
  sections: [
    {
      id: "overview",
      title: "What incident reporting covers",
      body: "Incident reports capture what happened, who was involved, immediate actions, investigation, and NDIS Commission notifications. All incidents should be recorded — not only NDIS reportable events.",
      bullets: [
        "Overview: what happened, severity, dates, and NDIS reportable fields",
        "Parties & links: clients, employees, locations, and witnesses",
        "Investigation: actions, evidence references, and linked tasks",
        "Notifications: internal and Commission notification log",
      ],
      relatedRoutes: ["/incidents"],
    },
    {
      id: "report-from-home",
      title: "Report from Home",
      body: "Staff with the report-incident process can submit from Home without opening the full module first.",
      steps: [
        "On Home, click Report incident (amber button).",
        "Step 1 — What happened: title, description, when, category, and severity.",
        "Step 2 — Who was involved: link client, staff, and location (optional).",
        "Step 3 — Safeguards: mark NDIS reportable if required, choose type, add immediate actions.",
        "Submit report or Save draft.",
        "You land on the full record to add investigation detail and log notifications.",
      ],
      relatedRoutes: ["/"],
    },
    {
      id: "ndis-reportable",
      title: "NDIS reportable incidents",
      body: "When an incident is NDIS reportable, AbilityVua calculates the notification deadline from the awareness time. Most types require notification within 24 hours; unauthorised restrictive practice without harm may allow five business days.",
      bullets: [
        "Six reportable types align with NDIS Quality and Safeguards rules",
        "Overdue items appear on Home and in the sidebar badge",
        "Use NDIS compliance for a compliance hub and CSV export",
        "Portal submission to the Commission is outside AbilityVua — record the reference here",
      ],
      relatedRoutes: ["/incidents/compliance"],
      windowKeys: ["incidents-compliance"],
    },
    {
      id: "client-alerts",
      title: "Client alerts from reportable incidents",
      body: "When a reportable incident is linked to a client, AbilityVua adds an Incident alert on the client Alerts tab with Show as alert enabled. An activity line is logged when the incident is first marked reportable. Alerts clear when the incident is closed.",
      relatedRoutes: ["/clients"],
      windowKeys: ["clients", "client-alerts"],
    },
    {
      id: "record-line-drawers",
      title: "Edit parties, actions, evidence, and notifications",
      body: "Incident child tabs use a summary list with a side drawer. This keeps investigation detail readable while preserving the same parent-record save and audit trail.",
      steps: [
        "Open an incident record.",
        "Go to Parties & links, Investigation, Evidence, or Notifications.",
        "Click a row to open the side drawer and edit all fields for that line.",
        "Use Add party, Add action, Add attachment, or Log notification to create a new line; the drawer opens for the new item.",
        "Save the incident record to persist the line changes.",
      ],
      relatedRoutes: ["/incidents"],
      windowKeys: ["incidents"],
    },
    {
      id: "exports",
      title: "Audit exports",
      body: "Export incident data for governance reviews and Commission evidence packs.",
      bullets: [
        "NDIS compliance → Export NDIS CSV for open reportable incidents",
        "Reports → Incident register for all incidents",
        "Reports → NDIS reportable incidents for the full audit column set",
      ],
      relatedRoutes: ["/reports", "/incidents/compliance"],
    },
  ],
};

export const reportIncidentQuickArticle: HelpArticle = {
  id: "article-report-incident-quick",
  slug: "how-do-i-report-an-incident",
  title: "How do I report an incident?",
  summary: "Use Report incident on Home for the fastest path, or open the full form from Incident reports.",
  category: "Quick tasks",
  keywords: ["report incident", "how do i", "NDIS", "home", "quick report", "safeguard"],
  relatedRoutes: ["/", "/incidents/new"],
  windowKeys: ["incidents"],
  lastUpdated: "2026-06-16",
  sections: [
    {
      id: "fastest",
      title: "Fastest path — Home",
      steps: [
        "Go to Home.",
        "Click Report incident.",
        "Complete the three steps and submit.",
      ],
      relatedRoutes: ["/"],
    },
    {
      id: "full-form",
      title: "Full form",
      steps: [
        "Open Incident reports in the sidebar.",
        "Click Report incident.",
        "Use the same guided steps, then continue on the record tabs.",
      ],
      relatedRoutes: ["/incidents/new"],
    },
    {
      id: "after-submit",
      title: "After you submit",
      body: "Open the Notifications tab to log internal and NDIS Commission contact. Use Investigation for corrective actions. If the incident is reportable and linked to a client, check their Alerts tab for the automatic flag.",
    },
  ],
};
