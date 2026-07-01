import type { HelpArticle } from "@/lib/help/types";

export const employeeMobileArticle: HelpArticle = {
  id: "article-employee-mobile",
  slug: "employee-mobile",
  title: "Employee mobile app (PWA)",
  summary:
    "Install AbilityVua on your phone for today's shifts, check-in with GPS, pay-period schedule, timesheets, assigned tasks, and your Digital Worker ID.",
  category: "People",
  keywords: [
    "mobile",
    "pwa",
    "worker app",
    "check in",
    "check out",
    "gps",
    "today",
    "schedule",
    "digital id",
    "install",
    "iphone",
    "home screen",
    "tasks",
    "animal alert",
  ],
  relatedRoutes: ["/m/today", "/m/schedule", "/m/timesheets", "/m/tasks", "/m/more", "/m/id", "/m/install"],
  windowKeys: ["my-workplace", "my-shifts", "my-timesheets", "tasks-assigned-to-me"],
  lastUpdated: "2026-07-01",
  sections: [
    {
      id: "open",
      title: "Open the worker app",
      body: "Go to **/m/today** on your phone (or tap the link from My workplace). Sign in with your usual AbilityVua login. You need My workplace access and an employee link on your user record.",
      relatedRoutes: ["/m/today"],
    },
    {
      id: "install",
      title: "Install on iPhone",
      body: "Open the app in Safari, then **More → Install on iPhone** for step-by-step **Add to Home Screen** instructions. Android Chrome may offer **Install app** from the browser menu.",
      relatedRoutes: ["/m/install", "/m/more"],
    },
    {
      id: "today",
      title: "Today and check-in",
      body: "The **Today** tab shows your current shift first. Tap **Check in now** (floating button) or the card button. GPS is captured only when you check in or out — not continuously. Animal and pet alerts appear on the shift card when relevant.\n\nUse **Get directions** to open maps for the support location.",
      relatedRoutes: ["/m/today"],
    },
    {
      id: "schedule",
      title: "Pay period schedule",
      body: "The **Schedule** tab lists all shifts in the current pay period. Swipe from Today via **Pay period →** at the top of the Today screen.",
      relatedRoutes: ["/m/schedule"],
    },
    {
      id: "tasks",
      title: "Assigned tasks",
      body: "The **Tasks** tab lists work items assigned directly to you (not compliance reminders). Tap a task to open it, add updates, or mark it complete.",
      relatedRoutes: ["/m/tasks"],
    },
    {
      id: "privacy",
      title: "Location privacy",
      body: "On first open you see a one-time notice: location is used only at check-in and check-out to verify attendance at the support site.",
      relatedRoutes: ["/m/today"],
    },
    {
      id: "offline",
      title: "Offline check-in",
      body: "When you have no signal, check-in and check-out are saved on your phone and sync automatically when you reconnect. Use **Sync now** on the banner if needed. Approximate location may be used when offline (up to 30 minutes old).",
      relatedRoutes: ["/m/today", "/m/schedule"],
    },
  ],
};
