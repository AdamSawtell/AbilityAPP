"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RecordListDashboard,
  RecordListPagination,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
  recordListSelectClass,
} from "@/components/record-list-shell";
import { maintenanceSlaBreached } from "@/lib/maintenance-compliance";
import {
  isOpenMaintenanceRequest,
  maintenanceRequestPriorityOptions,
  maintenanceRequestStatusOptions,
  maintenanceStatusLabel,
  type MaintenanceRequestRecord,
} from "@/lib/maintenance-request";
import type { LocationRecord } from "@/lib/location";

const PAGE_SIZE = 50;

function PriorityBadge({ priority }: { priority: string }) {
  const styles =
    priority === "urgent"
      ? "bg-rose-50 text-rose-800 ring-rose-200"
      : priority === "high"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : priority === "medium"
          ? "bg-sky-50 text-sky-800 ring-sky-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "closed"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "cancelled"
        ? "bg-slate-100 text-slate-600 ring-slate-200"
        : status === "resolved"
          ? "bg-violet-50 text-violet-900 ring-violet-200"
          : "bg-sky-50 text-sky-800 ring-sky-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {maintenanceStatusLabel(status)}
    </span>
  );
}

export function MaintenanceRequestList({
  records,
  locations,
}: {
  records: MaintenanceRequestRecord[];
  locations: LocationRecord[];
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("open");
  const [priority, setPriority] = useState("All");
  const [locationId, setLocationId] = useState("All");
  const [page, setPage] = useState(0);

  const locationName = useMemo(() => {
    const map = new Map(locations.map((l) => [l.id, l.name]));
    return (id: string) => map.get(id) ?? "—";
  }, [locations]);

  const openCount = useMemo(() => records.filter(isOpenMaintenanceRequest).length, [records]);
  const breachedCount = useMemo(
    () => records.filter((row) => isOpenMaintenanceRequest(row) && maintenanceSlaBreached(row)).length,
    [records]
  );

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => (b.reportedAt || "").localeCompare(a.reportedAt || ""));
    if (status === "open") rows = rows.filter(isOpenMaintenanceRequest);
    else if (status !== "all") rows = rows.filter((r) => r.status === status);
    if (priority !== "All") rows = rows.filter((r) => r.priority === priority);
    if (locationId !== "All") rows = rows.filter((r) => r.locationId === locationId);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.documentNo.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          locationName(r.locationId).toLowerCase().includes(q)
      );
    }
    return rows;
  }, [records, search, status, priority, locationId, locationName]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <RecordListDashboard>
        <RecordListStatCard label="All requests" value={records.length} />
        <RecordListStatCard label="Open" value={openCount} />
        <RecordListStatCard label="SLA breached" value={breachedCount} />
      </RecordListDashboard>

      <RecordListSection>
        <RecordListTableCard
          searchPlaceholder="Search title, document no, location…"
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          filters={
            <>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                className={recordListSelectClass}
              >
                <option value="open">Open</option>
                <option value="all">All statuses</option>
                {maintenanceRequestStatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {maintenanceStatusLabel(s)}
                  </option>
                ))}
              </select>
              <select
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(0);
                }}
                className={recordListSelectClass}
              >
                <option value="All">All priorities</option>
                {maintenanceRequestPriorityOptions.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <select
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  setPage(0);
                }}
                className={recordListSelectClass}
              >
                <option value="All">All locations</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.searchKey} — {l.name}
                  </option>
                ))}
              </select>
            </>
          }
          resultSummary={`${filtered.length} request${filtered.length === 1 ? "" : "s"}`}
          footer={
            <RecordListPagination
              page={safePage}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              total={filtered.length}
              onPrevious={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            />
          }
        >
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Request</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/maintenance/${row.id}`} className="font-medium text-slate-900 hover:text-[#b51266]">
                      {row.title || row.documentNo}
                    </Link>
                    <p className="text-xs text-slate-500">{row.documentNo}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{locationName(row.locationId)}</td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={row.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                    {maintenanceSlaBreached(row) ? (
                      <p className="mt-1 text-xs font-medium text-rose-700">SLA breached</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.reportedAt?.slice(0, 16).replace("T", " ") || "—"}</td>
                </tr>
              ))}
              {!pageRows.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    No maintenance requests match your filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </RecordListTableCard>
      </RecordListSection>
    </>
  );
}
