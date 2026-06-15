"use client";

import { useMemo, useState } from "react";
import { EmployeeRecordLink } from "@/components/record-link";
import {
  departmentOptions,
  employmentStatusOptions,
  type EmployeeRecord,
} from "@/lib/employee";

const PAGE_SIZE = 50;

function EmployeeStatusBadge({ status }: { status: string }) {
  const styles =
    status === "Active"
      ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
      : status === "On leave"
        ? "bg-amber-50 text-amber-800 ring-amber-200"
        : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {status}
    </span>
  );
}

export function EmployeeList({ records }: { records: EmployeeRecord[] }) {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));

    if (department !== "All") {
      rows = rows.filter((r) => r.department === department);
    }
    if (status !== "All") {
      rows = rows.filter((r) => r.employmentStatus === status);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.searchKey.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.jobTitle.toLowerCase().includes(q) ||
          r.department.toLowerCase().includes(q) ||
          r.mobile.includes(q) ||
          r.phone.includes(q)
      );
    }

    return rows;
  }, [records, search, department, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function onDepartmentChange(value: string) {
    setDepartment(value);
    setPage(0);
  }

  function onStatusChange(value: string) {
    setStatus(value);
    setPage(0);
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs text-slate-500 lg:order-last">
          Search by name, key, email, or role. Use filters to narrow large lists.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            className="w-full min-w-[220px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 sm:w-72"
            placeholder="Search employees…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a]"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="All">All departments</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a]"
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="All">All statuses</option>
            {employmentStatusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500">
          {filtered.length} employee{filtered.length === 1 ? "" : "s"}
          {filtered.length > PAGE_SIZE ? ` · page ${safePage + 1} of ${pageCount}` : ""}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Search key</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Job title</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No employees match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((record) => (
                <tr key={record.id} className="group hover:bg-[#fdf2f8]/40">
                  <td className="px-4 py-3 font-medium">
                    <EmployeeRecordLink
                      id={record.id}
                      searchKey={record.searchKey}
                      name={record.name}
                      className="text-[#b51266] hover:underline"
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-900">{record.name}</td>
                  <td className="px-4 py-3 text-slate-600">{record.jobTitle || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{record.department || "—"}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <EmployeeStatusBadge status={record.employmentStatus} />
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-600" title={record.email}>
                    {record.email || "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500">
            Showing {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <button
            type="button"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
