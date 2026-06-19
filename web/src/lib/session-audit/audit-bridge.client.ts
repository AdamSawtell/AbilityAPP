import {
  auditEntityLabels,
  type AuditAction,
  type AuditEntityType,
  type AuditEvent,
} from "@/lib/audit";
import type { SessionRelatedAuditSummary } from "@/lib/session-audit/types";

const STORAGE_KEY = "abilityerp-audit-trail";

function loadAllEvents(): Array<AuditEvent & { entityType: AuditEntityType; entityId: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw?.trim()) return [];
    const store = JSON.parse(raw) as Record<string, AuditEvent[]>;
    const out: Array<AuditEvent & { entityType: AuditEntityType; entityId: string }> = [];
    for (const [key, events] of Object.entries(store)) {
      const colon = key.indexOf(":");
      if (colon <= 0) continue;
      const entityType = key.slice(0, colon) as AuditEntityType;
      const entityId = key.slice(colon + 1);
      for (const event of events ?? []) {
        out.push({ ...event, entityType, entityId });
      }
    }
    return out.sort((a, b) => b.at.localeCompare(a.at));
  } catch {
    return [];
  }
}

export function summarizeAuditForSession(
  userId: string,
  loginAt: string,
  logoutAt: string | null,
  sessionId?: string
): SessionRelatedAuditSummary {
  const end = logoutAt ?? new Date().toISOString();
  const events = loadAllEvents().filter((e) => {
    if (sessionId && (e as AuditEvent & { sessionId?: string }).sessionId === sessionId) return true;
    if (e.byUserId && e.byUserId !== userId) return false;
    if (!e.byUserId && !e.byName) return false;
    return e.at >= loginAt && e.at <= end;
  });

  const entityKeys = new Set<string>();
  const actions: Record<string, number> = {};

  for (const e of events) {
    entityKeys.add(`${e.entityType}:${e.entityId}`);
    actions[e.action] = (actions[e.action] ?? 0) + 1;
  }

  const tablesAffected = [...new Set(events.map((e) => auditEntityLabels[e.entityType] ?? e.entityType))];

  return {
    totalEvents: events.length,
    recordsModified: entityKeys.size,
    tablesAffected,
    actions,
    events: events.slice(0, 200).map((e) => ({
      id: e.id,
      at: e.at,
      entityType: e.entityType,
      entityId: e.entityId,
      action: e.action,
      summary: e.summary,
      detail: e.detail,
    })),
  };
}

export function countSessionTransactions(userId: string, loginAt: string, logoutAt: string | null): number {
  return summarizeAuditForSession(userId, loginAt, logoutAt).totalEvents;
}

export type { AuditAction, AuditEvent };
