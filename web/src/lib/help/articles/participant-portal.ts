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
    "week view",
    "calendar",
  ],
  relatedRoutes: ["/portal", "/portal/services", "/portal/budget", "/portal/requests"],
  windowKeys: [],
  lastUpdated: "2026-06-23",
  sections: [
    {
      id: "overview",
      title: "What the participant portal is",
      body: "The participant portal is a separate sign-in experience from the staff app — it is not linked from the workspace sidebar. Share this URL with participants:\n\n• **Demo:** https://main.d3vim3geq5td01.amplifyapp.com/portal/login\n• **Local:** http://localhost:3000/portal/login\n\nParticipants use the email address stored on their client record to request a one-time sign-in link. On the demo environment, an **Open portal** link appears on screen after you request a sign-in link (production would use email).\n\nThe portal does not replace staff workflows — coordinators still manage bookings, roster, and billing in the main app.",
      relatedRoutes: ["/portal"],
    },
    {
      id: "sign-in",
      title: "Sign in with a magic link",
      steps: [
        "Open the participant portal sign-in page: https://main.d3vim3geq5td01.amplifyapp.com/portal/login (demo) or http://localhost:3000/portal/login (local). Do not use staff /login.",
        "Enter the email address on your participant record (demo: Bernie@email for Bernadette Rose).",
        "Select **Email me a sign-in link**.",
        "On the demo environment, click **Open portal** under the demo sign-in link. In production you would open the link from email within 15 minutes.",
        "You land on the portal home page signed in for seven days, or until you sign out.",
      ],
      relatedRoutes: ["/portal/login"],
    },
    {
      id: "services",
      title: "View upcoming services",
      steps: [
        "From the portal home, open **My services**.",
        "Use **Week view** to see supports on a seven-day calendar — navigate with Previous week, Next week, or This week.",
        "Switch to **List view** for a table of all supports in the next eight weeks.",
        "Review date, time, support type, worker name, and location.",
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
      body: "Each portal submission creates a task assigned to the Support Coordinator role and appears on the client **Requests** tab under **Participant portal requests**. Open the linked review task to approve (creates a draft service agreement variation stub) or decline with a reason the participant can read on the portal.",
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
