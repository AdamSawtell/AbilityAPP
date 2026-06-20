"use client";

import { useEffect, useMemo, useState } from "react";
import { EmployeeRecordLink } from "@/components/record-link";
import type { EmployeeRecord } from "@/lib/employee";
import {
  buildCapacityPlan,
  employeeCapacityForWeek,
  type WeekCapacitySummary,
} from "@/lib/roster-capacity-planning";
import {
  addDaysIso,
  formatDayHeading,
  normalizeRosterShift,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

function utilizationTone(pct: number): string {
  if (pct >= 95) return "text-rose-700";
  if (pct >= 80) return "text-amber-800";
  return "text-emerald-800";
}

export function RosterCapacityPanel({
  rosterShifts,
  employees,
  anchorWeekStart,
  weekCount,
  onAnchorChange,
  onWeekCountChange,
}: {
  rosterShifts: RosterShiftRecord[];
  employees: EmployeeRecord[];
  anchorWeekStart: string;
  weekCount: number;
  onAnchorChange: (weekStart: string) => void;
  onWeekCountChange: (count: number) => void;
}) {
  const normalized = useMemo(() => rosterShifts.map(normalizeRosterShift), [rosterShifts]);
  const plan = useMemo(
    () => buildCapacityPlan(anchorWeekStart, weekCount, normalized, employees),
    [anchorWeekStart, weekCount, normalized, employees]
  );

  const [detailWeek, setDetailWeek] = useState(anchorWeekStart);

  useEffect(() => {
    setDetailWeek(anchorWeekStart);
  }, [anchorWeekStart]);
  const employeeRows = useMemo(
    () => employeeCapacityForWeek(detailWeek, normalized, employees),
    [detailWeek, normalized, employees]
  );

  const totals = useMemo(() => {
    const demand = plan.weeks.reduce((s, w) => s + w.demandHours, 0);
    const staffed = plan.weeks.reduce((s, w) => s + w.staffedHours, 0);
    const supply = plan.weeks.reduce((s, w) => s + w.supplyHours, 0);
    return { demand, staffed, supply };
  }, [plan.weeks]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => onAnchorChange(addDaysIso(anchorWeekStart, -7 * weekCount))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Previous {weekCount} weeks
        </button>
        <p className="text-sm font-medium text-slate-800">
          Capacity from {formatDayHeading(anchorWeekStart)} —{" "}
          {formatDayHeading(addDaysIso(plan.weeks[plan.weeks.length - 1]?.weekStart ?? anchorWeekStart, 6))}
        </p>
        <button
          type="button"
          onClick={() => onAnchorChange(addDaysIso(anchorWeekStart, 7 * weekCount))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Next {weekCount} weeks
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-slate-600">
          Horizon
          <select
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm"
            value={weekCount}
            onChange={(e) => onWeekCountChange(Number(e.target.value))}
          >
            {[4, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n} weeks
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-sm text-slate-600">
        Compare rostered demand to active worker capacity (employment type defaults: full-time 38h, part-time 24h).
        Workers can set preferred availability on My workplace — coordinator view uses contract type until availability
        sync is wired.
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Demand (shift hours)</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totals.demand.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Staffed hours</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totals.staffed.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Worker supply</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totals.supply.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Avg utilization</p>
          <p className={`mt-1 text-2xl font-semibold ${utilizationTone(totals.supply ? (totals.staffed / totals.supply) * 100 : 0)}`}>
            {totals.supply ? Math.round((totals.staffed / totals.supply) * 100) : 0}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-left">
              <th className="px-4 py-3 font-semibold text-slate-700">Week</th>
              <th className="px-3 py-3 font-semibold text-slate-700">Demand</th>
              <th className="px-3 py-3 font-semibold text-slate-700">Staffed</th>
              <th className="px-3 py-3 font-semibold text-slate-700">Unstaffed</th>
              <th className="px-3 py-3 font-semibold text-slate-700">Supply</th>
              <th className="px-3 py-3 font-semibold text-slate-700">Utilization</th>
              <th className="px-3 py-3 font-semibold text-slate-700">Over cap.</th>
            </tr>
          </thead>
          <tbody>
            {plan.weeks.map((week) => (
              <WeekRow
                key={week.weekStart}
                week={week}
                selected={detailWeek === week.weekStart}
                onSelect={() => setDetailWeek(week.weekStart)}
              />
            ))}
          </tbody>
        </table>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Worker load — week commencing {formatDayHeading(detailWeek)}
        </h2>
        {employeeRows.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="py-2 pr-4 font-medium">Worker</th>
                  <th className="py-2 pr-4 font-medium">Capacity</th>
                  <th className="py-2 pr-4 font-medium">Rostered</th>
                  <th className="py-2 font-medium">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {employeeRows.map((row) => {
                  const employee = employees.find((e) => e.id === row.employeeId);
                  return (
                    <tr key={row.employeeId} className="border-b border-slate-50 last:border-0">
                      <td className="py-2 pr-4">
                        {employee ? (
                          <>
                            <EmployeeRecordLink
                              id={employee.id}
                              searchKey={employee.searchKey}
                              name={employee.name}
                              className="font-medium text-slate-900 hover:underline"
                            />
                            <span className="ml-2 text-xs text-slate-500">{employee.employmentType}</span>
                            {employee.employmentStatus !== "Active" ? (
                              <span className="ml-1 text-xs font-medium text-amber-800">{employee.employmentStatus}</span>
                            ) : null}
                          </>
                        ) : (
                          <span className="text-slate-700">{row.employeeId}</span>
                        )}
                      </td>
                      <td className="py-2 pr-4 text-slate-700">{row.capacityHours}h</td>
                      <td className="py-2 pr-4 text-slate-700">{row.rosteredHours.toFixed(1)}h</td>
                      <td className={`py-2 font-medium ${row.overCapacity ? "text-rose-700" : "text-slate-700"}`}>
                        {row.overCapacity
                          ? `${Math.abs(row.remainingHours).toFixed(1)}h over`
                          : `${row.remainingHours.toFixed(1)}h`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">No active workers or rostered hours this week.</p>
        )}
      </section>
    </div>
  );
}

function WeekRow({
  week,
  selected,
  onSelect,
}: {
  week: WeekCapacitySummary;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <tr
      className={`cursor-pointer border-b border-slate-100 last:border-0 ${selected ? "bg-[#fdf2f8]" : "hover:bg-slate-50/80"}`}
      onClick={onSelect}
    >
      <td className="px-4 py-3 font-medium text-slate-900">W/C {formatDayHeading(week.weekStart)}</td>
      <td className="px-3 py-3 text-slate-700">{week.demandHours.toFixed(1)}h</td>
      <td className="px-3 py-3 text-slate-700">{week.staffedHours.toFixed(1)}h</td>
      <td className="px-3 py-3 text-slate-700">
        {week.unstaffedHours > 0 ? (
          <span className="font-medium text-sky-700">{week.unstaffedHours.toFixed(1)}h</span>
        ) : (
          "—"
        )}
      </td>
      <td className="px-3 py-3 text-slate-700">{week.supplyHours.toFixed(1)}h</td>
      <td className={`px-3 py-3 font-medium ${utilizationTone(week.utilizationPct)}`}>{week.utilizationPct}%</td>
      <td className="px-3 py-3 text-slate-700">
        {week.overCapacityWorkers ? (
          <span className="font-medium text-rose-700">{week.overCapacityWorkers}</span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}
