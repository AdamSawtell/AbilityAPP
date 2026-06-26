"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeAvailabilityRow, EmployeeRecord } from "@/lib/employee";
import {
  isRosterShiftInLocationScope,
  type LocationScope,
} from "@/lib/location-list-access";
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

const ROSTERING_INTEREST_NOTE =
  "This shift is outside your assigned locations. Call rostering to apply if you are interested.";

function resolveClient(
  id: string | undefined,
  scoped: ClientRecord[],
  catalog: ClientRecord[] | undefined
): ClientRecord | undefined {
  if (!id) return undefined;
  return scoped.find((c) => c.id === id) ?? catalog?.find((c) => c.id === id);
}

function resolveLocation(
  id: string | undefined,
  scoped: LocationRecord[],
  catalog: LocationRecord[] | undefined
): LocationRecord | undefined {
  if (!id) return undefined;
  return scoped.find((l) => l.id === id) ?? catalog?.find((l) => l.id === id);
}

export function OpenShiftsMarketplacePanel({
  rosterShifts,
  allRosterShifts,
  locationScope,
  clientCatalog,
  locationCatalog,
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
  /** Full register for worker browse-all; omit on coordinator views. */
  allRosterShifts?: RosterShiftRecord[];
  locationScope?: LocationScope;
  clientCatalog?: ClientRecord[];
  locationCatalog?: LocationRecord[];
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
  const [showAllLocations, setShowAllLocations] = useState(false);

  const locationBrowseEnabled =
    mode === "worker" &&
    Boolean(locationScope?.enabled) &&
    !locationScope?.seeAll &&
    Boolean(allRosterShifts?.length);

  const { inScopeOpen, outOfScopeOpen } = useMemo(() => {
    const inScope = listOpenMarketplaceShifts(rosterShifts);
    const sortedInScope =
      mode === "worker" ? sortOpenShiftsByAvailability(inScope, availability) : inScope;

    if (!locationBrowseEnabled || !allRosterShifts || !locationScope) {
      return { inScopeOpen: sortedInScope, outOfScopeOpen: [] as RosterShiftRecord[] };
    }

    const allOpen = listOpenMarketplaceShifts(allRosterShifts);
    const outOfScope = allOpen.filter((shift) => !isRosterShiftInLocationScope(shift, locationScope));
    const sortedOutOfScope =
      mode === "worker" ? sortOpenShiftsByAvailability(outOfScope, availability) : outOfScope;

    return { inScopeOpen: sortedInScope, outOfScopeOpen: sortedOutOfScope };
  }, [rosterShifts, allRosterShifts, locationScope, locationBrowseEnabled, mode, availability]);

  const hasOtherLocationShifts = outOfScopeOpen.length > 0;
  const displayOutOfScope = showAllLocations && hasOtherLocationShifts;

  async function handleClaim(shift: RosterShiftRecord, needsConfirm: boolean, claimable: boolean) {
    if (!onClaim || !claimable) return;
    if (locationScope && !isRosterShiftInLocationScope(shift, locationScope)) {
      setError(ROSTERING_INTEREST_NOTE);
      return;
    }
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
    const client = resolveClient(shift.clientId, clients, clientCatalog);
    const location = resolveLocation(shift.locationId, locations, locationCatalog);
    const parts = [
      formatDayHeading(shift.shiftDate),
      formatShiftTimeRange(shift.startTime, shift.endTime),
    ];
    if (client) parts.push(client.name);
    if (location) parts.push(location.name);
    setMessage(`Shift claimed — ${parts.join(" · ")}.`);
  }

  function renderShiftCard(shift: RosterShiftRecord, claimable: boolean) {
    const client = resolveClient(shift.clientId, clients, clientCatalog);
    const location = resolveLocation(shift.locationId, locations, locationCatalog);
    const booking = serviceBookings.find((b) => b.id === shift.serviceBookingId);
    const previewClaim =
      mode === "worker" && currentEmployeeId && claimable
        ? buildClaimedShift(shift, currentEmployeeId, "Self-service", allRosterShifts ?? rosterShifts)
        : null;
    const claimBlocked = previewClaim && !previewClaim.ok;
    const availabilityResult =
      mode === "worker" ? classifyShiftAvailability(shift, availability) : null;
    const availabilityBadge = availabilityResult ? AVAILABILITY_BADGE[availabilityResult.status] : null;
    const needsConfirm = Boolean(availabilityResult?.needsConfirm);
    const isConfirming = confirmingId === shift.id;

    return (
      <article
        key={shift.id}
        className={`flex flex-col rounded-xl border p-4 shadow-sm ${
          claimable
            ? "border-amber-200 bg-amber-50/40"
            : "border-slate-200 bg-slate-50/80"
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                claimable ? "text-amber-900" : "text-slate-600"
              }`}
            >
              {claimable ? "Open shift" : "Open shift — other location"}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatDayHeading(shift.shiftDate)}</p>
            <p className="text-sm text-slate-700">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600 ring-1 ring-slate-200">
            {shift.status}
          </span>
        </div>

        {availabilityBadge && claimable ? (
          <span
            className={`mt-3 inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${availabilityBadge.className}`}
          >
            {availabilityBadge.label}
          </span>
        ) : null}

        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {client ? (
            claimable ? (
              <ClientRecordLink
                id={client.id}
                searchKey={client.searchKey}
                name={client.name}
                className="font-medium hover:underline"
              />
            ) : (
              <p className="font-medium">{client.name}</p>
            )
          ) : (
            <p>No client linked</p>
          )}
          {location ? <p>{location.name}</p> : null}
          {booking && claimable ? (
            <Link href={`/service-bookings/${booking.id}`} className="text-[#b51266] hover:underline">
              Booking {booking.documentNo}
            </Link>
          ) : booking ? (
            <p className="text-slate-600">Booking {booking.documentNo}</p>
          ) : null}
          {shift.notes ? <p className="text-slate-600">{shift.notes}</p> : null}
        </div>

        {!claimable ? (
          <p className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
            {ROSTERING_INTEREST_NOTE}
          </p>
        ) : (
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
                onClick={() => void handleClaim(shift, needsConfirm, claimable)}
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
        )}
        {claimable && claimBlocked && previewClaim && !previewClaim.ok ? (
          <p className="mt-2 text-xs text-rose-800">{previewClaim.message}</p>
        ) : claimable && availabilityResult && availabilityResult.needsConfirm ? (
          <p className="mt-2 text-xs text-amber-800">
            {availabilityResult.message}
            {isConfirming ? " Tap “Claim anyway?” to confirm." : ""}
          </p>
        ) : null}
      </article>
    );
  }

  if (!inScopeOpen.length && !displayOutOfScope) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-600 shadow-sm">
          {locationBrowseEnabled && hasOtherLocationShifts ? (
            <>
              <p>No open shifts at your assigned locations right now.</p>
              <button
                type="button"
                onClick={() => setShowAllLocations(true)}
                className="mt-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                Show all available shifts
              </button>
            </>
          ) : (
            <p>No open shifts right now. Coordinators post vacant Draft shifts to the marketplace when cover is needed.</p>
          )}
        </div>
        {showAllLocations && hasOtherLocationShifts ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {outOfScopeOpen.map((shift) => renderShiftCard(shift, false))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {locationBrowseEnabled ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-600">
            {showAllLocations
              ? "Shifts at your locations can be claimed here. Other locations are read-only — call rostering to apply."
              : "Showing open shifts at your assigned locations. You can claim these directly."}
          </p>
          {hasOtherLocationShifts ? (
            <button
              type="button"
              onClick={() => setShowAllLocations((open) => !open)}
              className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              {showAllLocations ? "Hide other locations" : "Show all available shifts"}
            </button>
          ) : null}
        </div>
      ) : null}

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

      {inScopeOpen.length ? (
        <div className="space-y-3">
          {displayOutOfScope ? (
            <h3 className="text-sm font-semibold text-slate-900">Your assigned locations</h3>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {inScopeOpen.map((shift) => renderShiftCard(shift, true))}
          </div>
        </div>
      ) : null}

      {displayOutOfScope ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Other locations</h3>
            <p className="text-sm text-slate-600">Read-only — call rostering to apply if you are interested.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {outOfScopeOpen.map((shift) => renderShiftCard(shift, false))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
