"use client";

import { useMemo, useState } from "react";
import { LocationRecordLink } from "@/components/record-link";
import {
  locationStatusOptions,
  locationTypeOptions,
  type LocationRecord,
} from "@/lib/location";

const PAGE_SIZE = 50;

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Active"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "Planned"
        ? "bg-sky-50 text-sky-800 ring-sky-200"
        : status === "Closed"
          ? "bg-slate-100 text-slate-600 ring-slate-200"
          : "bg-amber-50 text-amber-800 ring-amber-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {status}
    </span>
  );
}

export function LocationList({ records }: { records: LocationRecord[] }) {
  const [search, setSearch] = useState("");
  const [locationType, setLocationType] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));
    if (locationType !== "All") rows = rows.filter((r) => r.locationType === locationType);
    if (status !== "All") rows = rows.filter((r) => r.status === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.searchKey.toLowerCase().includes(q) ||
          r.city.toLowerCase().includes(q) ||
          r.locationType.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [records, search, locationType, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="search"
          placeholder="Search locations…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
        />
        <select
          value={locationType}
          onChange={(e) => {
            setLocationType(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="All">All types</option>
          {locationTypeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="All">All statuses</option>
          {locationStatusOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <p className="text-sm text-slate-500 sm:ml-auto">
          {filtered.length} location{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Location</th>
              <th className="hidden px-4 py-3 text-left font-medium text-slate-600 md:table-cell">Type</th>
              <th className="hidden px-4 py-3 text-left font-medium text-slate-600 lg:table-cell">City</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Clients</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Staff</th>
              <th className="hidden px-4 py-3 text-left font-medium text-slate-600 md:table-cell">Services</th>
              <th className="px-4 py-3 text-left font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.map((loc) => (
              <tr key={loc.id} className="hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {loc.pictureUrl?.trim() ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={loc.pictureUrl}
                        alt=""
                        className="h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-slate-200"
                      />
                    ) : (
                      <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] text-slate-400 ring-1 ring-slate-200">
                        No photo
                      </span>
                    )}
                    <div>
                      <LocationRecordLink
                        id={loc.id}
                        searchKey={loc.searchKey}
                        name={loc.name}
                        className="font-medium text-[#b51266] hover:underline"
                      />
                      <p className="text-xs text-slate-500">{loc.searchKey}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{loc.locationType}</td>
                <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{loc.city || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{loc.clientLinks.length}</td>
                <td className="px-4 py-3 text-slate-600">{loc.employeeLinks.length}</td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{loc.productLinks.length}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={loc.status} />
                </td>
              </tr>
            ))}
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No locations match your filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {safePage + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
