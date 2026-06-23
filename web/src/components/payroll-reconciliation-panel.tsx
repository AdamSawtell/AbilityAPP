"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  applyBatchPayrollReconciliation,
  applyPayrollReconciliation,
  canReconcileTimesheet,
  exportedTimesheetsForReconciliation,
  formatReconcileVariance,
  PAYROLL_RECONCILE_STATUSES,
  payrollReconcileStatusClass,
  previewPayrollReconciliation,
  summarizePayrollReconciliationDigest,
} from "@/lib/payroll-reconciliation";
import { formatPayrollExportedAt } from "@/lib/timesheet-payroll-export";
import type { TimesheetRecord } from "@/lib/timesheet";

export function PayrollReconciliationPanel() {
  const { timesheets, employees, upsertTimesheet, bulkUpsertTimesheets } = useData();
  const { session, canWriteWindow } = useAuth();
  const canReconcile = canWriteWindow("timesheets");
  const actor = session?.displayName || "SuperUser";

  const candidates = useMemo(() => exportedTimesheetsForReconciliation(timesheets), [timesheets]);
  const digest = useMemo(() => summarizePayrollReconciliationDigest(timesheets), [timesheets]);

  const [statusFilter, setStatusFilter] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [paidHours, setPaidHours] = useState("");
  const [payRunRef, setPayRunRef] = useState("");
  const [batchPayRunRef, setBatchPayRunRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const filteredCandidates = useMemo(() => {
    if (!statusFilter) return candidates;
    return candidates.filter((s) => (s.payrollReconcileStatus || "Pending") === statusFilter);
  }, [candidates, statusFilter]);

  const selected = filteredCandidates.find((s) => s.id === selectedId) ?? filteredCandidates[0];
  const paidNum = Number.parseFloat(paidHours);
  const preview =
    selected && Number.isFinite(paidNum) && paidNum >= 0
      ? previewPayrollReconciliation(selected, paidNum)
      : null;

  const batchSelection = useMemo(
    () => filteredCandidates.filter((s) => selectedIds.has(s.id)),
    [filteredCandidates, selectedIds]
  );

  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set(filteredCandidates.map((s) => s.id));
      const next = new Set([...prev].filter((id) => valid.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [filteredCandidates]);

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCandidates.map((s) => s.id)));
    }
  };

  const handleReconcile = () => {
    setError("");
    setMessage("");
    if (!selected) {
      setError("Select an exported timesheet to reconcile.");
      return;
    }
    const gate = canReconcileTimesheet(selected);
    if (!gate.ok) {
      setError(gate.message);
      return;
    }
    setBusy(true);
    try {
      const updated = applyPayrollReconciliation(selected, {
        paidHours: paidNum,
        payRunRef,
        updatedBy: actor,
      });
      upsertTimesheet(updated);
      setMessage(
        `${selected.documentNo} marked Processed — ${updated.payrollReconcileStatus} (${formatReconcileVariance(preview?.varianceHours ?? 0)} variance).`
      );
      setPaidHours("");
      setPayRunRef("");
      setSelectedId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reconciliation failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleBatchReconcileAtExported = () => {
    setError("");
    setMessage("");
    if (!batchSelection.length) {
      setError("Select one or more exported timesheets.");
      return;
    }
    setBusy(true);
    try {
      const { updated, skipped } = applyBatchPayrollReconciliation(batchSelection, {
        payRunRef: batchPayRunRef,
        updatedBy: actor,
        paidHoursForSheet: (sheet) => sheet.totalHours,
      });
      bulkUpsertTimesheets(updated);
      const matched = updated.filter((s) => s.payrollReconcileStatus === "Matched").length;
      setMessage(
        `Reconciled ${updated.length} timesheet${updated.length === 1 ? "" : "s"} at exported hours — ${matched} matched.${skipped.length ? ` Skipped ${skipped.length}.` : ""}`
      );
      setBatchPayRunRef("");
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Batch reconciliation failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!canReconcile) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Payroll reconciliation</h2>
          <p className="mt-1 text-sm text-slate-600">
            After pay run in Keypay or Xero, enter paid hours and pay run reference. AbilityVua compares exported hours
            to paid and flags variance for audit.
          </p>
        </div>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Reconcile status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All exported</option>
            {PAYROLL_RECONCILE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      {candidates.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Exported hours</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{digest.exportedHours.toFixed(2)}h</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Paid hours recorded</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{digest.paidHours.toFixed(2)}h</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Pending</p>
            <p className="mt-1 text-lg font-semibold text-amber-950">{digest.pendingCount}</p>
            <p className="mt-0.5 text-xs text-amber-800">{digest.varianceCount} with variance</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Matched</p>
            <p className="mt-1 text-lg font-semibold text-emerald-950">{digest.matchedCount}</p>
            <p className="mt-0.5 text-xs text-emerald-800">of {digest.candidateCount} exported</p>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}

      {filteredCandidates.length ? (
        <>
          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-slate-100 bg-slate-50/50 p-3">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-slate-700">Batch pay run reference</span>
              <input
                type="text"
                value={batchPayRunRef}
                onChange={(e) => setBatchPayRunRef(e.target.value)}
                placeholder="Keypay pay run ID"
                className="min-w-[12rem] rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <button
              type="button"
              disabled={busy || !batchPayRunRef.trim() || !batchSelection.length}
              onClick={handleBatchReconcileAtExported}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
            >
              Reconcile {batchSelection.length || "selected"} at exported hours
            </button>
            <p className="text-xs text-slate-500">
              Select rows below when payroll paid hours match exported totals.
            </p>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={filteredCandidates.length > 0 && selectedIds.size === filteredCandidates.length}
                        onChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </th>
                    <th className="px-3 py-2">Document</th>
                    <th className="px-3 py-2">Exported</th>
                    <th className="px-3 py-2">Reconcile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCandidates.map((sheet) => {
                    const employee = employees.find((e) => e.id === sheet.employeeId);
                    return (
                      <tr
                        key={sheet.id}
                        className={`hover:bg-slate-50/80 ${selected?.id === sheet.id ? "bg-[#fdf2f8]" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sheet.id)}
                            onChange={() => toggleSelected(sheet.id)}
                            aria-label={`Select ${sheet.documentNo}`}
                          />
                        </td>
                        <td
                          className="cursor-pointer px-3 py-2"
                          onClick={() => {
                            setSelectedId(sheet.id);
                            setPaidHours(
                              sheet.payrollPaidHours > 0 ? String(sheet.payrollPaidHours) : String(sheet.totalHours)
                            );
                            setPayRunRef(sheet.payrollPayRunRef || sheet.payrollExportBatchRef || "");
                          }}
                        >
                          <p className="font-medium text-slate-900">{sheet.documentNo}</p>
                          <p className="text-xs text-slate-500">{employee?.searchKey || "—"}</p>
                        </td>
                        <td
                          className="cursor-pointer px-3 py-2 text-slate-700"
                          onClick={() => {
                            setSelectedId(sheet.id);
                            setPaidHours(
                              sheet.payrollPaidHours > 0 ? String(sheet.payrollPaidHours) : String(sheet.totalHours)
                            );
                            setPayRunRef(sheet.payrollPayRunRef || sheet.payrollExportBatchRef || "");
                          }}
                        >
                          {sheet.totalHours.toFixed(2)}h
                          {sheet.payrollExportedAt ? (
                            <p className="text-xs text-slate-500">{formatPayrollExportedAt(sheet.payrollExportedAt)}</p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${payrollReconcileStatusClass(sheet.payrollReconcileStatus)}`}
                          >
                            {sheet.payrollReconcileStatus || "Pending"}
                          </span>
                          {sheet.payrollPaidHours > 0 ? (
                            <p className="mt-0.5 text-xs text-slate-500">Paid {sheet.payrollPaidHours.toFixed(2)}h</p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {selected ? (
              <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Reconcile {selected.documentNo}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  Exported {selected.totalHours.toFixed(2)}h
                  {selected.payrollExportBatchRef ? ` · batch ${selected.payrollExportBatchRef}` : ""}
                </p>
                <div className="mt-3 space-y-3">
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Paid hours (from payroll)</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={paidHours}
                      onChange={(e) => setPaidHours(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Pay run reference</span>
                    <input
                      type="text"
                      value={payRunRef}
                      onChange={(e) => setPayRunRef(e.target.value)}
                      placeholder="Keypay pay run ID or Xero batch"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </label>
                  {preview ? (
                    <p className="text-sm text-slate-700">
                      Preview:{" "}
                      <span
                        className={`font-medium ${preview.status === "Variance" ? "text-amber-800" : "text-emerald-800"}`}
                      >
                        {preview.status}
                      </span>
                      {" · "}
                      variance {formatReconcileVariance(preview.varianceHours)}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy || !paidHours.trim() || !payRunRef.trim()}
                    onClick={handleReconcile}
                    className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save reconciliation"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : candidates.length ? (
        <p className="mt-4 text-sm text-slate-600">No exported timesheets match the selected reconcile filter.</p>
      ) : (
        <p className="mt-4 text-sm text-slate-600">No exported timesheets to reconcile yet — export approved records first.</p>
      )}
    </section>
  );
}

export function PayrollReconciliationDetail({
  sheet,
  disabled = false,
}: {
  sheet: TimesheetRecord;
  disabled?: boolean;
}) {
  const { upsertTimesheet } = useData();
  const { session, canWriteWindow } = useAuth();
  const canReconcile = canWriteWindow("timesheets");
  const actor = session?.displayName || "SuperUser";

  const [paidHours, setPaidHours] = useState(
    sheet.payrollPaidHours > 0 ? String(sheet.payrollPaidHours) : String(sheet.totalHours)
  );
  const [payRunRef, setPayRunRef] = useState(sheet.payrollPayRunRef || sheet.payrollExportBatchRef || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPaidHours(sheet.payrollPaidHours > 0 ? String(sheet.payrollPaidHours) : String(sheet.totalHours));
    setPayRunRef(sheet.payrollPayRunRef || sheet.payrollExportBatchRef || "");
    setError("");
    setMessage("");
  }, [
    sheet.id,
    sheet.payrollPaidHours,
    sheet.totalHours,
    sheet.payrollPayRunRef,
    sheet.payrollExportBatchRef,
  ]);

  if (!canReconcile || sheet.payrollExportStatus === "Not exported") return null;

  const paidNum = Number.parseFloat(paidHours);
  const preview =
    Number.isFinite(paidNum) && paidNum >= 0 ? previewPayrollReconciliation(sheet, paidNum) : null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Payroll reconciliation</h2>
      <p className="mt-1 text-sm text-slate-600">
        Status:{" "}
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${payrollReconcileStatusClass(sheet.payrollReconcileStatus)}`}
        >
          {sheet.payrollReconcileStatus || "Pending"}
        </span>
        {sheet.payrollReconciledAt ? (
          <span className="ml-2 text-slate-500">
            Last reconciled {formatPayrollExportedAt(sheet.payrollReconciledAt)}
          </span>
        ) : null}
      </p>
      {sheet.payrollPayRunRef ? (
        <p className="mt-1 text-xs text-slate-500">Pay run ref: {sheet.payrollPayRunRef}</p>
      ) : null}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Paid hours</span>
          <input
            type="number"
            min={0}
            step={0.01}
            value={paidHours}
            disabled={disabled}
            onChange={(e) => setPaidHours(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Pay run reference</span>
          <input
            type="text"
            value={payRunRef}
            disabled={disabled}
            onChange={(e) => setPayRunRef(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>
      </div>
      {preview ? (
        <p className="mt-2 text-sm text-slate-700">
          Variance {formatReconcileVariance(preview.varianceHours)} → {preview.status}
        </p>
      ) : null}
      <button
        type="button"
        disabled={busy || disabled}
        onClick={() => {
          setError("");
          setMessage("");
          setBusy(true);
          try {
            const updated = applyPayrollReconciliation(sheet, {
              paidHours: paidNum,
              payRunRef,
              updatedBy: actor,
            });
            upsertTimesheet(updated);
            setMessage(`Reconciliation saved — ${updated.payrollReconcileStatus}.`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Reconciliation failed.");
          } finally {
            setBusy(false);
          }
        }}
        className="mt-3 rounded-lg border border-[#b51266] bg-white px-4 py-2 text-sm font-medium text-[#b51266] hover:bg-[#fdf2f8] disabled:opacity-60"
      >
        {busy ? "Saving…" : "Update reconciliation"}
      </button>
      {disabled ? (
        <p className="mt-2 text-xs text-slate-500">Save or discard timesheet changes before updating reconciliation.</p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-2 text-sm text-emerald-800">{message}</p> : null}
    </div>
  );
}
