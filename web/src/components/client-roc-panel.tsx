"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { summarizeClientRocPlanning } from "@/lib/client-roc-planning";
import { rosterOfCarePeriodHours } from "@/lib/roster-of-care-hours";
import { rocWeekdayLabel, type RosterOfCareRecord } from "@/lib/roster-of-care";
import { weekStartFromDate } from "@/lib/roster-shift";

function RocCard({
  roc,
  rosteredWeeklyHours,
  gapHours,
  locationLabel,
}: {
  roc: RosterOfCareRecord;
  rosteredWeeklyHours: number;
  gapHours: number;
  locationLabel: (id: string) => string;
}) {
  const periods = rosterOfCarePeriodHours(roc.lines);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{roc.name}</h3>
          <p className="mt-1 text-xs text-slate-500">
            {roc.status} · {roc.source} · valid from {roc.validFrom || "—"}
          </p>
        </div>
        <Link
          href="/rostering"
          className="text-sm font-medium text-[#b51266] hover:underline"
        >
          Open rostering → RoC
        </Link>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Weekly requirement</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{periods.weekly.toFixed(1)}h</p>
          <p className="text-xs text-slate-600">{periods.lineCount} line{periods.lineCount === 1 ? "" : "s"}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Fortnight</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{periods.fortnightly.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Month (4 weeks)</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{periods.monthly.toFixed(1)}h</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Rostered this week</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{rosteredWeeklyHours.toFixed(1)}h</p>
          <p className={`text-xs ${gapHours > 0.05 ? "text-amber-800" : "text-emerald-800"}`}>
            {gapHours > 0.05 ? `${gapHours.toFixed(1)}h below template` : "Meets or exceeds template"}
          </p>
        </div>
      </div>

      {roc.lines.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pr-3 py-2">Day</th>
                <th className="pr-3 py-2">Time</th>
                <th className="pr-3 py-2">Type</th>
                <th className="pr-3 py-2">Location</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {roc.lines.map((line) => (
                <tr key={line.id} className="border-t border-slate-100 text-slate-700">
                  <td className="pr-3 py-2">{rocWeekdayLabel(line.weekday)}</td>
                  <td className="pr-3 py-2">
                    {line.startTime} – {line.endTime}
                  </td>
                  <td className="pr-3 py-2">{line.supportType}</td>
                  <td className="pr-3 py-2">{locationLabel(line.locationId)}</td>
                  <td className="py-2">{line.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">No weekly lines yet — import or generate from Rostering → RoC.</p>
      )}
    </article>
  );
}

export function ClientRosterOfCarePanel({ clientId }: { clientId: string }) {
  const { rosterOfCares, rosterShifts, locations } = useData();
  const { canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("rostering");
  const [weekStart, setWeekStart] = useState(() => weekStartFromDate(new Date().toISOString().slice(0, 10)));

  const rows = useMemo(
    () => summarizeClientRocPlanning(rosterOfCares, rosterShifts, clientId, weekStart),
    [rosterOfCares, rosterShifts, clientId, weekStart]
  );

  const locationLabel = (id: string) => locations.find((l) => l.id === id)?.searchKey || id || "—";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Weekly roster-of-care templates for this participant — compare required hours to what is rostered for the
        selected week.
      </p>

      <label className="block max-w-xs text-sm">
        <span className="mb-1 block font-medium text-slate-700">Compare rostered hours — week starting</span>
        <input
          type="date"
          value={weekStart}
          onChange={(e) => setWeekStart(weekStartFromDate(e.target.value))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </label>

      {!rows.length ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-8 text-center text-sm text-slate-600">
          No roster of care for this client yet.
          {canEdit ? (
            <>
              {" "}
              <Link href="/rostering" className="font-medium text-[#b51266] hover:underline">
                Import or generate on Rostering → RoC
              </Link>
              .
            </>
          ) : null}
        </div>
      ) : (
        rows.map((row) => (
          <RocCard
            key={row.roc.id}
            roc={row.roc}
            rosteredWeeklyHours={row.rosteredWeeklyHours}
            gapHours={row.gapHours}
            locationLabel={locationLabel}
          />
        ))
      )}
    </div>
  );
}
