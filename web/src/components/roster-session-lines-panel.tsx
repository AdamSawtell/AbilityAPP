"use client";

import {
  emptyRosterShiftClientLine,
  emptyRosterShiftWorkerLine,
  normalizeRosterShiftClientLine,
  normalizeRosterShiftWorkerLine,
  sessionParticipantSummary,
  syncShiftHeaderFromSessionLines,
  SUPPORT_RATIO_OPTIONS,
  type RosterShiftClientLine,
  type RosterShiftWorkerLine,
} from "@/lib/roster-session";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import type { ServiceBookingRecord } from "@/lib/service-booking";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const WORKER_STATUS_OPTIONS = [
  { value: "required", label: "Required" },
  { value: "assigned", label: "Assigned" },
  { value: "absent", label: "Absent" },
  { value: "replacement_needed", label: "Replacement needed" },
] as const;

export function RosterSessionLinesPanel({
  draft,
  onChange,
  clients,
  employees,
  serviceBookings,
  disabled,
}: {
  draft: RosterShiftRecord;
  onChange: (next: RosterShiftRecord) => void;
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  serviceBookings: ServiceBookingRecord[];
  disabled?: boolean;
}) {
  const clientLines = draft.clientLines ?? [];
  const workerLines = draft.workerLines ?? [];
  const summary = sessionParticipantSummary(
    clientLines.filter((line) => line.clientId).length,
    workerLines.filter((line) => line.employeeId || line.status === "required").length
  );

  function updateSession(next: Partial<RosterShiftRecord>) {
    onChange(syncShiftHeaderFromSessionLines({ ...draft, ...next }) as RosterShiftRecord);
  }

  function updateClientLine(index: number, patch: Partial<RosterShiftClientLine>) {
    const lines = clientLines.map((line, i) =>
      i === index ? normalizeRosterShiftClientLine({ ...line, ...patch }) : line
    );
    updateSession({ clientLines: lines });
  }

  function addClientLine() {
    updateSession({
      clientLines: [...clientLines, emptyRosterShiftClientLine(clientLines.length + 1)],
    });
  }

  function removeClientLine(index: number) {
    if (clientLines.length <= 1) return;
    const lines = clientLines.filter((_, i) => i !== index).map((line, i) => ({ ...line, lineNo: i + 1 }));
    updateSession({ clientLines: lines });
  }

  function updateWorkerLine(index: number, patch: Partial<RosterShiftWorkerLine>) {
    const lines = workerLines.map((line, i) =>
      i === index ? normalizeRosterShiftWorkerLine({ ...line, ...patch }) : line
    );
    updateSession({ workerLines: lines });
  }

  function addWorkerLine() {
    updateSession({
      workerLines: [...workerLines, emptyRosterShiftWorkerLine(workerLines.length + 1)],
      requiredWorkerCount: Math.max(draft.requiredWorkerCount ?? 1, workerLines.length + 1),
    });
  }

  function removeWorkerLine(index: number) {
    if (workerLines.length <= 1) return;
    const lines = workerLines.filter((_, i) => i !== index).map((line, i) => ({ ...line, lineNo: i + 1 }));
    updateSession({ workerLines: lines });
  }

  return (
    <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session participants</p>
          <p className="mt-0.5 text-sm text-slate-700">{summary}</p>
        </div>
        <label className="text-xs text-slate-600">
          Session key
          <input
            className={`${inputClass} mt-1 w-40`}
            value={draft.sessionKey ?? ""}
            onChange={(e) => updateSession({ sessionKey: e.target.value })}
            placeholder="e.g. GLEN-MON-AM"
            disabled={disabled}
          />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-800">Clients (billing)</h3>
          <button
            type="button"
            onClick={addClientLine}
            disabled={disabled}
            className="text-xs font-medium text-[#b51266] hover:underline disabled:opacity-50"
          >
            Add client
          </button>
        </div>
        <div className="space-y-2">
          {clientLines.map((line, index) => {
            const bookingOptions = serviceBookings.filter((b) => !line.clientId || b.clientId === line.clientId);
            return (
              <div key={line.id} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-12">
                <label className="sm:col-span-4">
                  <span className="mb-1 block text-xs text-slate-500">Client</span>
                  <select
                    className={inputClass}
                    value={line.clientId}
                    onChange={(e) => updateClientLine(index, { clientId: e.target.value, serviceBookingId: "" })}
                    disabled={disabled}
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.searchKey} — {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-2">
                  <span className="mb-1 block text-xs text-slate-500">Ratio</span>
                  <select
                    className={inputClass}
                    value={line.supportRatio}
                    onChange={(e) => updateClientLine(index, { supportRatio: e.target.value })}
                    disabled={disabled}
                  >
                    {SUPPORT_RATIO_OPTIONS.map((ratio) => (
                      <option key={ratio} value={ratio}>
                        {ratio}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="sm:col-span-4">
                  <span className="mb-1 block text-xs text-slate-500">Service booking</span>
                  <select
                    className={inputClass}
                    value={line.serviceBookingId}
                    onChange={(e) => updateClientLine(index, { serviceBookingId: e.target.value })}
                    disabled={disabled}
                  >
                    <option value="">None</option>
                    {bookingOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.documentNo} — {b.description || "Booking"}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end justify-end sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeClientLine(index)}
                    disabled={disabled || clientLines.length <= 1}
                    className="text-xs text-slate-500 hover:text-rose-700 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-800">Workers (payroll)</h3>
          <button
            type="button"
            onClick={addWorkerLine}
            disabled={disabled}
            className="text-xs font-medium text-[#b51266] hover:underline disabled:opacity-50"
          >
            Add worker
          </button>
        </div>
        <div className="space-y-2">
          {workerLines.map((line, index) => (
            <div key={line.id} className="grid gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:grid-cols-12">
              <label className="sm:col-span-4">
                <span className="mb-1 block text-xs text-slate-500">Worker</span>
                <select
                  className={inputClass}
                  value={line.employeeId}
                  onChange={(e) =>
                    updateWorkerLine(index, {
                      employeeId: e.target.value,
                      status: e.target.value ? "assigned" : line.status === "assigned" ? "required" : line.status,
                    })
                  }
                  disabled={disabled}
                >
                  <option value="">Vacant / TBD</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.searchKey} — {e.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sm:col-span-3">
                <span className="mb-1 block text-xs text-slate-500">Role required</span>
                <input
                  className={inputClass}
                  value={line.roleRequired}
                  onChange={(e) => updateWorkerLine(index, { roleRequired: e.target.value })}
                  placeholder="Support worker"
                  disabled={disabled}
                />
              </label>
              <label className="sm:col-span-3">
                <span className="mb-1 block text-xs text-slate-500">Status</span>
                <select
                  className={inputClass}
                  value={line.status}
                  onChange={(e) =>
                    updateWorkerLine(index, {
                      status: e.target.value as RosterShiftWorkerLine["status"],
                    })
                  }
                  disabled={disabled}
                >
                  {WORKER_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex items-end justify-end sm:col-span-2">
                <button
                  type="button"
                  onClick={() => removeWorkerLine(index)}
                  disabled={disabled || workerLines.length <= 1}
                  className="text-xs text-slate-500 hover:text-rose-700 disabled:opacity-40"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
        <label className="mt-2 block text-xs text-slate-600">
          Required workers
          <input
            type="number"
            min={1}
            max={20}
            className={`${inputClass} mt-1 w-24`}
            value={draft.requiredWorkerCount ?? 1}
            onChange={(e) =>
              updateSession({ requiredWorkerCount: Math.max(1, Number(e.target.value) || 1) })
            }
            disabled={disabled}
          />
        </label>
      </div>
    </div>
  );
}
