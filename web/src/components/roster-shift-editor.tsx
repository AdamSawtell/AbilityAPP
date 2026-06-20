"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  expandWeeklyRecurrence,
  RECURRENCE_WEEKDAY_OPTIONS,
  weekdayOffsetFromDate,
} from "@/lib/roster-shift-recurrence";
import { detectRecurringRosterConflicts } from "@/lib/roster-shift-conflicts";
import {
  rosterShiftSaveBlocked,
  validateRosterShift,
} from "@/lib/roster-shift-compliance";
import {
  createRosterShift,
  normalizeRosterShift,
  rosterShiftDropdowns,
  type RosterShiftRecord,
} from "@/lib/roster-shift";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function RosterShiftEditor({
  initial,
  defaultDate,
  prefill,
  onClose,
  onSaved,
}: {
  initial?: RosterShiftRecord | null;
  defaultDate?: string;
  prefill?: { clientId?: string; serviceBookingId?: string };
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { clients, employees, locations, serviceBookings, rosterShifts, upsertRosterShift, addRecurringRosterShifts } =
    useData();
  const { canWriteWindow } = useAuth();
  const canSave = canWriteWindow("rostering");
  const isNew = !initial?.id;

  const [draft, setDraft] = useState<RosterShiftRecord>(() =>
    normalizeRosterShift(
      initial ??
        createRosterShift(
          {
            clientId: prefill?.clientId ?? clients[0]?.id ?? "",
            employeeId: prefill?.clientId ? "" : employees[0]?.id ?? "",
            locationId: locations[0]?.id ?? "",
            serviceBookingId: prefill?.serviceBookingId ?? "",
            shiftDate: defaultDate ?? new Date().toISOString().slice(0, 10),
            status: prefill?.clientId ? "Draft" : "Published",
          },
          rosterShifts
        )
    )
  );

  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [weekCount, setWeekCount] = useState(4);
  const [weekdayOffsets, setWeekdayOffsets] = useState<number[]>(() => [
    weekdayOffsetFromDate(draft.shiftDate),
  ]);

  const issues = useMemo(() => {
    if (isNew && repeatWeekly && weekdayOffsets.length) {
      const rows = expandWeeklyRecurrence(draft, weekdayOffsets, weekCount);
      const conflictMap = detectRecurringRosterConflicts(rows, rosterShifts);
      const firstConflict = rows.flatMap((row) => conflictMap.get(row.id) ?? []);
      const fieldIssues = validateRosterShift(draft);
      return [...fieldIssues, ...firstConflict];
    }
    return validateRosterShift(draft, { existing: rosterShifts });
  }, [draft, isNew, repeatWeekly, weekdayOffsets, weekCount, rosterShifts]);
  const saveBlocked = rosterShiftSaveBlocked(issues);

  const bookingOptions = useMemo(
    () =>
      serviceBookings.filter((b) => !draft.clientId || b.clientId === draft.clientId),
    [serviceBookings, draft.clientId]
  );

  function onChange<K extends keyof RosterShiftRecord>(key: K, value: RosterShiftRecord[K]) {
    setDraft((prev) => normalizeRosterShift({ ...prev, [key]: value, updatedBy: "SuperUser" }));
  }

  function toggleWeekday(offset: number) {
    setWeekdayOffsets((prev) =>
      prev.includes(offset) ? prev.filter((d) => d !== offset) : [...prev, offset].sort((a, b) => a - b)
    );
  }

  function save() {
    if (!canSave || saveBlocked) return;
    if (isNew && repeatWeekly && weekdayOffsets.length) {
      const rows = expandWeeklyRecurrence(draft, weekdayOffsets, weekCount);
      const conflictMap = detectRecurringRosterConflicts(rows, rosterShifts);
      const blocked = rows.some((row) =>
        (conflictMap.get(row.id) ?? []).some((i) => i.severity === "error")
      );
      if (blocked) return;
      addRecurringRosterShifts(rows);
    } else {
      const record = isNew ? createRosterShift(draft, rosterShifts) : draft;
      const saveIssues = validateRosterShift(record, { existing: rosterShifts });
      if (rosterShiftSaveBlocked(saveIssues)) return;
      upsertRosterShift(record);
    }
    onSaved?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{isNew ? "New shift" : "Edit shift"}</h2>
            <p className="mt-1 text-sm text-slate-600">Link client, worker, location, and optional service booking.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            Close
          </button>
        </div>

        <fieldset disabled={!canSave} className="grid gap-4 sm:grid-cols-2 disabled:opacity-100">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Client</span>
            <select className={inputClass} value={draft.clientId} onChange={(e) => onChange("clientId", e.target.value)}>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.searchKey} — {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Worker</span>
            <select
              className={inputClass}
              value={draft.employeeId}
              onChange={(e) => onChange("employeeId", e.target.value)}
            >
              <option value="">Select worker</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.searchKey} — {e.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Location</span>
            <select
              className={inputClass}
              value={draft.locationId}
              onChange={(e) => onChange("locationId", e.target.value)}
            >
              <option value="">Select location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.searchKey} — {l.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Service booking</span>
            <select
              className={inputClass}
              value={draft.serviceBookingId}
              onChange={(e) => onChange("serviceBookingId", e.target.value)}
            >
              <option value="">None</option>
              {bookingOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.documentNo} — {b.description || "Booking"}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Shift date</span>
            <input
              className={inputClass}
              type="date"
              value={draft.shiftDate}
              onChange={(e) => onChange("shiftDate", e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Shift ref</span>
            <input className={inputClass} value={draft.shiftRef} onChange={(e) => onChange("shiftRef", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Start time</span>
            <input
              className={inputClass}
              type="time"
              value={draft.startTime}
              onChange={(e) => onChange("startTime", e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">End time</span>
            <input
              className={inputClass}
              type="time"
              value={draft.endTime}
              onChange={(e) => onChange("endTime", e.target.value)}
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Shift type</span>
            <select className={inputClass} value={draft.shiftType} onChange={(e) => onChange("shiftType", e.target.value)}>
              {rosterShiftDropdowns.shiftType.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
            <select className={inputClass} value={draft.status} onChange={(e) => onChange("status", e.target.value)}>
              {rosterShiftDropdowns.status.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
            <textarea
              className={inputClass}
              rows={2}
              value={draft.notes}
              onChange={(e) => onChange("notes", e.target.value)}
            />
          </label>
        </fieldset>

        {isNew ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
              <input
                type="checkbox"
                checked={repeatWeekly}
                onChange={(e) => setRepeatWeekly(e.target.checked)}
                disabled={!canSave}
              />
              Repeat weekly
            </label>
            {repeatWeekly ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {RECURRENCE_WEEKDAY_OPTIONS.map((day) => (
                    <button
                      key={day.offset}
                      type="button"
                      disabled={!canSave}
                      onClick={() => toggleWeekday(day.offset)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        weekdayOffsets.includes(day.offset)
                          ? "bg-[#d4147a] text-white"
                          : "bg-white text-slate-600 ring-1 ring-slate-200"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <label className="block text-sm text-slate-600">
                  Number of weeks{" "}
                  <input
                    type="number"
                    min={1}
                    max={12}
                    className="ml-2 w-16 rounded border border-slate-200 px-2 py-1 text-sm"
                    value={weekCount}
                    onChange={(e) => setWeekCount(Math.max(1, Number(e.target.value) || 1))}
                    disabled={!canSave}
                  />
                </label>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {issues.map((issue) => (
            <p
              key={`${issue.code}-${issue.message}`}
              className={`rounded-lg px-3 py-2 text-sm ${
                issue.severity === "error"
                  ? "border border-rose-200 bg-rose-50 text-rose-950"
                  : "border border-amber-200 bg-amber-50 text-amber-950"
              }`}
            >
              {issue.message}
            </p>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave || saveBlocked}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save shift{isNew && repeatWeekly ? "s" : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
