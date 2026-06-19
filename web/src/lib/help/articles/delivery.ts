import type { HelpArticle } from "@/lib/help/types";

export const deliveryArticle: HelpArticle = {
  id: "article-delivery",
  slug: "delivery",
  title: "Delivery — service bookings, rostering, and timesheets",
  summary: "Schedule NDIS service delivery, then roster staff and generate timesheets.",
  category: "Services",
  keywords: ["service booking", "rostering", "timesheet", "NDIS", "delivery", "schedule"],
  lastUpdated: "2026-06-19",
  sections: [
    {
      id: "overview",
      title: "Delivery stack",
      body: "Delivery covers the path from scheduled supports to worker time and claiming. Service bookings are live today. Rostering, timesheets, and generate timesheets are placeholders aligned with AbilityERP.",
    },
    {
      id: "service-bookings",
      title: "Service bookings",
      body: "Each booking is a document with header dates, business partner, invoice partner, and booking generator reference. Lines hold products, weekly periods, quantities, and amounts — matching AbilityERP Service Booking Line.",
      relatedRoutes: ["/service-bookings", "/service-bookings/new"],
      windowKeys: ["service-bookings"],
    },
    {
      id: "rostering",
      title: "Rostering (coming soon)",
      body: "Rostering and booking generator will build recurring patterns and bulk-create service bookings for a location or client.",
      relatedRoutes: ["/rostering"],
      windowKeys: ["rostering"],
    },
    {
      id: "timesheets",
      title: "Timesheets (coming soon)",
      body: "Timesheets will roll up completed bookings for approval and payroll. Generate timesheets will bulk-create lines from bookings in a date range.",
      relatedRoutes: ["/timesheets", "/generate-timesheets"],
      windowKeys: ["timesheets", "generate-timesheets"],
    },
  ],
  relatedRoutes: [
    "/service-bookings",
    "/service-bookings/new",
    "/rostering",
    "/timesheets",
    "/generate-timesheets",
  ],
  windowKeys: ["service-bookings", "rostering", "timesheets", "generate-timesheets"],
};
