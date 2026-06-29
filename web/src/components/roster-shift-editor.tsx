"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  applyBuddyDefaults,
  BILLING_CLASSIFICATION_OPTIONS,
  buddyPayStatusRequiresBookerChoice,
  buddyShiftFromPrimary,
  buddyShiftPayPolicyFromOrganization,
  isBuddyShift,
  isTrainingOrMeetingPurpose,
  normalizeShiftPurpose,
  resolveBuddyPayStatus,
  SHIFT_PAY_STATUS_OPTIONS,
  SHIFT_PURPOSE_OPTIONS,
} from "@/lib/buddy-shift";
import { useOrganization } from "@/lib/organization-store";
import {
  expandWeeklyRecurrence,
  RECURRENCE_WEEKDAY_OPTIONS,
  weekdayOffsetFromDate,
} from "@/lib/roster-shift-recurrence";
import { detectRecurringRosterConflicts } from "@/lib/roster-shift-conflicts";
import {
  rosterShiftSaveBlocked,
  rosterValidationMode,
  validateRosterShift,
} from "@/lib/roster-shift-compliance";
import {
  createRosterShift,
  normalizeRosterShift,
  rosterShiftDropdowns,
  type RosterShiftRecord,
} from "@/lib/roster-shift";
import { ShiftGeoLinks } from "@/components/shift-geo-links";
import { ShiftGeofenceAlerts } from "@/components/shift-geofence-alerts";
import { StaffClientMatchHintsPanel } from "@/components/staff-client-match-hints-panel";
import { formatCheckInTimestamp } from "@/lib/roster-shift-checkin";
import { shiftGeofenceAlerts } from "@/lib/shift-geofence";
import { RosterSessionLinesPanel } from "@/components/roster-session-lines-panel";
import { RosterSessionRiskPanel } from "@/components/roster-session-risk-panel";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function RosterShiftEditor({
  initial,
  defaultDate,
  prefill,
  buddyFromPrimary,
  onClose,
  onSaved,
}: {
  initial?: RosterShiftRecord | null;
  defaultDate?: string;
  prefill?: { clientId?: string; serviceBookingId?: string };
  buddyFromPrimary?: RosterShiftRecord | null;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { clients, employees, locations, serviceBookings, rosterShifts, timesheets, upsertRosterShift, addRecurringRosterShifts } =
    useData();
  const { organization } = useOrganization();
  const payPolicy = buddyShiftPayPolicyFromOrganization(organization);
  const { canWriteWindow, session } = useAuth();
  const canSave = canWriteWindow("rostering");
  const actor = session?.displayName || "SuperUser";
  const isNew = !initial?.id;

  const [draft, setDraft] = useState<RosterShiftRecord>(() => {
    if (buddyFromPrimary) {
      return normalizeRosterShift(buddyShiftFromPrimary(buddyFromPrimary, {}, rosterShifts, payPolicy));
    }
    return normalizeRosterShift(
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
    );
  });

  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [weekCount, setWeekCount] = useState(4);
  const [weekdayOffsets, setWeekdayOffsets] = useState<number[]>(() => [
    weekdayOffsetFromDate(draft.shiftDate),
  ]);
  const [saveError, setSaveError] = useState("");

  const validationMode = rosterValidationMode(draft);
  const isServiceDelivery =
    !isBuddyShift(draft) && !isTrainingOrMeetingPurpose(normalizeShiftPurpose(draft.shiftPurpose));
  const canRepeatWeekly =
    isNew && !isBuddyShift(draft) && !isTrainingOrMeetingPurpose(normalizeShiftPurpose(draft.shiftPurpose));

  const issues = useMemo(() => {
    if (canRepeatWeekly && repeatWeekly && weekdayOffsets.length) {
      const rows = expandWeeklyRecurrence(draft, weekdayOffsets, weekCount);
      const conflictMap = detectRecurringRosterConflicts(rows, rosterShifts);
      const firstConflict = rows.flatMap((row) => {
        const mode = rosterValidationMode(row);
        return (conflictMap.get(row.id) ?? []).map((issue) =>
          mode === "publish" && issue.severity === "warning" ? { ...issue, severity: "error" as const } : issue
        );
      });
      const fieldIssues = validateRosterShift(draft, undefined, validationMode);
      return [...fieldIssues, ...firstConflict];
    }
    return validateRosterShift(draft, { existing: rosterShifts }, validationMode);
  }, [draft, canRepeatWeekly, repeatWeekly, weekdayOffsets, weekCount, rosterShifts, validationMode]);
  const saveBlocked = rosterShiftSaveBlocked(issues);

  const bookingOptions = useMemo(
    () =>
      serviceBookings.filter((b) => !draft.clientId || b.clientId === draft.clientId),
    [serviceBookings, draft.clientId]
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === draft.clientId),
    [clients, draft.clientId]
  );
  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === draft.employeeId),
    [employees, draft.employeeId]
  );

  function onChange<K extends keyof RosterShiftRecord>(key: K, value: RosterShiftRecord[K]) {
    setDraft((prev) => {
      let next = normalizeRosterShift({ ...prev, [key]: value, updatedBy: "SuperUser" });
      if (key === "attendanceStatus") {
        const attendanceStatus = String(value);
        const linkedTimesheet = timesheets.some((sheet) =>
          sheet.lines.some((line) => line.rosterShiftId === prev.id)
        );
        if (prev.attendanceStatus === "Attended" && attendanceStatus !== "Attended" && linkedTimesheet) {
          setSaveError("This attendee already has a generated timesheet line. Remove or reverse the timesheet line before changing attendance.");
          return prev;
        }
        const signed = attendanceStatus === "Attended" || attendanceStatus === "Did not attend";
        next = normalizeRosterShift({
          ...next,
          attendanceSignedOffAt: signed ? new Date().toISOString() : "",
          attendanceSignedOffBy: signed ? actor : "",
          status: signed ? "Completed" : next.status === "Completed" ? "Published" : next.status,
          payStatus: attendanceStatus === "Did not attend" ? "non_payable" : "payable",
        });
      }
      if (key === "shiftPurpose") {
        if (isBuddyShift({ shiftPurpose: String(value) })) {
          next = applyBuddyDefaults(
            {
              ...next,
              billingClassification:
                next.billingClassification === "billable" ? next.billingClassification : "non_billable_internal_cost",
            },
            payPolicy
          );
        } else if (isTrainingOrMeetingPurpose(normalizeShiftPurpose(next.shiftPurpose))) {
          next = {
            ...next,
            clientId: "",
            serviceBookingId: "",
            billingClassification:
              next.costAllocation === "billable"
                ? "billable"
                : next.costAllocation === "admin_costed"
                  ? "admin_costed"
                  : "non_billable_internal_cost",
            payStatus: "payable",
            primaryRosterShiftId: "",
            buddyReason: "",
          };
        } else {
          next = {
            ...next,
            shiftPurpose: "service_delivery",
            billingClassification: "billable",
            payStatus: "payable",
            primaryRosterShiftId: "",
            buddyReason: "",
          };
        }
      }
      if (key === "shiftPurpose" || key === "payStatus") {
        next = applyBuddyDefaults(next, payPolicy);
      }
      return next;
    });
  }

  function toggleWeekday(offset: number) {
    setWeekdayOffsets((prev) =>
      prev.includes(offset) ? prev.filter((d) => d !== offset) : [...prev, offset].sort((a, b) => a - b)
    );
  }

  function save() {
    setSaveError("");
    if (!canSave || saveBlocked) return;

    const draftIsBuddy = isBuddyShift(draft);
    const buddyPay = draftIsBuddy ? resolveBuddyPayStatus(payPolicy, draft.payStatus as "" | "payable" | "non_payable") : "";
    if (isBuddyShift(draft) && buddyPayStatusRequiresBookerChoice(payPolicy) && !buddyPay) {
      setSaveError("Choose whether this buddy shift is paid or non-payable.");
      return;
    }
    const draftToSave = applyBuddyDefaults(
      {
        ...draft,
        payStatus: buddyPay || draft.payStatus,
      },
      payPolicy
    );

    if (canRepeatWeekly && repeatWeekly && weekdayOffsets.length) {
      const rows = expandWeeklyRecurrence(draftToSave, weekdayOffsets, weekCount);
      const conflictMap = detectRecurringRosterConflicts(rows, rosterShifts);
      const blocked = rows.some((row) => {
        const mode = rosterValidationMode(row);
        const conflicts = (conflictMap.get(row.id) ?? []).map((issue) =>
          mode === "publish" && issue.severity === "warning" ? { ...issue, severity: "error" as const } : issue
        );
        const fieldIssues = validateRosterShift(row, { existing: rosterShifts, batchIds: new Set(rows.map((r) => r.id)) }, mode);
        return rosterShiftSaveBlocked([...fieldIssues, ...conflicts]);
      });
      if (blocked) return;
      const err = addRecurringRosterShifts(rows);
      if (err) {
        setSaveError(err);
        return;
      }
    } else {
      const record = isNew ? createRosterShift(draftToSave, rosterShifts) : draftToSave;
      const mode = rosterValidationMode(record);
      const saveIssues = validateRosterShift(record, { existing: rosterShifts }, mode);
      if (rosterShiftSaveBlocked(saveIssues)) return;
      const err = upsertRosterShift(record);
      if (err) {
        setSaveError(err);
        return;
      }
    }
    showSuccessToast(SAVE_TOAST_MESSAGES.shift);
    onSaved?.();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {buddyFromPrimary ? "New buddy shift" : isNew ? "New shift" : "Edit shift"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isServiceDelivery
                ? "One session block — add clients for billing and workers for payroll."
                : "Link client, worker, location, and optional service booking."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500 hover:text-slate-800">
            Close
          </button>
        </div>

        <fieldset disabled={!canSave} className="grid gap-4 sm:grid-cols-2 disabled:opacity-100">
          {!isServiceDelivery ? (
            <>
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
            </>
          ) : null}
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
          {!isServiceDelivery ? (
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
          ) : null}
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
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Shift purpose</span>
            <select
              className={inputClass}
              value={draft.shiftPurpose}
              onChange={(e) => onChange("shiftPurpose", e.target.value)}
              disabled={Boolean(buddyFromPrimary)}
            >
              {SHIFT_PURPOSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
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

          {isTrainingOrMeetingPurpose(normalizeShiftPurpose(draft.shiftPurpose)) ? (
            <>
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Session title</span>
                <input
                  className={inputClass}
                  value={draft.sessionTitle ?? ""}
                  onChange={(e) => onChange("sessionTitle", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Session category</span>
                <select
                  className={inputClass}
                  value={draft.sessionCategory ?? ""}
                  onChange={(e) => onChange("sessionCategory", e.target.value)}
                >
                  <option value="">Select category</option>
                  {rosterShiftDropdowns.sessionCategory.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Cost allocation</span>
                <select
                  className={inputClass}
                  value={draft.costAllocation ?? "non_billable"}
                  onChange={(e) => {
                    const costAllocation = e.target.value;
                    onChange("costAllocation", costAllocation);
                    onChange(
                      "billingClassification",
                      costAllocation === "billable"
                        ? "billable"
                        : costAllocation === "admin_costed"
                          ? "admin_costed"
                          : "non_billable_internal_cost"
                    );
                  }}
                >
                  <option value="billable">Billable</option>
                  <option value="non_billable">Non-billable</option>
                  <option value="admin_costed">Admin-costed</option>
                </select>
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Cost centre</span>
                <input
                  className={inputClass}
                  value={draft.costCentre ?? ""}
                  onChange={(e) => onChange("costCentre", e.target.value)}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Estimated hourly cost</span>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={draft.estimatedHourlyCost ?? 0}
                  onChange={(e) => onChange("estimatedHourlyCost", Number(e.target.value))}
                />
              </label>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Attendance</span>
                <select
                  className={inputClass}
                  value={draft.attendanceStatus ?? "Scheduled"}
                  onChange={(e) => onChange("attendanceStatus", e.target.value)}
                >
                  {rosterShiftDropdowns.attendanceStatus.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </>
          ) : null}

          {isBuddyShift(draft) ? (
            <>
              <label>
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Participant billing</span>
                <select
                  className={inputClass}
                  value={draft.billingClassification}
                  onChange={(e) => onChange("billingClassification", e.target.value)}
                >
                  {BILLING_CLASSIFICATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {buddyPayStatusRequiresBookerChoice(payPolicy) ? (
                <label>
                  <span className="mb-1.5 block text-xs font-medium text-slate-600">Worker pay</span>
                  <select
                    className={inputClass}
                    value={draft.payStatus}
                    onChange={(e) => onChange("payStatus", e.target.value)}
                  >
                    <option value="">Select paid or non-payable…</option>
                    {SHIFT_PAY_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p className="text-xs font-medium text-slate-500">Worker pay</p>
                  <p className="mt-1 font-medium">
                    {draft.payStatus === "non_payable" ? "Non-payable" : "Paid shift"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Organisation policy:{" "}
                    {payPolicy === "always_pay" ? "Always pay" : "Don't pay"}
                  </p>
                </div>
              )}
              {draft.primaryRosterShiftId ? (
                <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <p className="text-xs font-medium text-slate-500">Linked primary shift</p>
                  <p className="mt-1 font-medium">
                    {rosterShifts.find((s) => s.id === draft.primaryRosterShiftId)?.shiftRef ||
                      draft.primaryRosterShiftId}
                  </p>
                </div>
              ) : null}
              <label className="sm:col-span-2">
                <span className="mb-1.5 block text-xs font-medium text-slate-600">Buddy / orientation reason</span>
                <input
                  className={inputClass}
                  value={draft.buddyReason}
                  onChange={(e) => onChange("buddyReason", e.target.value)}
                  placeholder="e.g. New worker site orientation"
                />
              </label>
              <p className="sm:col-span-2 text-xs text-slate-500">
                Buddy shifts appear on rosters and timesheets. Non-billable shifts are excluded from claims and
                invoices. Non-payable shifts are excluded from payroll export.
              </p>
            </>
          ) : null}

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

        {isServiceDelivery ? (
          <>
            <RosterSessionLinesPanel
              draft={draft}
              onChange={(next) => setDraft(normalizeRosterShift({ ...next, updatedBy: actor }))}
              clients={clients}
              employees={employees}
              serviceBookings={serviceBookings}
              disabled={!canSave}
            />
            <RosterSessionRiskPanel
              clientLines={draft.clientLines ?? []}
              clients={clients}
              location={locations.find((l) => l.id === draft.locationId)}
            />
          </>
        ) : null}

        <StaffClientMatchHintsPanel
          client={selectedClient}
          employee={selectedEmployee}
          employees={employees}
          rosterShifts={rosterShifts}
          excludeShiftId={draft.id}
          onSelectWorker={(employeeId) => onChange("employeeId", employeeId)}
          publishMode={draft.status === "Published" || draft.status === "Completed"}
        />

        {canRepeatWeekly ? (
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

        {!isNew && (draft.checkedInAt || draft.checkedOutAt) ? (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm">
            <p className="font-medium text-slate-900">Worker check-in</p>
            {draft.checkedInAt ? (
              <p className="mt-1 text-slate-600">In {formatCheckInTimestamp(draft.checkedInAt)}</p>
            ) : null}
            {draft.checkedOutAt ? (
              <p className="text-slate-600">Out {formatCheckInTimestamp(draft.checkedOutAt)}</p>
            ) : null}
            {draft.checkInNotes ? <p className="mt-1 text-slate-600">Notes: {draft.checkInNotes}</p> : null}
            <ShiftGeoLinks shift={draft} />
            <ShiftGeofenceAlerts
              alerts={shiftGeofenceAlerts(
                draft,
                locations.find((l) => l.id === draft.locationId)
              )}
            />
          </div>
        ) : null}

        <div className="mt-4 space-y-2">
          {saveError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{saveError}</p>
          ) : null}
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
