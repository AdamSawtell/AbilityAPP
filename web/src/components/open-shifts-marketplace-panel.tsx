"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { ShiftRequestReviewPanel } from "@/components/shift-request-review-panel";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeAvailabilityRow, EmployeeRecord } from "@/lib/employee";
import {
  isRosterShiftInLocationScope,
  type LocationScope,
} from "@/lib/location-list-access";
import type { LocationRecord } from "@/lib/location";
import {
  classifyShiftAvailability,
  listOpenMarketplaceShifts,
  sortOpenShiftsByAvailability,
  type ShiftAvailabilityStatus,
} from "@/lib/roster-open-shifts";
import {
  activeRequestForEmployee,
  requestsForShift,
  shiftRequestResponseLabels,
  shiftRequestStatusLabels,
  type RosterShiftRequestRecord,
  type ShiftRequestResponseType,
} from "@/lib/roster-shift-request";
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

function sortWithCriticalFirst(shifts: RosterShiftRecord[]): RosterShiftRecord[] {
  return [...shifts].sort((a, b) => {
    if (a.criticalFill !== b.criticalFill) return a.criticalFill ? -1 : 1;
    const dateCmp = a.shiftDate.localeCompare(b.shiftDate);
    if (dateCmp !== 0) return dateCmp;
    return a.startTime.localeCompare(b.startTime);
  });
}

