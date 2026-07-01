/** Field workers — 14 hour idle before session warning (FR-026). */
export const MOBILE_IDLE_TIMEOUT_MINUTES = 14 * 60;

export const MOBILE_PRIVACY_STORAGE_KEY = "abilityvua-mobile-privacy-accepted-v1";

export type MobileTabId = "today" | "schedule" | "timesheets" | "tasks" | "more";

export const MOBILE_TABS: { id: MobileTabId; label: string; href: string }[] = [
  { id: "today", label: "Today", href: "/m/today" },
  { id: "schedule", label: "Schedule", href: "/m/schedule" },
  { id: "timesheets", label: "Timesheets", href: "/m/timesheets" },
  { id: "tasks", label: "Tasks", href: "/m/tasks" },
  { id: "more", label: "More", href: "/m/more" },
];
