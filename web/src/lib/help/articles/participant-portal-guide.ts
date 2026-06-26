import type { HelpArticle } from "@/lib/help/types";

export const participantPortalGuideArticle: HelpArticle = {
  id: "article-participant-portal-guide",
  slug: "participant-portal-guide",
  title: "How to use your portal",
  summary:
    "Sign in to view your upcoming supports, check your plan funding, request new or changed services, and find the right person to contact for help.",
  category: "Core",
  keywords: [
    "participant portal",
    "client portal",
    "how to",
    "services",
    "funding",
    "budget",
    "request service",
    "sign in",
    "support",
    "escalation",
  ],
  relatedRoutes: [
    "/portal",
    "/portal/help",
    "/portal/services",
    "/portal/budget",
    "/portal/requests",
  ],
  windowKeys: [],
  portalOnly: true,
  lastUpdated: "2026-06-25",
  sections: [
    {
      id: "overview",
      title: "What this portal is for",
      body: "This portal is your own view of the supports your provider delivers. It is separate from the staff app.\n\nThe home page is a dashboard. A 'Your next step' banner shows the single most useful thing to look at right now, summary tiles show your upcoming supports, remaining funding, requests under review, and plan review date, and the cards below take you to each area. Your provider still arranges rosters, workers, and billing for you in the background.",
      relatedRoutes: ["/portal"],
    },
    {
      id: "sign-in",
      title: "Sign in",
      steps: [
        "Open the portal sign-in page. You see your provider logo, name, address, and contact details on the branded sign-in screen.",
        "Enter the email address your provider has on file for you.",
        "Select Email me a sign-in link.",
        "Open the link to sign in. You stay signed in for seven days, or until you sign out.",
        "Use **How to use this portal** on the sign-in page for this guide, or **Staff sign in** if you need the staff app.",
        "If your email is not recognised, contact your provider so they can update your record.",
      ],
      relatedRoutes: ["/portal/login"],
    },
    {
      id: "services",
      title: "View your upcoming supports",
      steps: [
        "Open My services from the home page.",
        "Use Week view to see your supports on a seven-day calendar, or List view for a table of the next eight weeks.",
        "Each support shows the date, time, support type, worker, and location.",
        "If a support looks wrong or is missing, contact your provider.",
      ],
      relatedRoutes: ["/portal/services"],
    },
    {
      id: "budget",
      title: "Check your plan funding",
      steps: [
        "Open My funding from the home page.",
        "Review your allocated, used, and remaining amounts, and the percentage used so far.",
        "Scroll the table to see each support budget and category.",
        "Contact your provider if a budget line looks wrong or is missing.",
      ],
      relatedRoutes: ["/portal/budget"],
    },
    {
      id: "requests",
      title: "Request a new or changed service",
      steps: [
        "Open Request a service from the home page.",
        "Choose a service type and describe the support you need. Add preferred days or times if you have them.",
        "Submit. Your request shows as Submitted, then Under review while your coordinator looks at it.",
        "If it is approved, your provider prepares an agreement change. If it is declined, you can read the reason on the same page.",
      ],
      relatedRoutes: ["/portal/requests"],
    },
    {
      id: "support-escalation",
      title: "Getting help and who to contact",
      body: "Use the right contact so your question reaches the person who can help fastest. The provider contact details are shown in the footer of every portal page.",
      bullets: [
        "Question about a support time, worker, or location: contact your provider's scheduling or coordination team.",
        "Question about funding, budget, or plan review: contact your support coordinator or plan manager.",
        "Want a new or changed support: use Request a service so it is tracked and reviewed.",
        "Cannot sign in or did not get a sign-in link: contact the provider support contact shown in the portal footer.",
        "Concern about your safety, wellbeing, or a worker's conduct: contact your provider straight away. In an emergency, call 000.",
      ],
      relatedRoutes: ["/portal/help"],
    },
  ],
};
