"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ClientRecordLink } from "@/components/record-link";
import type { ClientRecord } from "@/lib/client";
import { detectRosterGaps, type RosterGap } from "@/lib/roster-gap-analysis";
import { formatDayHeading, forwardWeekStarts, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";

function gapLabel(gap: RosterGap): string {
  if (gap.code === "VACANT_SHIFT") return "Vacant shift";
  return "Coverage gap";
}

export function RosterGapsPanel({
  rosterShifts,
  serviceBookings,
  clients,
  anchorWeekStart,
  weekCount,
  onFillGap,
  onRequestAgency,
}: {
  rosterShifts: RosterShiftRecord[];
  serviceBookings: ServiceBookingRecord[];
  clients: ClientRecord[];
  anchorWeekStart: string;
  weekCount: number;
  onFillGap?: (gap: RosterGap) => void;
  onRequestAgency?: (gap: RosterGap) => void;
}) {
  const weeks = useMemo(() => forwardWeekStarts(anchorWeekStart, weekCount), [anchorWeekStart, weekCount]);
  const normalized = useMemo(() => rosterShifts.map(normalizeRosterShift), [rosterShifts]);

  const gaps = useMemo(
    () => detectRosterGaps(normalized, serviceBookings, weeks),
    [normalized, serviceBookings, weeks]
  );

  const vacantCount = gaps.filter((g) => g.code === "VACANT_SHIFT").length;
  const coverageCount = gaps.filter((g) => g.code === "COVERAGE_GAP").length;

  if (!gaps.length) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-950">
        No roster gaps in this horizon — all active bookings have staffed shifts and no vacant published shifts.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-950">
          {vacantCount} vacant shift{vacantCount === 1 ? "" : "s"}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 font-medium text-sky-950">
          {coverageCount} coverage gap{coverageCount === 1 ? "" : "s"}
        </span>
      </div>

      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
        {gaps.map((gap) => {
          const client = clients.find((c) => c.id === gap.clientId);
          const booking = gap.serviceBookingId
            ? serviceBookings.find((b) => b.id === gap.serviceBookingId)
            : undefined;
          const key = gap.shiftId ?? `${gap.code}-${gap.clientId}-${gap.weekStart}`;
          return (
            <li key={key} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{gapLabel(gap)}</p>
                <p className="mt-1 text-sm text-slate-800">{gap.message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  {client ? (
                    <ClientRecordLink
                      id={client.id}
                      searchKey={client.searchKey}
                      name={client.name}
                      className="font-medium hover:underline"
                    />
                  ) : null}
                  {gap.weekStart ? (
                    <span>W/C {formatDayHeading(gap.weekStart)}</span>
                  ) : gap.shiftDate ? (
                    <span>{formatDayHeading(gap.shiftDate)}</span>
                  ) : null}
                  {booking ? (
                    <Link href={`/service-bookings/${booking.id}`} className="text-[#b51266] hover:underline">
                      Booking {booking.documentNo}
                    </Link>
                  ) : null}
                </div>
              </div>
              {onFillGap && gap.code === "COVERAGE_GAP" ? (
                <button
                  type="button"
                  onClick={() => onFillGap(gap)}
                  className="shrink-0 rounded-lg border border-[#d4147a]/30 bg-[#fdf2f8] px-3 py-1.5 text-xs font-medium text-[#b51266] hover:bg-[#fce7f3]"
                >
                  Add shift
                </button>
              ) : null}
              {onFillGap && gap.code === "VACANT_SHIFT" && gap.shiftId ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onFillGap(gap)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Assign worker
                  </button>
                  {onRequestAgency ? (
                    <button
                      type="button"
                      onClick={() => onRequestAgency(gap)}
                      className="rounded-lg border border-[#d4147a]/30 bg-[#fdf2f8] px-3 py-1.5 text-xs font-medium text-[#b51266] hover:bg-[#fce7f3]"
                    >
                      Request agency
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