export function OpenShiftsMarketplacePanel({
  rosterShifts,
  allRosterShifts,
  rosterShiftRequests = [],
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
  onSubmitRequest,
  onWithdrawRequest,
  onApproveRequest,
  onRejectRequest,
  onToggleCriticalFill,
}: {
  rosterShifts: RosterShiftRecord[];
  allRosterShifts?: RosterShiftRecord[];
  rosterShiftRequests?: RosterShiftRequestRecord[];
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
  availabilityReady?: boolean;
  onAssign?: (shift: RosterShiftRecord) => void;
  onSubmitRequest?: (
    shift: RosterShiftRecord,
    responseType: ShiftRequestResponseType
  ) => Promise<string | null>;
  onWithdrawRequest?: (requestId: string) => Promise<string | null>;
  onApproveRequest?: (requestId: string) => Promise<string | null>;
  onRejectRequest?: (requestId: string, reason: string) => Promise<string | null>;
  onToggleCriticalFill?: (shift: RosterShiftRecord, criticalFill: boolean) => string | null;
}) {
  const [busyShiftId, setBusyShiftId] = useState<string | null>(null);
  const [confirmingType, setConfirmingType] = useState<{ shiftId: string; type: ShiftRequestResponseType } | null>(
    null
  );
  const [expandedReviewShiftId, setExpandedReviewShiftId] = useState<string | null>(null);
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
      mode === "worker"
        ? sortWithCriticalFirst(sortOpenShiftsByAvailability(inScope, availability))
        : sortWithCriticalFirst(inScope);

    if (!locationBrowseEnabled || !allRosterShifts || !locationScope) {
      return { inScopeOpen: sortedInScope, outOfScopeOpen: [] as RosterShiftRecord[] };
    }

    const allOpen = listOpenMarketplaceShifts(allRosterShifts);
    const outOfScope = allOpen.filter((shift) => !isRosterShiftInLocationScope(shift, locationScope));
    const sortedOutOfScope =
      mode === "worker"
        ? sortWithCriticalFirst(sortOpenShiftsByAvailability(outOfScope, availability))
        : sortWithCriticalFirst(outOfScope);

    return { inScopeOpen: sortedInScope, outOfScopeOpen: sortedOutOfScope };
  }, [rosterShifts, allRosterShifts, locationScope, locationBrowseEnabled, mode, availability]);

  const hasOtherLocationShifts = outOfScopeOpen.length > 0;
  const displayOutOfScope = showAllLocations && hasOtherLocationShifts;

  async function handleSubmit(shift: RosterShiftRecord, responseType: ShiftRequestResponseType, requestable: boolean) {
    if (!onSubmitRequest || !requestable) return;
    const availabilityResult = classifyShiftAvailability(shift, availability);
    const needsConfirm = responseType === "request" && availabilityResult.needsConfirm;
    if (needsConfirm && (confirmingType?.shiftId !== shift.id || confirmingType.type !== responseType)) {
      setConfirmingType({ shiftId: shift.id, type: responseType });
      setError("");
      setMessage("");
      return;
    }
    setConfirmingType(null);
    setBusyShiftId(shift.id);
    setError("");
    setMessage("");
    const err = await onSubmitRequest(shift, responseType);
    setBusyShiftId(null);
    if (err) {
      setError(err);
      return;
    }
    const labels: Record<ShiftRequestResponseType, string> = {
      request: "Request submitted",
      available_if_critical: "Marked available if critical",
      decline: "Shift declined",
    };
    setMessage(`${labels[responseType]} — rostering will review your response.`);
  }

  async function handleWithdraw(requestId: string) {
    if (!onWithdrawRequest) return;
    setBusyShiftId(requestId);
    setError("");
    const err = await onWithdrawRequest(requestId);
    setBusyShiftId(null);
    if (err) {
      setError(err);
      return;
    }
    setMessage("Request withdrawn.");
  }

  function renderShiftCard(shift: RosterShiftRecord, requestable: boolean) {
    const client = resolveClient(shift.clientId, clients, clientCatalog);
    const location = resolveLocation(shift.locationId, locations, locationCatalog);
    const booking = serviceBookings.find((b) => b.id === shift.serviceBookingId);
    const shiftRequests = requestsForShift(rosterShiftRequests, shift.id);
    const pendingCount = shiftRequests.filter((r) => r.status === "requested").length;
    const myRequest = currentEmployeeId
      ? activeRequestForEmployee(rosterShiftRequests, shift.id, currentEmployeeId, "request")
      : undefined;
    const myCritical = currentEmployeeId
      ? activeRequestForEmployee(rosterShiftRequests, shift.id, currentEmployeeId, "available_if_critical")
      : undefined;
    const myDecline = currentEmployeeId
      ? shiftRequests.find(
          (r) =>
            r.employeeId === currentEmployeeId &&
            r.responseType === "decline" &&
            (r.status === "cancelled" || r.status === "requested")
        )
      : undefined;
    const availabilityResult =
      mode === "worker" ? classifyShiftAvailability(shift, availability) : null;
    const availabilityBadge = availabilityResult ? AVAILABILITY_BADGE[availabilityResult.status] : null;
    const isConfirming = confirmingType?.shiftId === shift.id;
    const cardBorder = shift.criticalFill
      ? "border-rose-300 bg-rose-50/50"
      : requestable
        ? "border-amber-200 bg-amber-50/40"
        : "border-slate-200 bg-slate-50/80";

    return (
      <article key={shift.id} className={`flex flex-col rounded-xl border p-4 shadow-sm ${cardBorder}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p
              className={`text-xs font-semibold uppercase tracking-wide ${
                shift.criticalFill ? "text-rose-900" : requestable ? "text-amber-900" : "text-slate-600"
              }`}
            >
              {shift.criticalFill ? "Critical fill" : requestable ? "Open shift" : "Open shift — other location"}
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatDayHeading(shift.shiftDate)}</p>
            <p className="text-sm text-slate-700">{formatShiftTimeRange(shift.startTime, shift.endTime)}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium uppercase text-slate-600 ring-1 ring-slate-200">
              {shift.openFillStatus || "Open"}
            </span>
            {mode === "coordinator" && pendingCount ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-950">
                {pendingCount} request{pendingCount === 1 ? "" : "s"}
              </span>
            ) : null}
          </div>
        </div>

        {availabilityBadge && requestable ? (
          <span
            className={`mt-3 inline-flex w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${availabilityBadge.className}`}
          >
            {availabilityBadge.label}
          </span>
        ) : null}

        <div className="mt-3 space-y-1 text-sm text-slate-700">
          {client ? (
            requestable ? (
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
          {booking && requestable ? (
            <Link href={`/service-bookings/${booking.id}`} className="text-[#b51266] hover:underline">
              Booking {booking.documentNo}
            </Link>
          ) : booking ? (
            <p className="text-slate-600">Booking {booking.documentNo}</p>
          ) : null}
          {shift.notes ? <p className="text-slate-600">{shift.notes}</p> : null}
        </div>

        {mode === "worker" && myRequest ? (
          <p className="mt-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950">
            {shiftRequestStatusLabels[myRequest.status]}
            {myRequest.status === "rejected" && myRequest.rejectionReason
              ? ` — ${myRequest.rejectionReason}`
              : ""}
          </p>
        ) : null}
        {mode === "worker" && myCritical ? (
          <p className="mt-2 text-xs text-rose-800">{shiftRequestResponseLabels.available_if_critical}</p>
        ) : null}
        {mode === "worker" && myDecline ? (
          <p className="mt-2 text-xs text-slate-600">You declined this shift</p>
        ) : null}

        {!requestable ? (
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
            {mode === "coordinator" ? (
              <button
                type="button"
                onClick={() =>
                  setExpandedReviewShiftId((current) => (current === shift.id ? null : shift.id))
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
              >
                {expandedReviewShiftId === shift.id ? "Hide requests" : "Review requests"}
              </button>
            ) : null}
            {mode === "worker" && onSubmitRequest && currentEmployeeId && !myRequest && !myDecline ? (
              <>
                <button
                  type="button"
                  disabled={!availabilityReady || busyShiftId === shift.id}
                  onClick={() => void handleSubmit(shift, "request", requestable)}
                  className="rounded-lg bg-[#d4147a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
                >
                  {!availabilityReady
                    ? "Checking availability…"
                    : busyShiftId === shift.id
                      ? "Submitting…"
                      : isConfirming && confirmingType?.type === "request"
                        ? "Request anyway?"
                        : "Request shift"}
                </button>
                {shift.criticalFill && !myCritical ? (
                  <button
                    type="button"
                    disabled={busyShiftId === shift.id}
                    onClick={() => void handleSubmit(shift, "available_if_critical", requestable)}
                    className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-medium text-rose-900 hover:bg-rose-50 disabled:opacity-50"
                  >
                    Available if critical
                  </button>
                ) : null}
                {!myDecline ? (
                  <button
                    type="button"
                    disabled={busyShiftId === shift.id}
                    onClick={() => void handleSubmit(shift, "decline", requestable)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Decline
                  </button>
                ) : null}
              </>
            ) : null}
            {mode === "worker" && myRequest?.status === "requested" && onWithdrawRequest ? (
              <button
                type="button"
                disabled={busyShiftId === myRequest.id}
                onClick={() => void handleWithdraw(myRequest.id)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Withdraw request
              </button>
            ) : null}
            {isConfirming ? (
              <button
                type="button"
                onClick={() => setConfirmingType(null)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            ) : null}
          </div>
        )}
        {requestable && availabilityResult?.needsConfirm && isConfirming ? (
          <p className="mt-2 text-xs text-amber-800">
            {availabilityResult.message} Tap “Request anyway?” to confirm.
          </p>
        ) : null}

        {mode === "coordinator" && expandedReviewShiftId === shift.id ? (
          <ShiftRequestReviewPanel
            shift={shift}
            requests={rosterShiftRequests}
            employees={employees}
            clients={clients}
            rosterShifts={allRosterShifts ?? rosterShifts}
            canManage
            busyRequestId={busyShiftId}
            onApprove={onApproveRequest}
            onReject={onRejectRequest}
            onToggleCriticalFill={
              onToggleCriticalFill
                ? (criticalFill) => onToggleCriticalFill(shift, criticalFill)
                : undefined
            }
          />
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
              ? "Request shifts at your locations below. Other locations are read-only — call rostering to apply."
              : "Showing open shifts at your assigned locations. Submit a request and rostering will review it."}
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
              Track status under{" "}
              <Link href="/my/shifts" className="font-semibold underline hover:no-underline">
                My shifts → Shift requests
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
