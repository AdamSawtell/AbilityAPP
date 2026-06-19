"use client";

import Link from "next/link";
import { complianceSummary, managerName } from "@/lib/employee-compliance";
import { formatEmployeeAddress, primaryEmployeeLocation, type EmployeeRecord } from "@/lib/employee";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function statusLabel(status: string) {
  return status.replace(/^\d+_/, "").replace(/_/g, " ");
}

export function EmployeeCoreSummary({
  employee,
  allEmployees,
  saved,
}: {
  employee: EmployeeRecord;
  allEmployees: EmployeeRecord[];
  saved?: boolean;
}) {
  const compliance = complianceSummary(employee);
  const primary = primaryEmployeeLocation(employee);
  const manager = managerName(employee, allEmployees);
  const credentialsTabHref = `/employees/${employee.id}?tab=${encodeURIComponent("Credentials Assigned")}`;

  return (
    <div className="mb-6 space-y-4">
      {compliance.level !== "ok" ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            compliance.level === "critical"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-medium">
            {compliance.level === "critical" ? "Compliance action required" : "Compliance warning"}
          </p>
          <ul className="mt-1 list-inside list-disc">
            {compliance.messages.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-bold text-white shadow-md">
              {initials(employee.name) || "?"}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{employee.name}</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                {employee.searchKey}
                {employee.employeeNumber ? ` · ${employee.employeeNumber}` : ""}
                {employee.jobTitle ? ` · ${employee.jobTitle}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {saved ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                    Saved
                  </span>
                ) : null}
                {employee.employmentStatus ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                    {statusLabel(employee.employmentStatus)}
                  </span>
                ) : null}
                {compliance.expiredCredentialCount > 0 ? (
                  <Link
                    href={credentialsTabHref}
                    className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-900 ring-1 ring-red-200 ring-inset hover:bg-red-100"
                  >
                    {compliance.expiredCredentialCount} expired credential
                    {compliance.expiredCredentialCount === 1 ? "" : "s"}
                  </Link>
                ) : null}
                {compliance.expiringCredentialCount > 0 ? (
                  <Link
                    href={credentialsTabHref}
                    className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200 ring-inset hover:bg-amber-100"
                  >
                    {compliance.expiringCredentialCount} expiring soon
                  </Link>
                ) : null}
                {employee.credentials.length > 0 &&
                compliance.expiredCredentialCount === 0 &&
                compliance.expiringCredentialCount === 0 ? (
                  <Link
                    href={credentialsTabHref}
                    className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 ring-1 ring-sky-200 ring-inset hover:bg-sky-100"
                  >
                    {employee.credentials.length} credential{employee.credentials.length === 1 ? "" : "s"}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <dl className="grid min-w-[220px] gap-3 text-sm sm:text-right">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Department</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{employee.department || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Site</dt>
              <dd className="mt-0.5 text-slate-700">{employee.siteBranch || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="grid border-t border-slate-100 bg-slate-50/60 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-0.5 truncate text-sm text-slate-800">{employee.email || "—"}</p>
          </div>
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-0.5 text-sm text-slate-800">{employee.phone || employee.mobile || "—"}</p>
          </div>
          <div className="border-b border-slate-100 px-5 py-3 lg:border-b-0 lg:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Primary site</p>
            <p className="mt-0.5 text-sm text-slate-800">
              {primary ? (
                <Link
                  href={`/employees/${employee.id}?tab=${encodeURIComponent("Address")}`}
                  className="hover:text-[#b51266] hover:underline"
                >
                  {formatEmployeeAddress(primary)}
                </Link>
              ) : (
                "—"
              )}
            </p>
          </div>
          <div className="px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Reports to</p>
            <p className="mt-0.5 text-sm text-slate-800">{manager || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
