import type { HelpArticle } from "@/lib/help/types";

export const clientsArticle: HelpArticle = {
  id: "article-clients",
  slug: "clients",
  title: "Clients",
  summary: "Manage client profiles, compliance lines, locations, and service agreements.",
  category: "Core",
  keywords: [
    "client",
    "support receiver",
    "consent",
    "restrictive practice",
    "alerts",
    "service agreement",
    "support plan",
  ],
  relatedRoutes: ["/clients", "/service-agreements"],
  windowKeys: ["clients"],
  lastUpdated: "2025-06-15",
  sections: [
    {
      id: "client-list",
      title: "Clients list",
      body: "All clients lists every active client. Click a search key to open the client in the workspace. You can keep multiple clients open at once.",
      relatedRoutes: ["/clients"],
    },
    {
      id: "client-tab-groups",
      title: "Client tab groups",
      body: "Client records use grouped tabs on the left. Your role controls which tabs you see.",
      bullets: [
        "Core: Overview, Support Plan, Alerts, Activity, Service agreements, Full profile",
        "Relationships: BP Associations, Locations, Contact Activity",
        "Care and compliance: Requests, Restrictive Practices, Consents and Legal Orders, Risks",
        "Planning: Plan and Assessment, Goals, Progress Review, Support Receiver Needs and Rules",
      ],
    },
    {
      id: "overview",
      title: "Overview tab",
      body: "Overview shows the client summary card: status, funding, risk alerts, consent alert list, and key demographics. Use it for quick checks before drilling into line tabs.",
      relatedRoutes: ["/clients"],
      windowKeys: ["client-overview"],
    },
    {
      id: "alerts-activity",
      title: "Alerts and Activity",
      body: "Alerts hold incident and care flags with valid-from and valid-to dates. Activity logs phone calls, visits, and case notes. Both use editable line tables: Add row, edit inline, remove rows, then Save on the record.",
      windowKeys: ["client-alerts", "client-activity"],
    },
    {
      id: "consents",
      title: "Consents and Legal Orders",
      body: "Track consent types, legal orders, expiry, and notes per line. Valid consents and gaps feed the consent alert list on Overview when configured.",
      windowKeys: ["client-consents-and-legal-orders"],
    },
    {
      id: "restrictive-practices",
      title: "Restrictive Practices",
      body: "Document authorised restrictive practices with type, dates, review schedule, and oversight details. Each line is editable in the table.",
      windowKeys: ["client-restrictive-practices"],
    },
    {
      id: "locations-tab",
      title: "Locations tab",
      body: "Client locations lists addresses linked to the participant: home, service delivery, invoice, and postal flags. Align location assignments with Support Location records under the Locations module.",
      windowKeys: ["client-locations"],
    },
    {
      id: "service-agreements",
      title: "Service agreements",
      body: "Open Service agreements from the client tab or from Clients → All service agreements in the sidebar. Agreements link products and funding lines to the client.",
      relatedRoutes: ["/service-agreements"],
      windowKeys: ["client-service-agreements", "service-agreements"],
    },
    {
      id: "coming-soon",
      title: "Tabs still in progress",
      body: "Some client tabs show a coming-soon panel until AbilityERP parity is complete. These include BP Associations, Requests, Risks, Goals, Progress Review, Contact Activity, and Support Receiver Needs and Rules.",
    },
  ],
};

export const locationsArticle: HelpArticle = {
  id: "article-locations",
  slug: "locations",
  title: "Locations",
  summary: "Manage SIL houses, day programs, and other sites with linked clients, staff, and services.",
  category: "Core",
  keywords: ["location", "support location", "SIL", "address", "assign client", "assign employee"],
  relatedRoutes: ["/locations", "/locations/new"],
  windowKeys: ["locations"],
  lastUpdated: "2025-06-15",
  sections: [
    {
      id: "location-list",
      title: "Locations list",
      body: "All locations lists every support location. Open a row to edit site details and relationships.",
      relatedRoutes: ["/locations"],
    },
    {
      id: "create-location",
      title: "Create a location",
      steps: [
        "Open Locations and click New location.",
        "Complete Overview and Contact and address.",
        "Save the record.",
        "Add Clients, Employees, and Products and services lines as needed.",
      ],
      relatedRoutes: ["/locations/new"],
    },
    {
      id: "location-tabs",
      title: "Location tabs",
      bullets: [
        "Location: Overview, Contact and address",
        "Relationships: Alerts, Clients, Employees",
        "Services: Products and services",
        "History: Activity",
      ],
    },
    {
      id: "assignments",
      title: "Link clients, staff, and services",
      body: "Use the Clients, Employees, and Products and services tabs to assign who receives support at this site and which products are delivered there. Your role needs the matching assign-location process.",
      bullets: [
        "assign-location-client: link support receivers",
        "assign-location-employee: link staff",
        "assign-location-product: link products and services",
      ],
    },
  ],
};
