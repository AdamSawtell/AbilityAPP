"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LineItemTable } from "@/components/line-item-table";
import { EmployeeRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import { useData } from "@/lib/data-store";
import { weekStartFromDate } from "@/lib/roster-shift";
import {
  generateTimesheetsFromShifts,
  previewTimesheetGeneration,
} from "@/lib/timesheet-generation";
import { timesheetLineTableConfig } from "@/lib/timesheet-line-tables";
import {
  formatTimesheetPeriod,
  normalizeTimesheet,
  timesheetDropdowns,
  type TimesheetRecord,
} from "@/lib/timesheet";
import { verifyTimesheet, timesheetApprovalBlocked } from "@/lib/timesheet-verification";
import { TimesheetVerificationPanel } from "@/components/timesheet-verification-panel";
import { PayrollExportDetailActions, PayrollExportPanel } from "@/components/payroll-export-panel";
import { payrollExportStatusClass } from "@/lib/timesheet-payroll-export";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-800",
};

function employeeLabel(employees: { id: string; searchKey: string; name: string }[], id: string): string {
  const match = employees.find((e) => e.id === id);
  return match ? `${match.searchKey} — ${match.name}` : id || "—";
}

export function TimesheetListView() {
  const { timesheets, employees, rosterShifts, locations } = useData();
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => {
    const sorted = [...timesheets].sort((a, b) => (b.periodStart || "").localeCompare(a.periodStart || ""));
    if (!statusFilter) return sorted;
    return sorted.filter((r) => r.status === statusFilter);
  }, [timesheets, statusFilter]);

  const verificationById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof verifyTimesheet>>();
    for (const sheet of rows) {
      map.set(sheet.id, verifyTimesheet(sheet, rosterShifts, locations));
    }
    return map;
  }, [rows, rosterShifts, locations]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Review worker timesheets generated from roster shifts. Approve timesheets before payroll export.
        </p>
        <Link
          href="/generate-timesheets"
          className="inline-flex shrink-0 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Generate timesheets
        </Link>
      </div>
      <PayrollExportPanel />
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">
          Status{" "}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          >
            <option value="">All</option>
            {timesheetDropdowns.status.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Verification</th>
                <th className="px-4 py-3">Payroll</th>
                <th className="px-4 py-3">Lines</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((sheet) => {
                const employee = employees.find((e) => e.id === sheet.employeeId);
                const verification = verificationById.get(sheet.id);
                return (
                  <tr key={sheet.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link href={`/timesheets/${sheet.id}`} className="font-medium text-[#b51266] hover:underline">
                        {sheet.documentNo}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {employee ? (
                        <EmployeeRecordLink
                          id={employee.id}
                          searchKey={employee.searchKey}
                          name={employee.name}
                          className="text-[#b51266] hover:underline"
                        />
                      ) : (
                        sheet.employeeId || "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatTimesheetPeriod(sheet.periodStart, sheet.periodEnd)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">{sheet.totalHours.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[sheet.status] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {sheet.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {verification && sheet.lines.length ? (
                        verification.issueCount ? (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-950">
                            {verification.verifiedCount}/{sheet.lines.length} verified
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-950">
                            All verified
                          </span>
                        )
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {sheet.status === "Approved" ? (
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${payrollExportStatusClass(sheet.payrollExportStatus)}`}
                        >
                          {sheet.payrollExportStatus || "Not exported"}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{sheet.lines.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">No timesheets yet.</p>
          <Link href="/generate-timesheets" className="mt-3 inline-flex text-sm font-medium text-[#b51266] hover:underline">
            Generate from roster shifts
          </Link>
        </div>
      )}
    </div>
  );
}

export function GenerateTimesheetsView() {
  const { rosterShifts, timesheets, employees, bulkUpsertTimesheets } = useData();
  const { session, canWriteWindow } = useAuth();
  const canGenerate = canWriteWindow("generate-timesheets");
  const router = useRouter();
  const defaultWeekStart = weekStartFromDate("2025-10-06");
  const defaultWeekEnd = useMemo(() => {
    const d = new Date(`${defaultWeekStart}T12:00:00`);
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  }, [defaultWeekStart]);

  const [periodStart, setPeriodStart] = useState(defaultWeekStart);
  const [periodEnd, setPeriodEnd] = useState(defaultWeekEnd);
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  const preview = useMemo(
    () => previewTimesheetGeneration(rosterShifts, timesheets, periodStart, periodEnd),
    [rosterShifts, timesheets, periodStart, periodEnd]
  );

  const handleGenerate = () => {
    if (!canGenerate) {
      setMessage("You do not have permission to generate timesheets.");
      return;
    }
    if (!preview.eligibleShiftCount) {
      setMessage("No eligible roster shifts in this period — check dates and shift status (Published or Completed).");
      return;
    }
    setGenerating(true);
    const actor = session?.displayName || "SuperUser";
    const result = generateTimesheetsFromShifts(rosterShifts, timesheets, periodStart, periodEnd, actor);
    const all = [...result.created, ...result.updated];
    bulkUpsertTimesheets(all);
    setGenerating(false);
    const parts = [];
    if (result.created.length) parts.push(`${result.created.length} created`);
    if (result.updated.length) parts.push(`${result.updated.length} updated`);
    setMessage(
      `Generated timesheets: ${parts.join(", ") || "none"}.${result.skippedAlreadyLinked ? ` ${result.skippedAlreadyLinked} shifts already on a timesheet.` : ""}${result.skippedLockedPeriod ? ` ${result.skippedLockedPeriod} shifts skipped — period already submitted or approved.` : ""}`
    );
    if (result.created.length === 1) {
      router.push(`/timesheets/${result.created[0].id}`);
    } else if (all.length) {
      router.push("/timesheets");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Bulk-create draft timesheets from published roster shifts in a pay period. Each worker gets one timesheet; shifts
        already linked to a timesheet are skipped.
      </p>
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:max-w-xl">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Period start</span>
          <input
            type="date"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Period end</span>
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputClass} />
        </label>
      </div>
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
        <p>
          <span className="font-medium">{preview.eligibleShiftCount}</span> eligible shifts across{" "}
          <span className="font-medium">{preview.rows.length}</span> workers.
          {preview.alreadyLinkedCount ? (
            <> {preview.alreadyLinkedCount} shifts already on a timesheet.</>
          ) : null}
        </p>
      </div>
      {preview.rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Worker</th>
                <th className="px-4 py-3">Shifts</th>
                <th className="px-4 py-3">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {preview.rows.map((row) => (
                <tr key={row.employeeId}>
                  <td className="px-4 py-3">{employeeLabel(employees, row.employeeId)}</td>
                  <td className="px-4 py-3">{row.shiftCount}</td>
                  <td className="px-4 py-3 font-medium">{row.totalHours.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={generating || !preview.eligibleShiftCount || !canGenerate}
          onClick={handleGenerate}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate timesheets"}
        </button>
        <Link href="/timesheets" className="text-sm font-medium text-[#b51266] hover:underline">
          View timesheets
        </Link>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}

export function TimesheetDetailView({ id }: { id: string }) {
  const { timesheets, employees, clients, locations, serviceBookings, rosterShifts, upsertTimesheet } = useData();
  const { session, canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("timesheets");
  const stored = timesheets.find((t) => t.id === id);
  const [draft, setDraft] = useState<TimesheetRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");

  const record = draft ?? stored;
  const employee = employees.find((e) => e.id === record?.employeeId);

  const verification = useMemo(
    () => (record ? verifyTimesheet(record, rosterShifts, locations) : null),
    [record, rosterShifts, locations]
  );

  const lineDropdowns = useMemo(
    () => ({
      clientId: clients.map((c) => c.id),
      locationId: locations.map((l) => l.id),
      serviceBookingId: serviceBookings.map((b) => b.id),
    }),
    [clients, locations, serviceBookings]
  );

  const lineOptionLabels = useMemo(
    () => ({
      ...Object.fromEntries(clients.map((c) => [c.id, c.searchKey])),
      ...Object.fromEntries(locations.map((l) => [l.id, l.searchKey])),
      ...Object.fromEntries(serviceBookings.map((b) => [b.id, b.documentNo])),
    }),
    [clients, locations, serviceBookings]
  );

  if (!record) {
    return (
      <AppShell
        title="Timesheet not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Timesheets", href: "/timesheets" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Timesheets" }}
      >
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">Timesheet not found.</p>
          <Link href="/timesheets" className="mt-3 inline-flex text-sm font-medium text-[#b51266] hover:underline">
            Back to timesheets
          </Link>
        </div>
      </AppShell>
    );
  }

  const update = (patch: Partial<TimesheetRecord>) => {
    setSaveError("");
    setDraft((prev) => normalizeTimesheet({ ...(prev ?? stored!), ...patch }));
    setDirty(true);
  };

  const handleSave = () => {
    if (!record || !canEdit) return;
    const block = timesheetApprovalBlocked(record, rosterShifts, record.status, stored?.status, locations);
    if (block) {
      setSaveError(block);
      return;
    }
    const actor = session?.displayName || "SuperUser";
    upsertTimesheet({ ...record, updatedBy: actor });
    setDraft(null);
    setDirty(false);
    setSaveError("");
  };

  const handleDiscard = () => {
    setDraft(null);
    setDirty(false);
  };

  return (
    <>
      <AppShell
        title={record.documentNo}
        subtitle={employee ? `${employee.searchKey} — ${employee.name}` : "Worker timesheet"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Timesheets", href: "/timesheets" },
          { label: record.documentNo },
        ]}
        audit={{
          entityType: "timesheet",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <div className="space-y-6">
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Worker</span>
              {employee ? (
                <EmployeeRecordLink
                  id={employee.id}
                  searchKey={employee.searchKey}
                  name={employee.name}
                  className="text-[#b51266] hover:underline"
                />
              ) : (
                <span className="text-slate-600">{record.employeeId || "—"}</span>
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Pay period</span>
              <span className="text-slate-800">{formatTimesheetPeriod(record.periodStart, record.periodEnd)}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Total hours</span>
              <span className="font-semibold text-slate-900">{record.totalHours.toFixed(2)}</span>
            </label>
            <label className="block text-sm lg:col-span-1">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              {canEdit ? (
                <select
                  value={record.status}
                  onChange={(e) => update({ status: e.target.value })}
                  className={inputClass}
                >
                  {timesheetDropdowns.status.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[record.status] ?? "bg-slate-100"}`}
                >
                  {record.status}
                </span>
              )}
            </label>
            <label className="block text-sm lg:col-span-2">
              <span className="mb-1 block font-medium text-slate-700">Notes</span>
              {canEdit ? (
                <textarea
                  value={record.notes}
                  onChange={(e) => update({ notes: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              ) : (
                <span className="text-slate-600">{record.notes || "—"}</span>
              )}
            </label>
          </div>
          {verification ? (
            <TimesheetVerificationPanel summary={verification} lines={record.lines} />
          ) : null}
          <PayrollExportDetailActions sheet={stored ?? record} disabled={dirty || !stored} />
          {saveError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{saveError}</p>
          ) : null}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Shift lines</h2>
            <LineItemTable
              config={timesheetLineTableConfig}
              rows={record.lines}
              onChange={() => {}}
              dropdowns={lineDropdowns}
              optionLabels={lineOptionLabels}
              readOnly
            />
          </div>
        </div>
      </AppShell>
      <UnsavedChangesBar visible={dirty && canEdit} onSave={handleSave} onDiscard={handleDiscard} />
    </>
  );
}
