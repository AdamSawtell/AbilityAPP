"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useData } from "@/lib/data-store";
import { formatDisplayDateTime, isNdisReportOverdue, statusTone, type IncidentRecord } from "@/lib/incident";

function statusPill(status: IncidentRecord["status"]) {
  const tone = statusTone(status);
  const styles =
    tone === "sky"
      ? "bg-sky-50 text-sky-800 ring-sky-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : tone === "rose"
          ? "bg-rose-50 text-rose-800 ring-rose-200"
          : tone === "emerald"
            ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
            : tone === "violet"
              ? "bg-violet-50 text-violet-900 ring-violet-200"
              : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>{status}</span>
  );
}

export function RecordIncidentsPanel({
  clientId,
  employeeId,
  locationId,
  entityLabel,
}: {
  clientId?: string;
  employeeId?: string;
  locationId?: string;
  entityLabel: string;
}) {
  const { getIncidentsForClient, getIncidentsForEmployee, getIncidentsForLocation } = useData();

  const rows = useMemo(() => {
    if (clientId) return getIncidentsForClient(clientId);
    if (employeeId) return getIncidentsForEmployee(employeeId);
    if (locationId) return getIncidentsForLocation(locationId);
    return [];
  }, [clientId, employeeId, locationId, getIncidentsForClient, getIncidentsForEmployee, getIncidentsForLocation]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Incidents</h3>
        <p className="text-sm text-slate-500">Incident reports linked to this record.</p>
      </div>

      {rows.length ? (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {rows.map((incident) => (
            <div key={incident.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/incidents/${incident.id}`} className="font-medium text-slate-900 hover:text-[#b51266]">
                  {incident.title || incident.documentNo}
                </Link>
                <p className="text-sm text-slate-500">
                  {incident.documentNo}
                  {incident.occurredAt ? ` · ${formatDisplayDateTime(incident.occurredAt)}` : ""}
                  {incident.isReportable && isNdisReportOverdue(incident) ? " · NDIS overdue" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {statusPill(incident.status)}
                <Link href={`/incidents/${incident.id}`} className="text-xs font-medium text-[#b51266] hover:underline">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
          No incidents linked to this record.
        </div>
      )}

      <p className="text-xs text-slate-400">Linked record: {entityLabel}</p>
    </div>
  );
}
