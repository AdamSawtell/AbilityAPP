"use client";

import { useEffect, useState } from "react";
import {
  auditActionLabels,
  auditEntityLabels,
  formatAuditDateTime,
  type AuditEntityType,
  type AuditEvent,
  type RecordAuditMeta,
} from "@/lib/audit";
import { AUDIT_PAGE_SIZE, getAuditEventsPage, subscribeAuditLog } from "@/lib/audit-log";

type AuditTrailDrawerProps = {
  open: boolean;
  onClose: () => void;
  entityType: AuditEntityType;
  entityId: string;
  meta: RecordAuditMeta;
  extraEvents?: AuditEvent[];
};

function mergeEvents(stored: AuditEvent[], extra: AuditEvent[]) {
  const merged = [...extra, ...stored].sort((a, b) => b.at.localeCompare(a.at));
  const seen = new Set<string>();
  return merged.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}

export function AuditTrailDrawer({
  open,
  onClose,
  entityType,
  entityId,
  meta,
  extraEvents = [],
}: AuditTrailDrawerProps) {
  const [limit, setLimit] = useState(AUDIT_PAGE_SIZE);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!open) return;

    function refresh() {
      const page = getAuditEventsPage(entityType, entityId, 0, Math.max(limit, AUDIT_PAGE_SIZE * 4));
      const merged = mergeEvents(page.events, extraEvents);
      setEvents(merged.slice(0, limit));
      setTotal(merged.length);
    }

    refresh();
    const unsubscribe = subscribeAuditLog(refresh);
    return () => {
      unsubscribe();
    };
  }, [open, entityType, entityId, extraEvents, limit]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const hasMore = events.length < total;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/30" aria-label="Close audit trail" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Audit trail</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {auditEntityLabels[entityType]} · {entityId}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Created {formatAuditDateTime(meta.createdAt)} by {meta.createdBy}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {events.length ? (
            <ol className="space-y-3">
              {events.map((event) => (
                <li key={event.id} className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-medium text-slate-700">{formatAuditDateTime(event.at)}</span>
                    <span>·</span>
                    <span>{event.byName || "System"}</span>
                    <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                      {auditActionLabels[event.action] ?? event.action}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">{event.summary}</p>
                  {event.detail ? <p className="mt-1 text-xs leading-relaxed text-slate-600">{event.detail}</p> : null}
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">No audit events recorded yet.</p>
          )}

          {hasMore ? (
            <button
              type="button"
              onClick={() => setLimit((n) => n + AUDIT_PAGE_SIZE)}
              className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Load more ({events.length} of {total})
            </button>
          ) : null}
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-[10px] text-slate-400">
          Up to 250 events kept per record. Latest changes appear first.
        </div>
      </aside>
    </div>
  );
}
