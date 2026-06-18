import type { HelpArticle } from "@/lib/help/types";

export const myWorkplaceArticle: HelpArticle = {
  id: "article-my-workplace",
  slug: "my-workplace",
  title: "My workplace self-service",
  summary:
    "Submit leave, update your contact details, set working availability, and acknowledge employment contracts from your own login.",
  category: "People",
  keywords: [
    "my workplace",
    "self service",
    "leave",
    "availability",
    "about me",
    "contracts",
    "kiosk",
    "mobility",
    "staff portal",
  ],
  relatedRoutes: ["/my", "/my/leave", "/my/profile", "/my/availability", "/my/contracts"],
  windowKeys: ["my-workplace", "my-leave", "my-profile", "my-availability", "my-contracts"],
  lastUpdated: "2026-06-18",
  sections: [
    {
      id: "overview",
      title: "What My workplace is",
      body: "My workplace is the staff self-service area. It shows only your own employee data — not the full HR employee file. Coordinators and HR still use Employees and Workforce planning for organisation-wide views.",
      relatedRoutes: ["/my"],
    },
    {
      id: "access",
      title: "Who can use it",
      body: "You need the My workplace windows on your role and a user account linked to your employee record (Employee → System access). Support workers, team leaders, and most staff with logins have access by default.",
      windowKeys: ["my-workplace"],
    },
    {
      id: "leave",
      title: "Submit and track leave",
      steps: [
        "Open My workplace → Leave.",
        "Choose leave type, dates, and optional notes.",
        "Submit — status shows as Requested until a manager approves or declines in the HR employee record.",
      ],
      relatedRoutes: ["/my/leave"],
      windowKeys: ["my-leave"],
    },
    {
      id: "profile",
      title: "Update About me",
      body: "Edit contact details and emergency contacts. Payroll, bank, and tax fields stay on the HR record and are not editable here.",
      relatedRoutes: ["/my/profile"],
      windowKeys: ["my-profile"],
    },
    {
      id: "availability",
      title: "Working availability",
      body: "Set your preferred weekly pattern so rostering can see when you are available, preferred, or unavailable.",
      relatedRoutes: ["/my/availability"],
      windowKeys: ["my-availability"],
    },
    {
      id: "contracts",
      title: "Contracts and policies",
      body: "View employment contracts and policy documents. Items marked as requiring acknowledgement must be confirmed before they are complete.",
      relatedRoutes: ["/my/contracts"],
      windowKeys: ["my-contracts"],
    },
    {
      id: "future",
      title: "Coming later",
      body: "Roster, timesheets, and pay slips will be added to My workplace and the mobility app using the same self-service foundation.",
    },
  ],
};
