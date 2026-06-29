import type { HelpArticle } from "@/lib/help/types";

export const maintenanceArticle: HelpArticle = {
  id: "article-maintenance",
  slug: "maintenance",
  title: "Maintenance requests",
  summary: "Log, assign, and track repairs and upkeep against a location with costs, photos, and SLA visibility.",
  category: "Services",
  keywords: ["maintenance", "repair", "facilities", "contractor", "SLA", "location"],
  relatedRoutes: ["/maintenance", "/locations"],
  windowKeys: ["maintenance", "location-maintenance", "location-calendar"],
  lastUpdated: "2026-06-29",
  sections: [
    {
      id: "maintenance-register",
      title: "Use the maintenance register",
      body: "Open Maintenance (under Locations in the sidebar) to see all requests. Filter by status, priority, or location. Each row shows the linked site, priority, current status, and whether the SLA is breached.",
      relatedRoutes: ["/maintenance"],
      windowKeys: ["maintenance"],
    },
    {
      id: "maintenance-create",
      title: "Create a request",
      steps: [
        "From the register, choose New request, or open a location → Maintenance tab → New request.",
        "Enter title, description, category, and priority (urgent, high, medium, low).",
        "Optionally set a scheduled visit date for contractor planning.",
        "Save. The request appears on the location Maintenance tab and in the central register.",
      ],
      relatedRoutes: ["/maintenance", "/locations"],
      windowKeys: ["maintenance", "maintenance-overview", "location-maintenance"],
    },
    {
      id: "maintenance-detail",
      title: "Work a request through to close",
      steps: [
        "Overview — edit status through the lifecycle: Reported → Assigned → In Progress → Resolved → Closed.",
        "Assignment — assign an internal employee or record contractor contact details.",
        "Costs — enter estimated and actual cost, invoice references, and cost status. Costs above $500 need finance approval before they are treated as approved.",
        "Photos — attach issue, completion, or invoice images by URL.",
        "When resolved, the original requestor confirms completion before you move to Closed.",
      ],
      relatedRoutes: ["/maintenance"],
      windowKeys: ["maintenance-overview", "maintenance-assignment", "maintenance-costs", "maintenance-photos"],
    },
    {
      id: "maintenance-incident",
      title: "Link to an incident",
      body: "If a maintenance issue caused property damage or participant impact, use Create incident from this request on the detail page. The incident is pre-filled with the location and description, and the maintenance record stores the incident link.",
      relatedRoutes: ["/maintenance"],
      windowKeys: ["maintenance-overview"],
    },
    {
      id: "maintenance-location-calendar",
      title: "See requests on the location calendar",
      body: "On a location Calendar tab, tick Show maintenance to display scheduled visits and open requests. Items use priority colours; overdue open requests without a scheduled date appear in a summary bar at the top. Click a chip to open the full maintenance record.",
      relatedRoutes: ["/locations"],
      windowKeys: ["location-calendar", "location-maintenance"],
    },
  ],
};
