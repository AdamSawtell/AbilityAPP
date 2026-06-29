"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useData } from "@/lib/data-store";
import { maintenanceSlaBreached } from "@/lib/maintenance-compliance";
import { maintenanceStatusLabel, type MaintenanceRequestRecord } from "@/lib/maintenance-request";

function StatusBadge({ record }: { record: MaintenanceRequestRecord }) {
  const breached = maintenanceSlaBreached(record);
  const styles = breached
    ? "bg-rose-50 text-rose-800 ring-rose-200"
    : record.priority === "high" || record.priority === "urgent"
      ? "bg-amber-50 text-amber-900 ring-amber-200"
      : record.status === "closed"
        ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
        : "bg-slate-100 text-slate-700 ring-slate-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {maintenanceStatusLabel(record.status)}
    </span>
  );
}

export function RecordMaintenancePanel({
  locationId,
  entityLabel,
  canCreate = true,
}: {
  locationId: string;
  entityLabel: string;
  canCreate?: boolean;
}) {
  const { getMaintenanceRequestsForLocation } = useData();
  const rows = useMemo(() => getMaintenanceRequestsForLocation(locationId), [getMaintenanceRequestsForLocation, locationId]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Maintenance</h3>
          <p className="text-sm text-slate-500">Maintenance requests logged for this location.</p>
        </div>
        {canCreate ? (
          <Link
            href={`/maintenance/new?locationId=${encodeURIComponent(locationId)}`}
            className="rounded-lg bg-[#b51266] px-3 py-2 text-sm font-medium text-white hover:bg-[#9a0f57]"
          >
            Log maintenance request
          </Link>
        ) : null}
      </div>

      {rows.length ? (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <Link href={`/maintenance/${row.id}`} className="font-medium text-slate-900 hover:text-[#b51266]">
                  {row.title || row.documentNo}
                </Link>
                <p className="text-sm text-slate-500">
                  {row.documentNo}
                  {row.reportedAt ? ` · ${row.reportedAt.slice(0, 16).replace("T", " ")}` : ""}
                  {maintenanceSlaBreached(row) ? " · SLA breached" : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge record={row} />
                <Link href={`/maintenance/${row.id}`} className="text-xs font-medium text-[#b51266] hover:underline">
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
          No maintenance requests logged for this location yet.
        </div>
      )}

      <p className="text-xs text-slate-400">Linked record: {entityLabel}</p>
    </div>
  );
}
