import type { HelpArticle } from "@/lib/help/types";

function moduleSetupArticle(
  slug: string,
  title: string,
  summary: string,
  setupRoute: string,
  refSection: string,
  checklist: string[]
): HelpArticle {
  return {
    id: `article-${slug}`,
    slug,
    title,
    summary,
    category: "System setup",
    keywords: [slug, "system setup", "reference data", "module setup"],
    relatedRoutes: [setupRoute, `/system/reference-data/${refSection}`],
    windowKeys: [],
    lastUpdated: "2026-06-18",
    sections: [
      {
        id: "open",
        title: `Open ${title.toLowerCase()}`,
        steps: [
          "Sign in to System setup.",
          `Open ${setupRoute} from Setup guides on the System home page, or use the direct link.`,
          "Work through the checklist, then open Reference data for dropdown lists.",
        ],
        relatedRoutes: [setupRoute],
      },
      {
        id: "checklist",
        title: "Checklist",
        bullets: checklist,
      },
    ],
  };
}

export const moduleSetupGuideArticles: HelpArticle[] = [
  moduleSetupArticle(
    "enquiries-setup",
    "Enquiries setup",
    "Configure enquiry statuses, sources, and intake options before coordinators use the pipeline.",
    "/system/setup/enquiries",
    "enquiries",
    [
      "Review enquiry status values against your intake stages.",
      "Set enquiry source and participant communication options.",
      "Create a test enquiry in the workspace after saving reference data.",
    ]
  ),
  moduleSetupArticle(
    "clients-setup",
    "Clients setup",
    "Client statuses, alert types, and support plan reference lists.",
    "/system/setup/clients",
    "clients",
    [
      "Align client status with your onboarding workflow.",
      "Configure alert, consent, risk, and activity types.",
      "Review support plan lists (goals, documents, assessments).",
    ]
  ),
  moduleSetupArticle(
    "locations-setup",
    "Locations setup",
    "Site types, statuses, and location alert options.",
    "/system/setup/locations",
    "locations",
    ["Set location type and status lists.", "Configure location alert types.", "Create a test location in the workspace."]
  ),
  moduleSetupArticle(
    "people-setup",
    "People setup",
    "Employee employment, credential, and profile reference lists.",
    "/system/setup/people",
    "people",
    [
      "Set employment status, type, and department lists.",
      "Configure credential types and statuses for compliance.",
      "Link employees to System access after roles are configured.",
    ]
  ),
  moduleSetupArticle(
    "workforce-setup",
    "Workforce planning setup",
    "Leave types and organisation structure pointers.",
    "/system/setup/workforce",
    "workforce",
    [
      "Set leave type and leave request status options.",
      "Configure org chart tiers under Organisation.",
      "Maintain positions under Workforce planning → Organisation structure.",
      "Seed task automations for leave and credential review (see Task automations guide).",
      "Leave calendar and review queue stay in the workspace at Workforce planning.",
    ]
  ),
  moduleSetupArticle(
    "incidents-setup",
    "Incident reports setup",
    "Statuses, severity, parties, and automation hooks.",
    "/system/setup/incidents",
    "incidents",
    [
      "Align incident status and severity with your quality framework.",
      "Set party and NDIS reportable types.",
      "Configure task automations for reportable and SLA workflows.",
    ]
  ),
  moduleSetupArticle(
    "services-setup",
    "Services setup",
    "Products, agreements, contracts, and funding lists.",
    "/system/setup/services",
    "services",
    [
      "Configure product categories and units of measure.",
      "Set service agreement and contract status options.",
      "Grant Services windows per role before go-live.",
    ]
  ),
  moduleSetupArticle(
    "reports-setup",
    "Reports setup",
    "Role access to the report catalogue and Reports Advance.",
    "/system/setup/reports",
    "reports",
    [
      "Grant standard report windows per role under Admin → Roles.",
      "Use Reports Advance only for trusted administrators.",
    ]
  ),
];
