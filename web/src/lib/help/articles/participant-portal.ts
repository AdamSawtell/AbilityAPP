import type { HelpArticle } from "@/lib/help/types";

export const participantPortalArticle: HelpArticle = {
  id: "article-participant-portal",
  slug: "participant-portal",
  title: "Participant portal",
  summary:
    "Participants sign in with a magic link, view services and funding, and submit service requests that coordinators review and convert to agreement variations.",
  category: "Core",
  keywords: [
    "participant portal",
    "portal",
    "magic link",
    "services",
    "budget",
    "funding",
    "self service",
    "client portal",
    "request service",
    "service request",
  ],
  relatedRoutes: ["/portal", "/portal/services", "/portal/budget", "/portal/requests"],
  windowKeys: [],
  lastUpdated: "2026-06-20",
  sections: [
    {
      id: "overview",
      title: "What the participant portal is",
      body: "The participant portal is a separate sign-in experience from the staff app. Participants use the email address stored on their client record to request a one-time sign-in link. After signing in, they can view upcoming rostered supports and a read-only summary of plan budget lines.\n\nThe portal does not replace staff workflows — coordinators still manage bookings, roster, and billing in the main app.",
      relatedRoutes: ["/portal"],
    },
    {
      id: "sign-in",
      title: "Sign in with a magic link",
      steps: [
        "Open /portal/login (or the link your provider shares).",
        "Enter the email address on your participant record.",
        "Select **Email me a sign-in link**.",
        "Open the link from your email within 15 minutes (in development, a demo link appears on screen).",
        "You land on the portal home page signed in for seven days, or until you sign out.",
      ],
      relatedRoutes: ["/portal/login"],
    },
    {
      id: "services",
      title: "View upcoming services",
      steps: [
        "From the portal home, open **My services**.",
        "Review date, time, support type, worker name, and location for shifts in the next eight weeks.",
        "Contact your provider if a support is missing or incorrect.",
      ],
      relatedRoutes: ["/portal/services"],
    },
    {
      id: "budget",
      title: "View plan funding",
      steps: [
        "From the portal home, open **My funding**.",
        "Review overall allocated, used, and remaining amounts.",
        "Scroll the table for each support budget and category line.",
        "Contact your provider if budget lines are missing — staff maintain plan budget on the client record.",
      ],
      relatedRoutes: ["/portal/budget"],
    },
    {
      id: "service-request",
      title: "Request a new service",
      steps: [
        "From the portal home, open **Request a service**.",
        "Choose a service type and describe the support you need.",
        "Add preferred days or times if you have them.",
        "Submit — status shows as Submitted, then Under review while your coordinator assesses it.",
        "When approved, your provider prepares a draft agreement variation. If declined, read the reason on the same page.",
      ],
      relatedRoutes: ["/portal/requests"],
    },
    {
      id: "staff-review",
      title: "How coordinators review portal requests",
      body: "Each portal submission creates a task assigned to the Support Coordinator role and appears on the client **Requests** tab. Open the linked task to approve (creates a draft service agreement variation stub) or decline with a reason the participant can read on the portal.",
      relatedRoutes: ["/tasks", "/clients"],
    },
    {
      id: "staff-setup",
      title: "What staff need to configure",
      body: "Ensure each participant's **Email** on their client record matches the address they will use to sign in. Plan budget lines on the client **Plan budget** tab feed the funding summary. Future roster shifts linked to the participant appear under **My services**. Coordinators need Tasks access and an active service agreement on the client before approving a variation stub.",
      relatedRoutes: ["/clients"],
    },
  ],
};
