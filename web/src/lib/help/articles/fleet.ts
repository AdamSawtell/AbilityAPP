import type { HelpArticle } from "@/lib/help/types";

export const fleetArticle: HelpArticle = {
  id: "article-fleet",
  slug: "fleet",
  title: "Fleet management",
  summary: "Manage provider-owned vehicles, registration, servicing, inspections, and bookings.",
  category: "Services",
  keywords: ["fleet", "vehicles", "transport", "registration", "servicing", "inspection", "booking"],
  relatedRoutes: ["/fleet"],
  windowKeys: ["fleet"],
  lastUpdated: "2026-06-29",
  sections: [
    {
      id: "fleet-register",
      title: "Use the vehicle register",
      body: "Open Fleet to see provider-owned vehicles, registration numbers, current status, service summary, and odometer readings. Use the status filter to find active, inactive, off-road, or disposed vehicles.",
      relatedRoutes: ["/fleet"],
      windowKeys: ["fleet"],
    },
    {
      id: "fleet-detail",
      title: "Maintain a vehicle record",
      steps: [
        "Open a vehicle from the Fleet register.",
        "Use Overview for make, model, VIN, assigned location, assigned driver, odometer, and notes.",
        "Use Registration & insurance for renewal dates and asset lifecycle fields.",
        "Use Accessibility & compliance for wheelchair hoists, ramps, modification certificates, and NDIS transport notes.",
        "Save changes from the unsaved changes bar.",
      ],
      relatedRoutes: ["/fleet"],
      windowKeys: ["fleet-overview", "fleet-registration-and-insurance", "fleet-accessibility-and-compliance"],
    },
    {
      id: "fleet-servicing-inspections",
      title: "Track servicing and inspections",
      body: "Servicing records capture scheduled service, repair, inspection, odometer, provider, cost, cost status, and next service due. Pre-start inspections capture pass/fail, inspector, shift, odometer, and notes. A failed inspection marks the vehicle off road when the vehicle record is saved.",
      relatedRoutes: ["/fleet"],
      windowKeys: ["fleet-servicing", "fleet-inspections"],
    },
    {
      id: "fleet-bookings",
      title: "Book a vehicle",
      body: "Use the Bookings tab to reserve a vehicle for a time window, driver, optional client, location, and purpose. The system prevents overlapping confirmed bookings for the same vehicle and checks vehicle/driver compliance before saving.",
      relatedRoutes: ["/fleet"],
      windowKeys: ["fleet-bookings"],
    },
    {
      id: "fleet-calendar",
      title: "See bookings on calendars",
      body: "The Calendar tab on a vehicle shows that vehicle's confirmed and completed bookings alongside any shifts assigned to it and fleet tasks. Bookings that span several days appear on each covered day. The same booking also shows on the calendar of the linked location, employee, or client when set. Cancelled bookings are hidden.",
      relatedRoutes: ["/fleet"],
      windowKeys: ["fleet-calendar"],
    },
  ],
};
