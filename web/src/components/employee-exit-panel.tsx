"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { buildExitChecklistCsv, evaluateEmployeeExit } from "@/lib/employee-exit-workflow";
import type { EmployeeRecord } from "@/lib/employee";
import { downloadCsv } from "@/lib/reports/export";

function stepClass(status: string): string {
  if (status === "done") return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  if (status === "pending") return "border-rose-200 bg-rose-50 text-rose-950";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function EmployeeExitPanel({ employee }: { employee: EmployeeRecord }) {
  const { rosterShifts } = useData();
  const { canWriteWindow } = useAuth();
  const canManageAccess = canWriteWindow("employee-system-access");

  const evaluation = useMemo(
    () =>
      evaluateEmployeeExit({
        employee,
        rosterShifts,
        actorCanRevokeAccess: canManageAccess,
      }),
    [employee, rosterShifts, canManageAccess]
  );

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Employee exit workflow</h2>
          <p className="mt-1 text-sm text-slate-600">
            Checklist before offboarding — separation letter, roster clearance, end date, and system access.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            downloadCsv(`${employee.searchKey}-exit-checklist.csv`, buildExitChecklistCsv(employee, evaluation))
          }
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export checklist
        </button>
      </div>

      <p
        className={`mt-4 rounded-lg border px-3 py-2 text-sm ${
          evaluation.readyToExit
            ? "border-emerald-200 bg-emerald-50 text-emerald-950"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        {evaluation.readyToExit
          ? "Exit checklist complete — confirm payroll and access revocation with HR."
          : `Resolve ${evaluation.blockers.length} blocker${evaluation.blockers.length === 1 ? "" : "s"} before finalising exit.`}
      </p>

      <ul className="mt-4 space-y-2">
        {evaluation.steps.map((step) => (
          <li key={step.code} className={`rounded-lg border px-3 py-2 text-sm ${stepClass(step.status)}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="font-medium">{step.label}</p>
              {step.href ? (
                <Link href={step.href} className="text-xs font-medium underline">
                  Open
                </Link>
              ) : null}
            </div>
            <p className="mt-1 text-xs opacity-90">{step.message}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
