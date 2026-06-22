"use client";

import { useMemo } from "react";
import {
  rankWorkersForClient,
  staffClientMatchHints,
  type StaffClientMatchHint,
} from "@/lib/roster-staff-client-matching";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import type { RosterShiftRecord } from "@/lib/roster-shift";

function hintClass(severity: StaffClientMatchHint["severity"]): string {
  if (severity === "positive") {
    return "border-emerald-200 bg-emerald-50 text-emerald-950";
  }
  if (severity === "warning") {
    return "border-amber-200 bg-amber-50 text-amber-950";
  }
  return "border-sky-200 bg-sky-50 text-sky-950";
}

function HintList({ hints }: { hints: StaffClientMatchHint[] }) {
  if (!hints.length) return null;
  return (
    <ul className="space-y-1.5">
      {hints.map((hint) => (
        <li key={hint.code} className={`rounded-lg border px-3 py-2 text-sm ${hintClass(hint.severity)}`}>
          {hint.message}
        </li>
      ))}
    </ul>
  );
}

export function StaffClientMatchHintsPanel({
  client,
  employee,
  employees,
  rosterShifts,
  excludeShiftId,
  onSelectWorker,
  publishMode = false,
}: {
  client: ClientRecord | undefined;
  employee: EmployeeRecord | undefined;
  employees: EmployeeRecord[];
  rosterShifts: RosterShiftRecord[];
  excludeShiftId?: string;
  onSelectWorker?: (employeeId: string) => void;
  publishMode?: boolean;
}) {
  const hints = useMemo(
    () => (client ? staffClientMatchHints({ client, employee, rosterShifts, excludeShiftId }) : []),
    [client, employee, rosterShifts, excludeShiftId]
  );
  const suggestions = useMemo(
    () =>
      client && !employee?.id
        ? rankWorkersForClient({ client, employees, rosterShifts, excludeShiftId, limit: 4 })
        : [],
    [client, employee?.id, employees, rosterShifts, excludeShiftId]
  );

  if (!client) return null;

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Staff–client matching</h3>
      <p className="mt-1 text-xs text-slate-600">
        {publishMode
          ? "Missing or expired mandatory credentials block publish. Other hints are advisory."
          : "Review before rostering. Credential gaps block publish when status is Published."}
      </p>

      {!employee?.id && suggestions.length ? (
        <div className="mt-3">
          <p className="text-xs font-medium text-slate-700">Suggested workers for {client.searchKey}</p>
          <ul className="mt-2 space-y-2">
            {suggestions.map((row) => {
              const topHint = row.hints.find((h) => h.code === "prior-roster") ?? row.hints[0];
              return (
                <li key={row.employeeId}>
                  <button
                    type="button"
                    onClick={() => onSelectWorker?.(row.employeeId)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm hover:border-[#f9a8d4] hover:bg-white"
                  >
                    <span className="font-medium text-slate-900">{row.employeeName}</span>
                    {topHint ? (
                      <span className="mt-0.5 block text-xs text-slate-600">{topHint.message}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {employee?.id ? (
        <div className="mt-3">
          <HintList hints={hints} />
        </div>
      ) : null}
    </div>
  );
}
