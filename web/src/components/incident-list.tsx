"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  formatDisplayDateTime,
  isNdisReportOverdue,
  ndisDeadlineLabel,
  statusTone,
  type IncidentRecord,
} from "@/lib/incident";

export type IncidentListScope = "open" | "reportable" | "all";

const toneClasses: Record<string, string> = {
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  rose: "bg-rose-50 text-rose-800 ring-rose-200",
};

function IncidentStatusBadge({ status }: { status: IncidentRecord["status"] }) {
  const tone = statusTone(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]}`}
    >
      {status}
    </span>
  );
}

function isOpenIncident(record: IncidentRecord) {
  return record.status !== "Closed";
}

export function IncidentList({ records }: { records: IncidentRecord[] }) {
  const searchParams = useSearchParams();
  const initialScope: IncidentListScope =
    searchParams.get("scope") === "reportable"
      ? "reportable"
      : searchParams.get("scope") === "all"
        ? "all"
        : "open";
  const [scope, setScope] = useState<IncidentListScope>(initialScope);
  const [search, setSearch] = useState("");

  const openCount = useMemo(() => records.filter(isOpenIncident).length, [records]);
  const reportableCount = useMemo(
    () => records.filter((r) => r.isReportable && isOpenIncident(r)).length,
    [records]
  );
  const overdueCount = useMemo(
    () => records.filter((r) => r.isReportable && isNdisReportOverdue(r)).length,
    [records]
  );

  const filtered = useMemo(() => {
    let rows = [...records];

    if (scope === "open") {
      rows = rows.filter(isOpenIncident);
    } else if (scope === "reportable") {
      rows = rows.filter((r) => r.isReportable);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.documentNo.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.reportableType.toLowerCase().includes(q)
      );
    }

    return rows.sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""));
  }, [records, scope, search]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setScope("open")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
            scope === "open"
              ? "border-[#f9a8d4] bg-[#fdf2f8] ring-1 ring-[#f9a8d4]/50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">Open incidents</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{openCount}</p>
          <p className="mt-1 text-xs text-slate-500">Not yet closed</p>
        </button>
        <button
          type="button"
          onClick={() => setScope("reportable")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
            scope === "reportable"
              ? "border-amber-300 bg-amber-50 ring-1 ring-amber-200"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">NDIS reportable</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{reportableCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            {overdueCount > 0 ? `${overdueCount} overdue notification${overdueCount === 1 ? "" : "s"}` : "Commission reporting"}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setScope("all")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
            scope === "all"
              ? "border-slate-300 bg-slate-50 ring-1 ring-slate-200"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">All incidents</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{records.length}</p>
          <p className="mt-1 text-xs text-slate-500">Full register</p>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            placeholder="Search title, document no., description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
          />
          <p className="text-sm text-slate-500">{filtered.length} record{filtered.length === 1 ? "" : "s"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Occurred</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">NDIS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No incidents match this view.
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/incidents/${record.id}`} className="text-[#b51266] hover:underline">
                        {record.documentNo}
                      </Link>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-800">{record.title || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {formatDisplayDateTime(record.occurredAt)}
                    </td>
                    <td className="px-4 py-3">
                      <IncidentStatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{record.severity}</td>
                    <td className="px-4 py-3">
                      {record.isReportable ? (
                        <span
                          className={`text-xs font-medium ${
                            isNdisReportOverdue(record) ? "text-rose-700" : "text-amber-800"
                          }`}
                        >
                          {ndisDeadlineLabel(record)}
                          {record.reportDeadlineAt ? (
                            <span className="mt-0.5 block font-normal text-slate-500">
                              Due {formatDisplayDateTime(record.reportDeadlineAt)}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
