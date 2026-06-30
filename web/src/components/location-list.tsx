"use client";

import { useMemo, useState } from "react";
import { LocationRecordLink } from "@/components/record-link";
import {
  RecordListDashboard,
  RecordListPagination,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
  recordListSelectClass,
} from "@/components/record-list-shell";
import { EmptyStateRow } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth-store";
import {
  locationStatusOptions,
  locationTypeOptions,
  type LocationRecord,
} from "@/lib/location";

const PAGE_SIZE = 50;

type LocationListScope = "all" | "active" | "occupied";

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
  const { canWriteWindow } = useAuth();
  const canCreateLocation = canWriteWindow("locations");
  const [scope, setScope] = useState<LocationListScope>("all");
  const [search, setSearch] = useState("");
  const [locationType, setLocationType] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(0);

  const activeCount = useMemo(() => records.filter((r) => r.status === "Active").length, [records]);
  const occupiedCount = useMemo(
    () => records.filter((r) => r.clientLinks.length > 0 || r.employeeLinks.length > 0).length,
    [records]
  );

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));

    if (scope === "active") {
      rows = rows.filter((r) => r.status === "Active");
    } else if (scope === "occupied") {
      rows = rows.filter((r) => r.clientLinks.length > 0 || r.employeeLinks.length > 0);
    }

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
  }, [records, scope, search, locationType, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function onScopeChange(next: LocationListScope) {
    setScope(next);
    setPage(0);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function clearFilters() {
    setSearch("");
    setLocationType("All");
    setStatus("All");
    setScope("all");
    setPage(0);
  }

  const resultSummary =
    filtered.length === 1
      ? "1 location"
      : `${filtered.length} locations` +
        (filtered.length > PAGE_SIZE ? ` · page ${safePage + 1} of ${pageCount}` : "");

  return (
    <RecordListSection>
      <RecordListDashboard>
        <RecordListStatCard
          label="All locations"
          value={records.length}
          hint="SIL houses, day programs, and sites"
          active={scope === "all"}
          onClick={() => onScopeChange("all")}
        />
        <RecordListStatCard
          label="Active"
          value={activeCount}
          hint="Currently in service"
          active={scope === "active"}
          onClick={() => onScopeChange("active")}
        />
        <RecordListStatCard
          label="Linked sites"
          value={occupiedCount}
          hint="With clients or staff assigned"
          active={scope === "occupied"}
          onClick={() => onScopeChange("occupied")}
        />
      </RecordListDashboard>

      <RecordListTableCard
        hint="Search by name, key, city, or type. Filter by status or location type."
        searchPlaceholder="Search locations…"
        search={search}
        onSearchChange={onSearchChange}
        resultSummary={resultSummary}
        filters={
          <>
            <select
              className={recordListSelectClass}
              value={locationType}
              onChange={(e) => {
                setLocationType(e.target.value);
                setPage(0);
              }}
            >
              <option value="All">All types</option>
              {locationTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className={recordListSelectClass}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="All">All statuses</option>
              {locationStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        }
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Location
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                  Type
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 lg:table-cell">
                  City
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Clients
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Staff
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 md:table-cell">
                  Services
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                records.length === 0 ? (
                  <EmptyStateRow
                    colSpan={7}
                    variant="empty"
                    icon="locations"
                    heading="No locations set up"
                    message="Add your first support site — SIL house, day program, or community hub."
                    action={canCreateLocation ? { label: "Add location", href: "/locations/new" } : undefined}
                  />
                ) : (
                  <EmptyStateRow
                    colSpan={7}
                    variant="no-results"
                    icon="search"
                    heading="No locations match your search"
                    message="Try a different search term or clear your filters."
                    action={{ label: "Clear filters", onClick: clearFilters }}
                  />
                )
              ) : null}
              {pageRows.map((loc) => (
                <tr key={loc.id} className="hover:bg-[#fdf2f8]/40">
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
            </tbody>
          </table>
        </div>
      </RecordListTableCard>
    </RecordListSection>
  );
}
