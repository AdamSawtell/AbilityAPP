"use client";

import { useMemo, useState } from "react";
import { EmployeeRecordLink } from "@/components/record-link";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeAvailabilityRow, EmployeeRecord } from "@/lib/employee";
import { useData } from "@/lib/data-store";
import {
  buildRequestSuitability,
  rankShiftRequestCandidates,
  requestsForShift,
  shiftRequestResponseLabels,
  shiftRequestStatusLabels,
  type RosterShiftRequestRecord,
} from "@/lib/roster-shift-request";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { formatDayHeading, formatShiftTimeRange } from "@/lib/roster-shift";

export function ShiftRequestReviewPanel({
  shift,
  requests,
  employees,
  clients,
  rosterShifts,
  availabilityByEmployee,
  canManage,
  busyRequestId,
  onApprove,
  onReject,
  onToggleCriticalFill,
}: {
  shift: RosterShiftRecord;
  requests: RosterShiftRequestRecord[];
  employees: EmployeeRecord[];
  clients: ClientRecord[];
  rosterShifts: RosterShiftRecord[];
  availabilityByEmployee?: Record<string, EmployeeAvailabilityRow[]>;
  canManage: boolean;
  busyRequestId?: string | null;
  onApprove?: (requestId: string) => Promise<string | null>;
  onReject?: (requestId: string, reason: string) => Promise<string | null>;
  onToggleCriticalFill?: (criticalFill: boolean) => string | null;
}) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const { payPeriodInstances } = useData();

  const shiftRequests = useMemo(() => requestsForShift(requests, shift.id), [requests, shift.id]);
  const rankedPending = useMemo(
    () =>
      rankShiftRequestCandidates({
        shift,
        requests: shiftRequests,
        employees,
        clients,
        rosterShifts,
        payPeriodInstances,
      }),
    [shift, shiftRequests, employees, clients, rosterShifts, payPeriodInstances]
  );
  const history = useMemo(
    () =>
      shiftRequests.filter(
        (r) => r.status === "rejected" || r.status === "withdrawn" || r.status === "cancelled"
      ),
    [shiftRequests]
  );
  const client = clients.find((c) => c.id === shift.clientId);

  async function handleApprove(requestId: string) {
    if (!onApprove) return;
    setError("");
    setMessage("");
    const err = await onApprove(requestId);
    if (err) {
      setError(err);
      return;
    }
    setMessage("Request approved and worker assigned to the shift.");
  }

  async function handleReject(requestId: string) {
    if (!onReject) return;
    setError("");
    setMessage("");
    const err = await onReject(requestId, rejectReason);
    if (err) {
      setError(err);
      return;
    }
    setRejectingId(null);
    setRejectReason("");
    setMessage("Request rejected.");
  }

  return (
    <div className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Shift requests</p>
          <p className="text-sm text-slate-700">
            {formatDayHeading(shift.shiftDate)} · {formatShiftTimeRange(shift.startTime, shift.endTime)}
          </p>
          <p className="text-xs text-slate-600">
            {rankedPending.length} pending · {history.length} prior declined/rejected
          </p>
        </div>
        {canManage && onToggleCriticalFill ? (
          <button
            type="button"
            onClick={() => {
              const err = onToggleCriticalFill(!shift.criticalFill);
              if (err) setError(err);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              shift.criticalFill
                ? "border border-rose-300 bg-rose-100 text-rose-950 hover:bg-rose-200"
                : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
            }`}
          >
            {shift.criticalFill ? "Remove critical fill" : "Mark critical fill"}
          </button>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}

      {rankedPending.length ? (
        <ul className="space-y-3">
          {rankedPending.map((request) => {
            const employee = employees.find((e) => e.id === request.employeeId);
            const suitability = buildRequestSuitability({
              shift,
              request,
              employee,
              client,
              rosterShifts,
              allRequests: requests,
              availability: availabilityByEmployee?.[request.employeeId],
            });
            return (
              <li key={request.id} className="rounded-lg border border-white bg-white p-3 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <EmployeeRecordLink
                      id={request.employeeId}
                      searchKey={suitability.employeeName}
                      name={suitability.employeeName}
                      className="font-medium text-slate-900 hover:underline"
                    />
                    <p className="mt-1 text-xs text-slate-600">
                      {shiftRequestResponseLabels[request.responseType]} ·{" "}
                      {new Date(request.submittedAt).toLocaleString("en-AU")}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">{suitability.availabilityLabel}</p>
                    <p className="text-xs text-slate-600">{suitability.remainingHours.toFixed(1)}h free this week</p>
                    {suitability.priorRejections ? (
                      <p className="mt-1 text-xs text-amber-800">
                        {suitability.priorRejections} prior rejected request(s) on other shifts
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase text-slate-700">
                    {shiftRequestStatusLabels[request.status]}
                  </span>
                </div>
                {suitability.hints.length ? (
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {suitability.hints.slice(0, 4).map((hint) => (
                      <li key={hint.code} className={hint.severity === "warning" ? "text-amber-800" : undefined}>
                        {hint.message}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {canManage && request.status === "requested" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.responseType === "request" && onApprove ? (
                      <button
                        type="button"
                        disabled={busyRequestId === request.id}
                        onClick={() => void handleApprove(request.id)}
                        className="rounded-lg bg-[#d4147a] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
                      >
                        Approve & assign
                      </button>
                    ) : null}
                    {onReject ? (
                      <button
                        type="button"
                        onClick={() => {
                          setRejectingId(request.id);
                          setRejectReason("");
                        }}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                      >
                        Reject
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {rejectingId === request.id ? (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Rejection reason
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="Optional note for audit trail"
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleReject(request.id)}
                        className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-800"
                      >
                        Confirm reject
                      </button>
                      <button
                        type="button"
                        onClick={() => setRejectingId(null)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate-600">No pending requests for this shift.</p>
      )}

      {history.length ? (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prior responses</p>
          <ul className="mt-2 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            {history.map((request) => {
              const employee = employees.find((e) => e.id === request.employeeId);
              return (
                <li key={request.id} className="px-3 py-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-800">{employee?.name ?? request.employeeId}</span>
                  {" · "}
                  {shiftRequestResponseLabels[request.responseType]} · {shiftRequestStatusLabels[request.status]}
                  {request.rejectionReason ? ` — ${request.rejectionReason}` : ""}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
