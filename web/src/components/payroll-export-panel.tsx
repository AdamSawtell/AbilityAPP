"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import type { KeypayPublicStatus } from "@/lib/integrations/keypay-payroll";
import { downloadCsv } from "@/lib/reports/export";
import {
  formatPayrollExportedAt,
  payrollExportStatusClass,
  preparePayrollExport,
} from "@/lib/timesheet-payroll-export";
import type { TimesheetRecord } from "@/lib/timesheet";

export function PayrollExportPanel() {
  const { timesheets, employees, clients, locations, rosterShifts, bulkUpsertTimesheets } = useData();
  const { session, canWriteWindow } = useAuth();
  const canExport = canWriteWindow("timesheets");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [keypayStatus, setKeypayStatus] = useState<KeypayPublicStatus | null>(null);

  useEffect(() => {
    if (!canExport) return;
    void fetch("/api/payroll/keypay/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setKeypayStatus(data as KeypayPublicStatus | null))
      .catch(() => setKeypayStatus(null));
  }, [canExport]);

  const approvedSheets = useMemo(
    () =>
      [...timesheets]
        .filter((sheet) => sheet.status === "Approved")
        .sort((a, b) => (b.periodStart || "").localeCompare(a.periodStart || "")),
    [timesheets]
  );

  const allSelected =
    approvedSheets.length > 0 && approvedSheets.every((sheet) => selectedIds.has(sheet.id));

  const toggleAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(approvedSheets.map((sheet) => sheet.id)));
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExportCsv = () => {
    setError("");
    setMessage("");
    const selected = approvedSheets.filter((sheet) => selectedIds.has(sheet.id));
    const result = preparePayrollExport(
      selected,
      employees,
      clients,
      locations,
      session?.displayName || "SuperUser",
      rosterShifts
    );
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setBusy(true);
    try {
      downloadCsv(result.filename, result.csv);
      bulkUpsertTimesheets(result.updatedTimesheets);
      setMessage(
        `Exported ${result.rowCount} line${result.rowCount === 1 ? "" : "s"} in batch ${result.batchRef}.`
      );
      setSelectedIds(new Set());
    } finally {
      setBusy(false);
    }
  };

  const handleExportKeypay = async () => {
    setError("");
    setMessage("");
    const selected = approvedSheets.filter((sheet) => selectedIds.has(sheet.id));
    if (!selected.length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/payroll/keypay/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timesheetIds: selected.map((sheet) => sheet.id) }),
      });
      let payload: {
        error?: string;
        payRunRef?: string;
        dryRun?: boolean;
        lineCount?: number;
        updatedTimesheets?: TimesheetRecord[];
      } = {};
      try {
        payload = (await res.json()) as typeof payload;
      } catch {
        setError("Keypay export returned an invalid response.");
        return;
      }
      if (!res.ok) {
        setError(payload.error ?? "Keypay export failed.");
        return;
      }
      if (payload.updatedTimesheets?.length) {
        bulkUpsertTimesheets(payload.updatedTimesheets);
      }
      const modeNote = payload.dryRun ? " (dry run — not sent to Keypay)" : "";
      setMessage(
        `Sent ${payload.lineCount ?? 0} line${payload.lineCount === 1 ? "" : "s"} to Keypay — ref ${payload.payRunRef}${modeNote}.`
      );
      setSelectedIds(new Set());
    } catch {
      setError("Could not reach the Keypay export service. Try again or use CSV export.");
    } finally {
      setBusy(false);
    }
  };

  if (!canExport) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Payroll export</h2>
          <p className="mt-1 text-sm text-slate-600">
            Download approved timesheets as CSV for Keypay or Xero, or post directly to Keypay when API credentials are
            configured. Award interpretation and pay runs stay in your payroll system.
          </p>
          {keypayStatus?.available ? (
            <p className="mt-2 text-xs text-slate-500">
              Keypay: {keypayStatus.mode === "live" ? "live API" : "dry run"} — {keypayStatus.message}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {keypayStatus?.available ? (
            <button
              type="button"
              disabled={busy || !selectedIds.size}
              onClick={() => void handleExportKeypay()}
              className="inline-flex rounded-lg border border-[#b51266] bg-white px-4 py-2 text-sm font-medium text-[#b51266] hover:bg-[#fdf2f8] disabled:opacity-60"
            >
              {busy ? "Exporting…" : "Export to Keypay API"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy || !selectedIds.size}
            onClick={handleExportCsv}
            className="inline-flex rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:opacity-60"
          >
            {busy ? "Exporting…" : "Export selected to CSV"}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}

      {approvedSheets.length ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all approved timesheets"
                  />
                </th>
                <th className="px-3 py-2">Document</th>
                <th className="px-3 py-2">Worker</th>
                <th className="px-3 py-2">Hours</th>
                <th className="px-3 py-2">Payroll status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {approvedSheets.map((sheet) => {
                const employee = employees.find((e) => e.id === sheet.employeeId);
                return (
                  <tr key={sheet.id} className="hover:bg-slate-50/80">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(sheet.id)}
                        onChange={() => toggleOne(sheet.id)}
                        aria-label={`Select ${sheet.documentNo}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-slate-900">{sheet.documentNo}</td>
                    <td className="px-3 py-2 text-slate-700">{employee?.searchKey || sheet.employeeId || "—"}</td>
                    <td className="px-3 py-2 text-slate-700">{sheet.totalHours.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${payrollExportStatusClass(sheet.payrollExportStatus)}`}
                      >
                        {sheet.payrollExportStatus || "Not exported"}
                      </span>
                      {sheet.payrollExportedAt ? (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatPayrollExportedAt(sheet.payrollExportedAt)}
                          {sheet.payrollExportBatchRef ? ` · ${sheet.payrollExportBatchRef}` : null}
                        </p>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 text-sm text-slate-600">No approved timesheets ready for payroll export.</p>
      )}
    </section>
  );
}

export function PayrollExportDetailActions({
  sheet,
  disabled = false,
}: {
  sheet: TimesheetRecord;
  disabled?: boolean;
}) {
  const { employees, clients, locations, rosterShifts, bulkUpsertTimesheets } = useData();
  const { session, canWriteWindow } = useAuth();
  const canExport = canWriteWindow("timesheets");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [keypayStatus, setKeypayStatus] = useState<KeypayPublicStatus | null>(null);

  useEffect(() => {
    if (!canExport) return;
    void fetch("/api/payroll/keypay/status", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setKeypayStatus(data as KeypayPublicStatus | null))
      .catch(() => setKeypayStatus(null));
  }, [canExport]);

  if (!canExport || sheet.status !== "Approved" || disabled) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Payroll export</h2>
          <p className="mt-1 text-sm text-slate-600">
            Status:{" "}
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${payrollExportStatusClass(sheet.payrollExportStatus)}`}
            >
              {sheet.payrollExportStatus || "Not exported"}
            </span>
            {sheet.payrollExportedAt ? (
              <span className="ml-2 text-slate-500">
                Last export {formatPayrollExportedAt(sheet.payrollExportedAt)}
                {sheet.payrollExportBatchRef ? ` (${sheet.payrollExportBatchRef})` : null}
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {keypayStatus?.available ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setError("");
                setMessage("");
                void (async () => {
                  setBusy(true);
                  try {
                    const res = await fetch("/api/payroll/keypay/export", {
                      method: "POST",
                      credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ timesheetIds: [sheet.id] }),
                    });
                    let payload: {
                      error?: string;
                      payRunRef?: string;
                      dryRun?: boolean;
                      updatedTimesheets?: TimesheetRecord[];
                    } = {};
                    try {
                      payload = (await res.json()) as typeof payload;
                    } catch {
                      setError("Keypay export returned an invalid response.");
                      return;
                    }
                    if (!res.ok) {
                      setError(payload.error ?? "Keypay export failed.");
                      return;
                    }
                    if (payload.updatedTimesheets?.length) {
                      bulkUpsertTimesheets(payload.updatedTimesheets);
                    }
                    setMessage(
                      `Keypay ref ${payload.payRunRef}${payload.dryRun ? " (dry run)" : ""}.`
                    );
                  } catch {
                    setError("Could not reach the Keypay export service.");
                  } finally {
                    setBusy(false);
                  }
                })();
              }}
              className="inline-flex rounded-lg border border-[#b51266] bg-white px-4 py-2 text-sm font-medium text-[#b51266] hover:bg-[#fdf2f8] disabled:opacity-60"
            >
              {busy ? "Exporting…" : "Export to Keypay API"}
            </button>
          ) : null}
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setError("");
              setMessage("");
              const result = preparePayrollExport(
                [sheet],
                employees,
                clients,
                locations,
                session?.displayName || "SuperUser",
                rosterShifts
              );
              if (!result.ok) {
                setError(result.message);
                return;
              }
              setBusy(true);
              try {
                downloadCsv(result.filename, result.csv);
                bulkUpsertTimesheets(result.updatedTimesheets);
                setMessage(`Exported batch ${result.batchRef}.`);
              } finally {
                setBusy(false);
              }
            }}
            className="inline-flex rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:opacity-60"
          >
            {busy ? "Exporting…" : "Export to payroll CSV"}
          </button>
        </div>
      </div>
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}
    </div>
  );
}
