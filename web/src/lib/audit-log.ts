import {
  entityAuditKey,
  nowIso,
  type AuditAction,
  type AuditEntityType,
  type AuditEvent,
} from "@/lib/audit";

const STORAGE_KEY = "abilityerp-audit-trail";
const MAX_EVENTS_PER_ENTITY = 250;
const PAGE_SIZE_DEFAULT = 30;

type AuditStore = Record<string, AuditEvent[]>;

const listeners = new Set<() => void>();
let cache: AuditStore | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function loadStore(): AuditStore {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = {};
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw?.trim() ? (JSON.parse(raw) as AuditStore) : {};
  } catch {
    cache = {};
  }
  return cache!;
}

function scheduleSave() {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache ?? {}));
    } catch {
      // ignore quota errors
    }
  }, 200);
}

export function subscribeAuditLog(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  for (const listener of listeners) listener();
}

export function appendAuditEvent(
  entityType: AuditEntityType,
  entityId: string,
  event: Omit<AuditEvent, "id" | "at"> & { at?: string }
) {
  if (!entityId) return;
  const store = loadStore();
  const key = entityAuditKey(entityType, entityId);
  const entry: AuditEvent = {
    id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: event.at ?? nowIso(),
    byUserId: event.byUserId,
    byName: event.byName,
    action: event.action,
    summary: event.summary,
    detail: event.detail ?? "",
  };
  const next = [entry, ...(store[key] ?? [])].slice(0, MAX_EVENTS_PER_ENTITY);
  store[key] = next;
  scheduleSave();
  notify();
}

export function logRecordAudit(
  entityType: AuditEntityType,
  entityId: string,
  action: AuditAction,
  summary: string,
  actor: { byUserId?: string; byName: string },
  detail = ""
) {
  appendAuditEvent(entityType, entityId, {
    byUserId: actor.byUserId ?? "",
    byName: actor.byName,
    action,
    summary,
    detail,
  });
}

export function getAuditEventCount(entityType: AuditEntityType, entityId: string) {
  const store = loadStore();
  return store[entityAuditKey(entityType, entityId)]?.length ?? 0;
}

export function getAuditEventsPage(
  entityType: AuditEntityType,
  entityId: string,
  offset = 0,
  limit = PAGE_SIZE_DEFAULT
): { events: AuditEvent[]; total: number; hasMore: boolean } {
  const store = loadStore();
  const all = store[entityAuditKey(entityType, entityId)] ?? [];
  const events = all.slice(offset, offset + limit);
  return { events, total: all.length, hasMore: offset + limit < all.length };
}

export const AUDIT_PAGE_SIZE = PAGE_SIZE_DEFAULT;
