"use client";

import { useMemo, useState } from "react";
import { AuditTrailDrawer } from "@/components/audit-trail-drawer";
import {
  auditEntityLabels,
  formatAuditDateTime,
  type AppShellAuditProps,
  type AuditEntityType,
  type AuditEvent,
  type RecordAuditMeta,
} from "@/lib/audit";
import { getAuditEventCount } from "@/lib/audit-log";

type RecordAuditFooterProps = AppShellAuditProps & {
  extraEvents?: AuditEvent[];
};

export function RecordAuditFooter(props: RecordAuditFooterProps) {
  if ("moduleLabel" in props) {
    return (
      <footer className="mt-10 border-t border-slate-200 pt-4 text-[11px] leading-relaxed text-slate-400">
        {props.moduleLabel} — open a record to view created/updated audit and full change history.
      </footer>
    );
  }

  return (
    <EntityAuditFooter
      entityType={props.entityType}
      entityId={props.entityId}
      meta={props.meta}
      extraEvents={props.extraEvents}
    />
  );
}

function EntityAuditFooter({
  entityType,
  entityId,
  meta,
  extraEvents = [],
}: {
  entityType: AuditEntityType;
  entityId: string;
  meta: RecordAuditMeta;
  extraEvents?: AuditEvent[];
}) {
  const [open, setOpen] = useState(false);
  const eventCount = useMemo(() => getAuditEventCount(entityType, entityId) + extraEvents.length, [entityType, entityId, extraEvents.length]);

  return (
    <>
      <footer className="mt-10 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-slate-400">
          <span className="text-slate-500">{auditEntityLabels[entityType]}</span>
          {" · "}
          Created {formatAuditDateTime(meta.createdAt)} by {meta.createdBy}
          {" · "}
          Updated {formatAuditDateTime(meta.updatedAt)} by {meta.updatedBy}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          Full audit trail
          {eventCount > 0 ? (
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">{eventCount}</span>
          ) : null}
        </button>
      </footer>

      {open ? (
        <AuditTrailDrawer
          key={`${entityType}:${entityId}`}
          open
          onClose={() => setOpen(false)}
          entityType={entityType}
          entityId={entityId}
          meta={meta}
          extraEvents={extraEvents}
        />
      ) : null}
    </>
  );
}
