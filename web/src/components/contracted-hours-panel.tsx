"use client";

import Link from "next/link";
import { useMemo } from "react";
import { EmployeeRecordLink } from "@/components/record-link";
import { useData } from "@/lib/data-store";
import {
  employeesWithContractShortfall,
  formatContractedHoursIndicator,
  summarizeEmployeeContractedHours,
} from "@/lib/contracted-hours";
import { findPayPeriodInstanceForDate, formatPayPeriodLabel } from "@/lib/pay-period";

export function ContractedHoursPanel({ payPeriodInstanceId }: { payPeriodInstanceId?: string }) {
  const { employees, rosterShifts, payPeriodInstances, payPeriodDefinitions } = useData();

  const payPeriod = useMemo(() => {
    if (payPeriodInstanceId) {
      return payPeriodInstances.find((row) => row.id === payPeriodInstanceId);
    }
    return findPayPeriodInstanceForDate(payPeriodInstances, new Date().toISOString().slice(0, 10));
  }, [payPeriodInstanceId, payPeriodInstances]);

  const definition = payPeriodDefinitions.find((row) => row.id === payPeriod?.definitionId);

  const shortfalls = useMemo(() => {
    if (!payPeriod) return [];
    return employeesWithContractShortfall(employees, payPeriod, rosterShifts);
  }, [employees, payPeriod, rosterShifts]);

  const allSummaries = useMemo(() => {
    if (!payPeriod) return [];
    return employees
      .filter((e) => e.employmentStatus === "Active")
      .map((employee) => summarizeEmployeeContractedHours(employee, payPeriod, rosterShifts))
      .filter((row) => row.contractedHours > 0)
      .sort((a, b) => a.shortfallHours - b.shortfallHours);
  }, [employees, payPeriod, rosterShifts]);

  if (!payPeriod) {
    return (
      <p className="text-sm text-slate-600">
        Configure pay periods in{" "}
        <Link href="/admin/pay-periods" className="font-medium text-[#b51266] hover:underline">
          Admin → Pay periods
        </Link>{" "}
        to track contracted hours.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Contracted minimum hours for{" "}
        <strong>
          {definition
            ? formatPayPeriodLabel(definition, payPeriod.startDate, payPeriod.endDate)
            : `${payPeriod.startDate} – ${payPeriod.endDate}`}
        </strong>
        . Find-and-fill prioritises workers with unmet contracted hours.
      </p>

      {shortfalls.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <strong>{shortfalls.length}</strong> employee{shortfalls.length === 1 ? "" : "s"} below contracted minimum —
          roster additional shifts or open shifts to them first.
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          All tracked employees meet contracted minimums for this pay period.
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">Employee</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Contracted</th>
              <th className="px-4 py-2">Rostered</th>
              <th className="px-4 py-2">Shortfall</th>
            </tr>
          </thead>
          <tbody>
            {allSummaries.map((row) => (
              <tr key={row.employeeId} className="border-b border-slate-50">
                <td className="px-4 py-2">
                  <EmployeeRecordLink
                    id={row.employeeId}
                    searchKey={row.employeeName}
                    name={row.employeeName}
                  />
                </td>
                <td className="px-4 py-2">{row.employmentType || "—"}</td>
                <td className="px-4 py-2">{row.contractedHours}h</td>
                <td className="px-4 py-2">{row.rosteredHours}h</td>
                <td className="px-4 py-2">
                  {row.shortfallHours > 0 ? (
                    <span className="font-medium text-amber-800">{row.shortfallHours}h</span>
                  ) : (
                    <span className="text-emerald-700">Met</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
