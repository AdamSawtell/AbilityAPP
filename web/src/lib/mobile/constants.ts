/** Field workers — 14 hour idle before session warning (FR-026). */
export const MOBILE_IDLE_TIMEOUT_MINUTES = 14 * 60;

export const MOBILE_PRIVACY_STORAGE_KEY = "abilityvua-mobile-privacy-accepted-v1";

/** Online — reject cached GPS older than 5 minutes. */
export const OFFLINE_GEO_MAX_AGE_MS = 300_000;

/** Offline — allow cached GPS up to 30 minutes with approximate label. */
export const OFFLINE_GEO_MAX_AGE_OFFLINE_MS = 1_800_000;

/** Bounded shift window cached in IndexedDB for offline check-in. */
export const MOBILE_SHIFT_CACHE_HOURS = 72;

export const MOBILE_IDB_NAME = "abilityvua-mobile";
export const MOBILE_IDB_WRITES_STORE = "offline-writes";
export const MOBILE_IDB_SHIFTS_STORE = "shift-cache";
export const MOBILE_IDB_GEO_STORE = "geo-cache";

export const MOBILE_SYNC_MAX_RETRIES = 3;

export type MobileTabId = "today" | "schedule" | "timesheets" | "tasks" | "more";

export const MOBILE_TABS: { id: MobileTabId; label: string; href: string }[] = [
  { id: "today", label: "Today", href: "/m/today" },
  { id: "schedule", label: "Schedule", href: "/m/schedule" },
  { id: "timesheets", label: "Timesheets", href: "/m/timesheets" },
  { id: "tasks", label: "Tasks", href: "/m/tasks" },
  { id: "more", label: "More", href: "/m/more" },
];

export type MobileOfflineActionType = "checkin" | "checkout";

export type MobileOfflineWritePayload = {
  timestamp: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  notes?: string;
  geoApproximate?: boolean;
};

export type MobileOfflineWrite = {
  syncId: string;
  shiftId: string;
  employeeId: string;
  actionType: MobileOfflineActionType;
  payload: MobileOfflineWritePayload;
  createdAt: number;
  syncedAt: number | null;
  retryCount: number;
  lastError?: string;
};
