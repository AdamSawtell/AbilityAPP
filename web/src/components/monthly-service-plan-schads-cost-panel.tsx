"use client";

import { useMemo, useState } from "react";
import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import type { MonthlyServicePlanLine } from "@/lib/monthly-service-plan";
import {
  SCHADS_EMPLOYMENT_LOADING,
  SCHADS_PLANNING_LEVELS,
  summarizePlanSchadsPrediction,
} from "@/lib/schads-cost-prediction";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function MonthlyServicePlanSchadsCostPanel({ lines }: { lines: MonthlyServicePlanLine[] }) {
  const [employmentType, setEmploymentType] = useState("Casual");

  const prediction = useMemo(
    () => summarizePlanSchadsPrediction(lines, employmentType),
    [lines, employmentType]
  );

  const marginTone =
    prediction.marginPct == null
      ? "text-slate-700"
      : prediction.marginPct < 15
        ? "text-rose-700"
        : prediction.marginPct < 25
          ? "text-amber-700"
          : "text-emerald-700";

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">SCHADS cost prediction</h3>
          <p className="mt-1 text-xs text-slate-600">
            Planning estimate from planned hours × SCHADS weekday ordinary rates — not payroll, penalties, or super.
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Assumed employment type</span>
          <select
            className={`${inputClass} min-w-[10rem]`}
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
          >
            {Object.keys(SCHADS_EMPLOYMENT_LOADING).map((type) => (
              <option key={type} value={type}>
                {type}
                {SCHADS_EMPLOYMENT_LOADING[type] !== 1
                  ? ` (${Math.round((SCHADS_EMPLOYMENT_LOADING[type] - 1) * 100)}% loading)`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned hours</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{prediction.totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Predicted labour cost</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatPlanBudgetCurrency(prediction.totalPredictedCost)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned NDIS revenue</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {formatPlanBudgetCurrency(prediction.totalPlannedRevenue)}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Estimated margin</p>
          <p className={`mt-1 text-lg font-semibold ${marginTone}`}>
            {formatPlanBudgetCurrency(prediction.margin)}
          </p>
          {prediction.marginPct != null ? (
            <p className={`mt-0.5 text-xs ${marginTone}`}>{prediction.marginPct}% of planned revenue</p>
          ) : null}
        </div>
      </div>

      {prediction.lines.length ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Line</th>
                <th className="px-3 py-2 font-medium">Category</th>
                <th className="px-3 py-2 font-medium">Hours</th>
                <th className="px-3 py-2 font-medium">SCHADS level</th>
                <th className="px-3 py-2 font-medium">Rate</th>
                <th className="px-3 py-2 font-medium">Predicted cost</th>
                <th className="px-3 py-2 font-medium">Planned $</th>
                <th className="px-3 py-2 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prediction.lines.map((row) => (
                <tr key={row.lineId}>
                  <td className="px-3 py-2 text-slate-700">{row.lineNo}</td>
                  <td className="px-3 py-2 text-slate-700">{row.supportCategory || "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{row.hours.toFixed(1)}</td>
                  <td className="px-3 py-2 text-slate-700">{row.levelLabel}</td>
                  <td className="px-3 py-2 text-slate-700">{formatPlanBudgetCurrency(row.hourlyRate)}/hr</td>
                  <td className="px-3 py-2 text-slate-700">{formatPlanBudgetCurrency(row.predictedCost)}</td>
                  <td className="px-3 py-2 text-slate-700">{formatPlanBudgetCurrency(row.plannedRevenue)}</td>
                  <td
                    className={`px-3 py-2 font-medium ${
                      row.margin < 0 ? "text-rose-700" : row.margin < row.plannedRevenue * 0.15 ? "text-amber-700" : "text-emerald-700"
                    }`}
                  >
                    {formatPlanBudgetCurrency(row.margin)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">Add plan lines with planned hours to see SCHADS cost predictions.</p>
      )}

      <p className="mt-3 text-xs text-slate-500">
        Levels used: {Object.values(SCHADS_PLANNING_LEVELS).map((l) => l.label).join(", ")}. Support coordination lines
        default to Level 3.1; direct support to Level 2.1.
      </p>
    </section>
  );
}
