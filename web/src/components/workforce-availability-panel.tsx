"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmployeeRecordLink } from "@/components/record-link";
import type { EmployeeRecord } from "@/lib/employee";
import type { EmployeeAvailabilityRow } from "@/lib/employee";
import { dayLabels } from "@/lib/my-workplace/types";
import { weeklyCapacityHours } from "@/lib/roster-capacity-planning";

type WorkerSupplyRow = {
  employee: EmployeeRecord;
  capacityHours: number;
  availabilitySummary: string;
  configured: boolean;
};

function summarizeAvailability(rows: EmployeeAvailabilityRow[]): string {
  if (!rows.length) return "Not configured";
  const available = rows.filter((r) => r.availability !== "Unavailable");
  if (!available.length) return "Unavailable all week";
  const parts = available.slice(0, 3).map((r) => {
    const label = dayLabels()[r.dayOfWeek] ?? "?";
    return `${label.slice(0, 3)} ${r.startTime.slice(0, 5)}–${r.endTime.slice(0, 5)}`;
  });
  return parts.join(", ") + (available.length > 3 ? "…" : "");
}

export function WorkforceAvailabilityPanel({ employees }: { employees: EmployeeRecord[] }) {
  const active = useMemo(
    () => [...employees].filter((e) => e.employmentStatus === "Active").sort((a, b) => a.name.localeCompare(b.name)),
    [employees]
  );
  const [availabilityByEmployee, setAvailabilityByEmployee] = useState<Map<string, EmployeeAvailabilityRow[]>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const map = new Map<string, EmployeeAvailabilityRow[]>();
      await Promise.all(
        active.slice(0, 40).map(async (employee) => {
          try {
            const res = await fetch(
              `/api/workforce/availability?employeeId=${encodeURIComponent(employee.id)}`,
              { credentials: "include" }
            );
            if (!res.ok) return;
            const data = (await res.json()) as { rows: EmployeeAvailabilityRow[] };
            map.set(employee.id, data.rows);
          } catch {
            // skip
          }
        })
      );
      if (!cancelled) {
        setAvailabilityByEmployee(map);
        setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [active]);

  const rows: WorkerSupplyRow[] = useMemo(
    () =>
      active.map((employee) => {
        const avail = availabilityByEmployee.get(employee.id) ?? [];
        const configured = avail.some((r) => r.availability !== "Unavailable" || r.notes.trim());
        return {
          employee,
          capacityHours: weeklyCapacityHours(employee),
          availabilitySummary: summarizeAvailability(avail),
          configured,
        };
      }),
    [active, availabilityByEmployee]
  );

  const notConfigured = rows.filter((r) => !r.configured).length;

  return (
    <section id="worker-supply" className="scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Worker schedule templates</h2>
        <p className="mt-1 text-sm text-slate-600">
          Weekly availability patterns across active workers — open an employee to edit their template.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">Loading worker templates…</p>
      ) : (
        <>
          {notConfigured ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              {notConfigured} worker{notConfigured === 1 ? "" : "s"} without a configured template — ask them to
              complete My workplace → Availability or edit on the employee record.
            </p>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Worker</th>
                  <th className="px-4 py-3">Contract capacity</th>
                  <th className="px-4 py-3">Weekly template</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.employee.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <EmployeeRecordLink
                        id={row.employee.id}
                        searchKey={row.employee.searchKey}
                        name={row.employee.name}
                        className="font-medium text-slate-900 hover:underline"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.capacityHours}h / week</td>
                    <td className="px-4 py-3 text-slate-700">{row.availabilitySummary}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/employees/${row.employee.id}?tab=${encodeURIComponent("Schedule template")}`}
                        className="text-[#b51266] hover:underline"
                      >
                        Edit template
                      </Link>
                      {" · "}
                      <Link
                        href={`/employees/${row.employee.id}?tab=${encodeURIComponent("Schedule")}`}
                        className="text-[#b51266] hover:underline"
                      >
                        View roster
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
