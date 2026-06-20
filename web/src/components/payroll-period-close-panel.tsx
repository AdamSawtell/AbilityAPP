"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  buildPayrollPeriodCloseRecord,
  defaultPayrollPeriodRange,
  evaluatePayrollPeriodClose,
  type PayrollPeriodCloseCheck,
} from "@/lib/payroll-period-close";

function checkClass(status: PayrollPeriodCloseCheck["status"]): string {
  if (status === "block") return "border-rose-200 bg-rose-50 text-rose-950";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-emerald-200 bg-emerald-50 text-emerald-950";
}

export function PayrollPeriodClosePanel() {
  const { timesheets, payrollClosedPeriods, closePayrollPeriod } = useData();
  const { session, canWriteWindow } = useAuth();
  const canClose = canWriteWindow("timesheets");
  const actor = session?.displayName || "SuperUser";

  const defaults = useMemo(() => defaultPayrollPeriodRange(), []);
  const [periodStart, setPeriodStart] = useState(defaults.periodStart);
  const [periodEnd, setPeriodEnd] = useState(defaults.periodEnd);
  const [payRunRef, setPayRunRef] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const evaluation = useMemo(
    () => evaluatePayrollPeriodClose(timesheets, periodStart, periodEnd, payrollClosedPeriods),
    [timesheets, periodStart, periodEnd, payrollClosedPeriods]
  );

  function markClosed() {
    setError("");
    setMessage("");
    if (!evaluation.readyToClose) {
      setError("Complete all checklist items before closing the pay period.");
      return;
    }
    if (!payRunRef.trim()) {
      setError("Enter the pay run reference used for this period.");
      return;
    }
    closePayrollPeriod(
      buildPayrollPeriodCloseRecord({
        periodStart,
        periodEnd,
        closedBy: actor,
        payRunRef: payRunRef.trim(),
        notes: notes.trim(),
      })
    );
    setMessage(`Pay period ${periodStart} to ${periodEnd} marked closed.`);
  }

  if (!canClose) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Payroll period close</h2>
        <p className="mt-1 text-sm text-slate-600">
          Run this checklist before archiving a pay period — approve, export, reconcile, then mark closed.
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Period start</span>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Period end</span>
          <input
            type="date"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-slate-600">Pay run reference</span>
          <input
            type="text"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={payRunRef}
            onChange={(e) => setPayRunRef(e.target.value)}
            placeholder="Keypay or Xero pay run ID"
          />
        </label>
      </div>

      <ul className="mt-4 space-y-2">
        {evaluation.checks.map((check) => (
          <li key={check.code} className={`rounded-lg border px-3 py-2 text-sm ${checkClass(check.status)}`}>
            <p className="font-medium">{check.label}</p>
            <p className="mt-0.5">{check.message}</p>
          </li>
        ))}
      </ul>

      {evaluation.closed ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Period closed — generating new draft lines for this date range will stay blocked while closed.
        </p>
      ) : evaluation.readyToClose ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Checklist complete — enter pay run reference and mark the period closed.
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}

      {!evaluation.closed ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[12rem] flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Close notes (optional)</span>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Pay run lodged STP"
            />
          </label>
          <button
            type="button"
            disabled={!evaluation.readyToClose || !payRunRef.trim()}
            onClick={markClosed}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
          >
            Mark period closed
          </button>
        </div>
      ) : null}
    </section>
  );
}
