"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import type { LocationRecord } from "@/lib/location";
import { buildClaimedShift, listOpenMarketplaceShifts } from "@/lib/roster-open-shifts";
import { formatDayHeading, formatShiftTimeRange, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";

export function OpenShiftsMarketplacePanel({
  rosterShifts,
  clients,
  employees,
  locations,
  serviceBookings,
  mode,
  currentEmployeeId,
  onAssign,
  onClaim,
}: {
  rosterShifts: RosterShiftRecord[];
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  serviceBookings: ServiceBookingRecord[];
  mode: "coordinator" | "worker";
  currentEmployeeId?: string;
  onAssign?: (shift: RosterShiftRecord) => void;
  onClaim?: (shift: RosterShiftRecord) => Promise<string | null>;
}) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openShifts = useMemo(() => listOpenMarketplaceShifts(rosterShifts), [rosterShifts]);

  async function handleClaim(shift: RosterShiftRecord) {
    if (!onClaim) return;
    setClaimingId(shift.id);
    setError("");
    setMessage("");
    const err = await onClaim(shift);
    setClaimingId(null);
    if (err) setError(err);
    else setMessage(`You claimed the shift on ${formatDayHeading(shift.shiftDate)}.`);
  }

  if (!openShifts.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
        No open shifts right now. Coordinators post vacant Draft shifts to the marketplace when cover is needed.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {openShifts.map((shift) => {
          const client = clients.find((c) => c.id === shift.clientId);
          const location = locations.find((l) => l.id === shift.locationId);
          const booking = serviceBookings.find((b) => b.id === shift.serviceBookingId);
          const previewClaim =
            mode === "worker" && currentEmployeeId
              ? buildClaimedShift(shift, currentEmployeeId, "Self-service", rosterShifts)
              : null;
          const claimBlocked = previewClaim && !previewClaim.ok;

          return (
            <article
              key={shift.id}
              className="flex flex-col rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">Open shift</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {formatDayHeading(shift.shiftDate)}
                  </p>
                  <p className="text-sm text-slate-700">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
                </div>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600 ring-1 ring-slate-200">
                  {shift.status}
                </span>
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-700">
                {client ? (
                  <ClientRecordLink
                    id={client.id}
                    searchKey={client.searchKey}
                    name={client.name}
                    className="font-medium hover:underline"
                  />
                ) : (
                  <p>No client linked</p>
                )}
                {location ? <p>{location.name}</p> : null}
                {booking ? (
                  <Link href={`/service-bookings/${booking.id}`} className="text-[#b51266] hover:underline">
                    Booking {booking.documentNo}
                  </Link>
                ) : null}
                {shift.notes ? <p className="text-slate-600">{shift.notes}</p> : null}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {mode === "coordinator" && onAssign ? (
                  <button
                    type="button"
                    onClick={() => onAssign(normalizeRosterShift(shift))}
                    className="rounded-lg bg-[#d4147a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b51266]"
                  >
                    Assign worker
                  </button>
                ) : null}
                {mode === "worker" && onClaim ? (
                  <button
                    type="button"
                    disabled={!currentEmployeeId || claimingId === shift.id || Boolean(claimBlocked)}
                    title={claimBlocked ? previewClaim?.message : undefined}
                    onClick={() => void handleClaim(shift)}
                    className="rounded-lg bg-[#d4147a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {claimingId === shift.id ? "Claiming…" : "Claim shift"}
                  </button>
                ) : null}
              </div>
              {claimBlocked && previewClaim && !previewClaim.ok ? (
                <p className="mt-2 text-xs text-rose-800">{previewClaim.message}</p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
