"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { type FinancialCloseContext } from "@/lib/financial-close";
import {
  buildFinancialClosedMonthRecord,
  canCloseFinancialMonth,
  isFinancialMonthClosed,
} from "@/lib/financial-close-period";
import { currentPlanMonthIso, formatPlanMonthLabel } from "@/lib/monthly-service-plan";

function buildContext(data: ReturnType<typeof useData>): FinancialCloseContext {
  return {
    clients: data.clients,
    monthlyServicePlans: data.monthlyServicePlans,
    timesheets: data.timesheets,
    claims: data.claims,
    invoices: data.invoices,
    payrollClosedPeriods: data.payrollClosedPeriods,
    financialClosedMonths: data.financialClosedMonths,
    rosterShifts: data.rosterShifts,
  };
}

function checkClass(status: "pass" | "warning" | "block"): string {
  if (status === "block") return "border-rose-200 bg-rose-50 text-rose-950";
  if (status === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  return "border-emerald-200 bg-emerald-50 text-emerald-950";
}

export function FinancialCloseMonthPanel() {
  const data = useData();
  const { financialClosedMonths, closeFinancialMonth } = data;
  const { session, canWriteWindow } = useAuth();
  const canClose = canWriteWindow("financial-close");
  const actor = session?.displayName || "SuperUser";

  const [closeMonth, setCloseMonth] = useState(currentPlanMonthIso());
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const ctx = useMemo(() => buildContext(data), [data]);
  const gate = useMemo(
    () => canCloseFinancialMonth(ctx, closeMonth, financialClosedMonths),
    [ctx, closeMonth, financialClosedMonths]
  );
  const closed = isFinancialMonthClosed(closeMonth, financialClosedMonths);
  const closedRecord = financialClosedMonths.find((row) => row.closeMonth === closeMonth);

  function markClosed() {
    setError("");
    setMessage("");
    if (!gate.ready) {
      setError(gate.message || "Resolve blocking checklist items before closing the month.");
      return;
    }
    closeFinancialMonth(
      buildFinancialClosedMonthRecord({
        closeMonth,
        closedBy: actor,
        notes: notes.trim(),
      })
    );
    setMessage(`${formatPlanMonthLabel(closeMonth)} marked closed.`);
  }

  if (!canClose) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <h2 className="text-sm font-semibold text-slate-900">Mark month closed</h2>
        <p className="mt-1 text-sm text-slate-600">
          After the checklist passes, lock the calendar month so coordinators know financial close is complete.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Close month</span>
          <input
            type="month"
            value={closeMonth}
            onChange={(e) => setCloseMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        <Link
          href="/invoice-reconciliation"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Invoice reconciliation
        </Link>
      </div>

      <ul className="mt-4 space-y-2">
        {gate.evaluation.checks.map((check) => (
          <li key={check.code} className={`rounded-lg border px-3 py-2 text-sm ${checkClass(check.status)}`}>
            <p className="font-medium">{check.label}</p>
            <p className="mt-0.5">{check.message}</p>
          </li>
        ))}
      </ul>

      {closed && closedRecord ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Closed on {closedRecord.closedAt.slice(0, 10)} by {closedRecord.closedBy}.
          {closedRecord.notes ? ` Notes: ${closedRecord.notes}` : ""}
        </p>
      ) : gate.ready ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          Checklist complete — add optional notes and mark the month closed.
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

      {!closed ? (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-[12rem] flex-1 text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Close notes (optional)</span>
            <input
              type="text"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Signed off by finance"
            />
          </label>
          <button
            type="button"
            disabled={!gate.ready}
            onClick={markClosed}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
          >
            Mark month closed
          </button>
        </div>
      ) : null}
    </section>
  );
}
