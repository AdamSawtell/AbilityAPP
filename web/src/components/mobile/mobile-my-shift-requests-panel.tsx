"use client";

import { useMemo } from "react";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import {
  formatDayHeading,
  formatShiftTimeRange,
  type RosterShiftRecord,
} from "@/lib/roster-shift";
import {
  requestsForEmployee,
  shiftRequestStatusLabels,
  type RosterShiftRequestRecord,
} from "@/lib/roster-shift-request";

function statusClass(status: RosterShiftRequestRecord["status"]): string {
  if (status === "approved") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "rejected") return "bg-rose-50 text-rose-800 ring-rose-200";
  if (status === "requested") return "bg-sky-50 text-sky-800 ring-sky-200";
  return "bg-slate-100 text-slate-700 ring-slate-200";
}

function formatWhen(iso: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function MobileMyShiftRequestsPanel({
  employeeId,
  requests,
  shifts,
  locations,
  clients,
}: {
  employeeId: string;
  requests: RosterShiftRequestRecord[];
  shifts: RosterShiftRecord[];
  locations: LocationRecord[];
  clients: ClientRecord[];
}) {
  const entries = useMemo(() => {
    const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));
    return requestsForEmployee(requests, employeeId)
      .filter((request) => request.status !== "withdrawn")
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 20)
      .map((request) => {
        const shift = shiftById.get(request.rosterShiftId);
        const location = shift ? locations.find((row) => row.id === shift.locationId) : undefined;
        const client = shift ? clients.find((row) => row.id === shift.clientId) : undefined;
        const shiftLabel = shift
          ? `${formatDayHeading(shift.shiftDate)} ${formatShiftTimeRange(shift.startTime, shift.endTime)}`
          : "Shift no longer listed";
        const place = [client?.preferredName || client?.name, location?.name].filter(Boolean).join(" · ");
        return { request, shiftLabel, place };
      });
  }, [clients, employeeId, locations, requests, shifts]);

  if (!entries.length) return null;

  return (
    <section className="mb-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">My applications</h2>
        <p className="mt-0.5 text-xs text-slate-500">Track open shift requests. Details stay in the app — not on lock screen.</p>
      </div>
      <ul className="divide-y divide-slate-100">
        {entries.map(({ request, shiftLabel, place }) => (
          <li key={request.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-900">{shiftLabel}</p>
                {place ? <p className="mt-0.5 text-xs text-slate-600">{place}</p> : null}
                <p className="mt-1 text-xs text-slate-500">Submitted {formatWhen(request.submittedAt)}</p>
                {request.status === "rejected" && request.rejectionReason ? (
                  <p className="mt-2 text-xs text-slate-700">{request.rejectionReason}</p>
                ) : null}
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusClass(request.status)}`}
              >
                {shiftRequestStatusLabels[request.status]}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
