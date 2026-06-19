"use client";

import { useMemo, useState } from "react";
import { EmployeeRecordLink } from "@/components/record-link";
import {
  RecordListDashboard,
  RecordListPagination,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
  recordListSelectClass,
} from "@/components/record-list-shell";
import { complianceSummary } from "@/lib/employee-compliance";
import {
  departmentOptions,
  employmentStatusOptions,
  type EmployeeRecord,
} from "@/lib/employee";

const PAGE_SIZE = 50;

type EmployeeListScope = "all" | "active" | "attention";

function ComplianceBadge({ employee }: { employee: EmployeeRecord }) {
  const summary = complianceSummary(employee);
  if (summary.level === "ok") {
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 ring-1 ring-emerald-200">
        Compliant
      </span>
    );
  }
  const styles =
    summary.level === "critical"
      ? "bg-red-50 text-red-800 ring-red-200"
      : "bg-amber-50 text-amber-800 ring-amber-200";
  const label = summary.level === "critical" ? "Action needed" : "Expiring";
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${styles}`}
      title={summary.messages.join("; ")}
    >
      {label}
    </span>
  );
}

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

function needsComplianceAttention(employee: EmployeeRecord) {
  return complianceSummary(employee).level !== "ok";
}

export function EmployeeList({ records }: { records: EmployeeRecord[] }) {
  const [scope, setScope] = useState<EmployeeListScope>("all");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("All");
  const [page, setPage] = useState(0);

  const activeCount = useMemo(
    () => records.filter((r) => r.employmentStatus === "Active").length,
    [records]
  );
  const attentionCount = useMemo(() => records.filter(needsComplianceAttention).length, [records]);

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));

    if (scope === "active") {
      rows = rows.filter((r) => r.employmentStatus === "Active");
    } else if (scope === "attention") {
      rows = rows.filter(needsComplianceAttention);
    }

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
  }, [records, scope, search, department, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function onScopeChange(next: EmployeeListScope) {
    setScope(next);
    setPage(0);
  }

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

  const resultSummary =
    filtered.length === 1
      ? "1 employee"
      : `${filtered.length} employees` +
        (filtered.length > PAGE_SIZE ? ` · page ${safePage + 1} of ${pageCount}` : "");

  return (
    <RecordListSection>
      <RecordListDashboard>
        <RecordListStatCard
          label="All employees"
          value={records.length}
          hint="Staff and contractors"
          active={scope === "all"}
          onClick={() => onScopeChange("all")}
        />
        <RecordListStatCard
          label="Active"
          value={activeCount}
          hint="Currently employed"
          active={scope === "active"}
          onClick={() => onScopeChange("active")}
        />
        <RecordListStatCard
          label="Needs attention"
          value={attentionCount}
          hint="Expired or expiring credentials"
          active={scope === "attention"}
          onClick={() => onScopeChange("attention")}
        />
      </RecordListDashboard>

      <RecordListTableCard
        hint="Search by name, key, email, or role. Use filters to narrow large lists."
        searchPlaceholder="Search employees…"
        search={search}
        onSearchChange={onSearchChange}
        resultSummary={resultSummary}
        filters={
          <>
            <select
              className={recordListSelectClass}
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
              className={recordListSelectClass}
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
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Search key</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Job title</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Compliance</th>
                <th className="px-4 py-3 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ComplianceBadge employee={record} />
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
      </RecordListTableCard>
    </RecordListSection>
  );
}
