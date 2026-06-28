"use client";

import { useMemo, useState } from "react";
import { FleetVehicleRecordLink } from "@/components/fleet-record-link";
import {
  RecordListDashboard,
  RecordListPagination,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
  recordListSelectClass,
} from "@/components/record-list-shell";
import {
  fleetVehicleServiceSummary,
  fleetVehicleStatusOptions,
  type FleetVehicleRecord,
} from "@/lib/fleet-vehicle";

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "active"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "off_road"
        ? "bg-rose-50 text-rose-800 ring-rose-200"
        : status === "disposed"
          ? "bg-slate-100 text-slate-600 ring-slate-200"
          : "bg-amber-50 text-amber-800 ring-amber-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function FleetVehicleList({ records }: { records: FleetVehicleRecord[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(0);

  const activeCount = useMemo(() => records.filter((r) => r.status === "active").length, [records]);
  const offRoadCount = useMemo(() => records.filter((r) => r.status === "off_road").length, [records]);

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));
    if (status !== "All") rows = rows.filter((r) => r.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.searchKey.toLowerCase().includes(q) ||
          r.registrationNumber.toLowerCase().includes(q) ||
          `${r.make} ${r.model}`.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [records, search, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <RecordListDashboard>
        <RecordListStatCard label="All vehicles" value={records.length} />
        <RecordListStatCard label="Active" value={activeCount} />
        <RecordListStatCard label="Off road" value={offRoadCount} />
      </RecordListDashboard>

      <RecordListSection>
        <RecordListTableCard
          searchPlaceholder="Search name, rego, make…"
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPage(0);
          }}
          filters={
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
              className={recordListSelectClass}
            >
              <option value="All">All statuses</option>
              {fleetVehicleStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          }
          resultSummary={`${filtered.length} vehicle${filtered.length === 1 ? "" : "s"}`}
          footer={
            <RecordListPagination
              page={safePage}
              pageCount={pageCount}
              total={filtered.length}
              pageSize={PAGE_SIZE}
              onPrevious={() => setPage((p) => Math.max(0, p - 1))}
              onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            />
          }
        >
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Rego</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Odometer</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <FleetVehicleRecordLink vehicle={row} />
                  <p className="text-xs text-slate-500">
                    {row.make} {row.model}
                    {row.year ? ` · ${row.year}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3">{row.registrationNumber || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-slate-600">{fleetVehicleServiceSummary(row)}</td>
                <td className="px-4 py-3">{row.odometerReading === "" ? "—" : `${row.odometerReading} km`}</td>
              </tr>
            ))}
            {!pageRows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  No vehicles match your filters.
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
