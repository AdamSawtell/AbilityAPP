"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeAvailabilityRow, EmployeeRecord } from "@/lib/employee";
import type { LocationRecord } from "@/lib/location";
import {
  buildClaimedShift,
  classifyShiftAvailability,
  listOpenMarketplaceShifts,
  sortOpenShiftsByAvailability,
  type ShiftAvailabilityStatus,
} from "@/lib/roster-open-shifts";
import { formatDayHeading, formatShiftTimeRange, normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceBookingRecord } from "@/lib/service-booking";

const AVAILABILITY_BADGE: Record<ShiftAvailabilityStatus, { label: string; className: string } | null> = {
  preferred: { label: "Matches preferred hours", className: "bg-emerald-100 text-emerald-900" },
  available: { label: "Within your availability", className: "bg-emerald-100 text-emerald-900" },
  outside: { label: "Outside your availability", className: "bg-amber-100 text-amber-900" },
  unavailable: { label: "You marked this day unavailable", className: "bg-rose-100 text-rose-900" },
  unknown: null,
};

export function OpenShiftsMarketplacePanel({
  rosterShifts,
  clients,
  employees,
  locations,
  serviceBookings,
  mode,
  currentEmployeeId,
  availability,
  availabilityReady = true,
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
  availability?: EmployeeAvailabilityRow[];
  /** False while the worker's availability is still loading — claims are held so
   *  an outside-availability shift cannot be claimed before the confirm gate is
   *  known (KAREN-BUG-0004). */
  availabilityReady?: boolean;
  onAssign?: (shift: RosterShiftRecord) => void;
  onClaim?: (shift: RosterShiftRecord) => Promise<string | null>;
}) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openShifts = useMemo(() => {
    const open = listOpenMarketplaceShifts(rosterShifts);
    return mode === "worker" ? sortOpenShiftsByAvailability(open, availability) : open;
  }, [rosterShifts, mode, availability]);

  async function handleClaim(shift: RosterShiftRecord, needsConfirm: boolean) {
    if (!onClaim) return;
    // Require an explicit second tap before claiming a shift outside saved
    // availability (KAREN-BUG-0004).
    if (needsConfirm && confirmingId !== shift.id) {
      setConfirmingId(shift.id);
      setError("");
      setMessage("");
      return;
    }
    setConfirmingId(null);
    setClaimingId(shift.id);
    setError("");
    setMessage("");
    const err = await onClaim(shift);
    setClaimingId(null);
    if (err) {
      setError(err);
      return;
    }
    const client = clients.find((c) => c.id === shift.clientId);
    const location = locations.find((l) => l.id === shift.locationId);
    const parts = [
      formatDayHeading(shift.shiftDate),
      formatShiftTimeRange(shift.startTime, shift.endTime),
    ];
    if (client) parts.push(client.name);
    if (location) parts.push(location.name);
    setMessage(`Shift claimed — ${parts.join(" · ")}.`);
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
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          <p>{message}</p>
          {mode === "worker" ? (
            <p className="mt-1">
              It now appears under{" "}
              <Link href="/my/shifts" className="font-semibold underline hover:no-underline">
                My shifts → All
              </Link>
              .
            </p>
          ) : null}
        </div>
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
          const availabilityResult =
            mode === "worker" ? classifyShiftAvailability(shift, availability) : null;
          const availabilityBadge = availabilityResult
            ? AVAILABILITY_BADGE[availabilityResult.status]
            : null;
          const needsConfirm = Boolean(availabilityResult?.needsConfirm);
          const isConfirming = confirmingId === shift.id;

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

              {availabilityBadge ? (
                <span
                  className={`mt-3 inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${availabilityBadge.className}`}
                >
                  {availabilityBadge.label}
                </span>
              ) : null}

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
                    disabled={
                      !currentEmployeeId ||
                      claimingId === shift.id ||
                      Boolean(claimBlocked) ||
                      !availabilityReady
                    }
                    title={
                      claimBlocked
                        ? previewClaim?.message
                        : !availabilityReady
                          ? "Checking your availability…"
                          : undefined
                    }
                    onClick={() => void handleClaim(shift, needsConfirm)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                      isConfirming ? "bg-amber-600 hover:bg-amber-700" : "bg-[#d4147a] hover:bg-[#b51266]"
                    }`}
                  >
                    {!availabilityReady
                      ? "Checking availability…"
                      : claimingId === shift.id
                        ? "Claiming…"
                        : isConfirming
                          ? "Claim anyway?"
                          : "Claim shift"}
                  </button>
                ) : null}
                {mode === "worker" && isConfirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(null)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                ) : null}
              </div>
              {claimBlocked && previewClaim && !previewClaim.ok ? (
                <p className="mt-2 text-xs text-rose-800">{previewClaim.message}</p>
              ) : availabilityResult && availabilityResult.needsConfirm ? (
                <p className="mt-2 text-xs text-amber-800">
                  {availabilityResult.message}
                  {isConfirming ? " Tap “Claim anyway?” to confirm." : ""}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
