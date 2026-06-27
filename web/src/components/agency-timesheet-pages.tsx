"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PayPeriodRangePicker } from "@/components/pay-period-admin-panel";
import { AppShell } from "@/components/app-shell";
import { LineItemTable } from "@/components/line-item-table";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { agencyWorkerDisplayName } from "@/lib/agency-worker";
import {
  agencyLineVendorCost,
  formatAgencyTimesheetPeriod,
  normalizeAgencyTimesheet,
  sumAgencyTimesheetLineHours,
  sumAgencyTimesheetVendorCost,
  type AgencyTimesheetLine,
  type AgencyTimesheetRecord,
} from "@/lib/agency-timesheet";
import {
  generateAgencyTimesheetsFromShifts,
  previewAgencyTimesheetGeneration,
} from "@/lib/agency-timesheet-generation";
import { agencyTimesheetLineTableConfig } from "@/lib/agency-timesheet-line-tables";
import { auditMetaFrom } from "@/lib/audit";
import { useAuth } from "@/lib/auth-store";
import { localDateIso } from "@/lib/booking-cancellation";
import { useData } from "@/lib/data-store";
import { defaultPayPeriodRange } from "@/lib/pay-period";
import { isPayPeriodClosedForRange } from "@/lib/payroll-period-close";

const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Approved: "bg-emerald-100 text-emerald-800",
};

function vendorLabel(
  vendors: { id: string; name: string; searchKey: string }[],
  id: string
): string {
  const match = vendors.find((v) => v.id === id);
  return match ? `${match.searchKey} — ${match.name}` : id || "—";
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value || 0);
}

export function AgencyTimesheetListView() {
  const { agencyTimesheets, businessPartners } = useData();
  const { canWindow } = useAuth();

  const rows = useMemo(
    () => [...agencyTimesheets].sort((a, b) => (b.periodStart || "").localeCompare(a.periodStart || "")),
    [agencyTimesheets]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Vendor agency timesheets from completed agency roster shifts — hours and buy-rate cost for AP handoff.
        </p>
        {canWindow("generate-agency-timesheets") ? (
          <Link
            href="/generate-agency-timesheets"
            className="inline-flex shrink-0 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Generate agency timesheets
          </Link>
        ) : null}
      </div>
      {rows.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Document</th>
                <th className="px-4 py-3">Vendor</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Vendor cost</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <Link href={`/agency-timesheets/${row.id}`} className="font-medium text-[#b51266] hover:underline">
                      {row.documentNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{vendorLabel(businessPartners, row.vendorBpId)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatAgencyTimesheetPeriod(row.periodStart, row.periodEnd)}
                  </td>
                  <td className="px-4 py-3">{row.totalHours.toFixed(2)}</td>
                  <td className="px-4 py-3">{formatMoney(row.totalVendorCost)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[row.status] ?? "bg-slate-100 text-slate-700"}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">No agency timesheets yet.</p>
          <Link
            href="/generate-agency-timesheets"
            className="mt-3 inline-flex text-sm font-medium text-[#b51266] hover:underline"
          >
            Generate from completed agency shifts
          </Link>
        </div>
      )}
    </div>
  );
}

export function GenerateAgencyTimesheetsView() {
  const {
    rosterShifts,
    agencyTimesheets,
    businessPartners,
    agencyShiftRequests,
    payPeriodInstances,
    payrollClosedPeriods,
    bulkUpsertAgencyTimesheets,
  } = useData();
  const { session, canWriteWindow } = useAuth();
  const canGenerate = canWriteWindow("generate-agency-timesheets");
  const router = useRouter();

  const defaultInstanceId = useMemo(
    () => defaultPayPeriodRange(payPeriodInstances, localDateIso()).instanceId ?? "",
    [payPeriodInstances]
  );
  const [payPeriodInstanceId, setPayPeriodInstanceId] = useState(defaultInstanceId);
  const effectiveInstanceId = payPeriodInstanceId || defaultInstanceId;
  const selectedPeriod = payPeriodInstances.find((row) => row.id === effectiveInstanceId);
  const periodStart = selectedPeriod?.startDate ?? "";
  const periodEnd = selectedPeriod?.endDate ?? "";

  const periodClosed = useMemo(
    () =>
      Boolean(periodStart && periodEnd) &&
      isPayPeriodClosedForRange(periodStart, periodEnd, payrollClosedPeriods, payPeriodInstances),
    [periodStart, periodEnd, payrollClosedPeriods, payPeriodInstances]
  );

  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  const preview = useMemo(
    () =>
      previewAgencyTimesheetGeneration(
        rosterShifts,
        agencyTimesheets,
        businessPartners,
        periodStart,
        periodEnd
      ),
    [rosterShifts, agencyTimesheets, businessPartners, periodStart, periodEnd]
  );

  const handleGenerate = () => {
    if (!canGenerate) {
      setMessage("You do not have permission to generate agency timesheets.");
      return;
    }
    if (!preview.eligibleShiftCount) {
      setMessage(
        "No eligible agency shifts in this period — check dates and that shifts are Completed with agency coverage."
      );
      return;
    }
    if (!periodStart || !periodEnd) {
      setMessage("Select a pay period before generating agency timesheets.");
      return;
    }
    if (periodClosed) {
      setMessage("This pay period is marked closed — choose an open period before generating agency timesheets.");
      return;
    }
    setGenerating(true);
    const actor = session?.displayName || "SuperUser";
    const result = generateAgencyTimesheetsFromShifts(
      rosterShifts,
      agencyTimesheets,
      businessPartners,
      agencyShiftRequests,
      periodStart,
      periodEnd,
      actor
    );
    const all = [...result.created, ...result.updated];
    bulkUpsertAgencyTimesheets(all);
    setGenerating(false);
    const parts = [];
    if (result.created.length) parts.push(`${result.created.length} created`);
    if (result.updated.length) parts.push(`${result.updated.length} updated`);
    setMessage(
      `Generated agency timesheets: ${parts.join(", ") || "none"}.${result.skippedAlreadyLinked ? ` ${result.skippedAlreadyLinked} shifts already on a timesheet.` : ""}${result.skippedLockedPeriod ? ` ${result.skippedLockedPeriod} shifts skipped — period already approved.` : ""}`
    );
    if (result.created.length === 1) {
      router.push(`/agency-timesheets/${result.created[0].id}`);
    } else if (all.length) {
      router.push("/agency-timesheets");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Bulk-create draft agency timesheets from <strong>Completed</strong> roster shifts with agency coverage. Each
        staffing vendor gets one timesheet per period; vendor cost uses the vendor default hourly rate (editable on
        lines).
      </p>
      <PayPeriodRangePicker
        instanceId={effectiveInstanceId}
        onInstanceIdChange={setPayPeriodInstanceId}
        showNavigation
      />
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
        {periodClosed ? (
          <p className="font-medium text-rose-800">
            This pay period is marked closed — agency timesheet generation is blocked until you choose an open period.
          </p>
        ) : null}
        <p>
          <strong>{preview.eligibleShiftCount}</strong> completed agency shift(s) eligible
          {preview.alreadyLinkedCount ? ` · ${preview.alreadyLinkedCount} already linked` : ""}
        </p>
        {preview.rows.length ? (
          <ul className="mt-3 space-y-1">
            {preview.rows.map((row) => (
              <li key={row.vendorBpId}>
                {vendorLabel(businessPartners, row.vendorBpId)} — {row.shiftCount} shift(s), {row.totalHours.toFixed(2)}{" "}
                h, est. {formatMoney(row.estimatedCost)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-slate-500">No vendors with eligible shifts in this period.</p>
        )}
      </div>
      {message ? <p className="text-sm text-slate-700">{message}</p> : null}
      <button
        type="button"
        disabled={!canGenerate || generating || !preview.eligibleShiftCount || periodClosed}
        onClick={handleGenerate}
        className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {generating ? "Generating…" : "Generate agency timesheets"}
      </button>
    </div>
  );
}

export function AgencyTimesheetDetailView({ id }: { id: string }) {
  const {
    agencyTimesheets,
    businessPartners,
    agencyWorkers,
    clients,
    locations,
    upsertAgencyTimesheet,
  } = useData();
  const { session, canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("agency-timesheets");
  const stored = agencyTimesheets.find((t) => t.id === id);
  const [draft, setDraft] = useState<AgencyTimesheetRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");

  const record = draft ?? stored ?? null;
  const vendor = businessPartners.find((p) => p.id === record?.vendorBpId);

  const lineDropdowns = useMemo(
    () => ({
      agencyWorkerId: agencyWorkers.map((w) => w.id),
      clientId: clients.map((c) => c.id),
      locationId: locations.map((l) => l.id),
    }),
    [agencyWorkers, clients, locations]
  );

  const lineOptionLabels = useMemo(
    () => ({
      ...Object.fromEntries(agencyWorkers.map((w) => [w.id, agencyWorkerDisplayName(w)])),
      ...Object.fromEntries(clients.map((c) => [c.id, c.searchKey])),
      ...Object.fromEntries(locations.map((l) => [l.id, l.searchKey])),
    }),
    [agencyWorkers, clients, locations]
  );

  if (!record) {
    return (
      <AppShell
        title="Agency timesheet not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Agency timesheets", href: "/agency-timesheets" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Agency timesheets" }}
      >
        <p className="text-sm text-slate-600">No agency timesheet with ID {id}.</p>
      </AppShell>
    );
  }

  const update = (patch: Partial<AgencyTimesheetRecord>) => {
    setSaveError("");
    setDraft((prev) => normalizeAgencyTimesheet({ ...(prev ?? stored!), ...patch }));
    setDirty(true);
  };

  const onLinesChange = (lines: AgencyTimesheetLine[]) => {
    const recalculated = lines.map((line) => ({
      ...line,
      vendorCost: agencyLineVendorCost(line.hours, line.vendorHourlyRate),
    }));
    update({
      lines: recalculated,
      totalHours: sumAgencyTimesheetLineHours(recalculated),
      totalVendorCost: sumAgencyTimesheetVendorCost(recalculated),
    });
  };

  const handleSave = () => {
    if (!record || !canEdit) return;
    if (record.status !== "Draft" && stored?.status !== record.status) {
      setSaveError("Only draft agency timesheets can be edited.");
      return;
    }
    const actor = session?.displayName || "SuperUser";
    upsertAgencyTimesheet({ ...record, updatedBy: actor });
    setDraft(null);
    setDirty(false);
    setSaveError("");
  };

  const handleApprove = () => {
    if (!record || !canEdit) return;
    if (!record.lines.length) {
      setSaveError("Add at least one shift line before approving.");
      return;
    }
    const actor = session?.displayName || "SuperUser";
    upsertAgencyTimesheet({ ...record, status: "Approved", updatedBy: actor });
    setDraft(null);
    setDirty(false);
    setSaveError("");
  };

  return (
    <>
      <AppShell
        title={record.documentNo}
        subtitle={vendor ? vendor.name : "Agency vendor timesheet"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Agency timesheets", href: "/agency-timesheets" },
          { label: record.documentNo },
        ]}
        audit={{
          entityType: "agency-timesheet",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusTone[record.status] ?? "bg-slate-100 text-slate-700"}`}
          >
            {record.status}
          </span>
          <span className="text-sm text-slate-600">
            {formatAgencyTimesheetPeriod(record.periodStart, record.periodEnd)}
          </span>
          {vendor ? (
            <Link href={`/business-partners/${vendor.id}`} className="text-sm text-[#b51266] hover:underline">
              {vendor.name}
            </Link>
          ) : null}
        </div>
        <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total hours</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{record.totalHours.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor cost</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(record.totalVendorCost)}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Default vendor rate</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {vendor?.agencyHourlyRate ? formatMoney(vendor.agencyHourlyRate) + "/hr" : "—"}
            </p>
          </div>
        </div>
        {saveError ? <p className="mb-4 text-sm text-red-700">{saveError}</p> : null}
        <LineItemTable
          config={agencyTimesheetLineTableConfig}
          rows={record.lines}
          onChange={onLinesChange}
          dropdowns={lineDropdowns}
          optionLabels={lineOptionLabels}
          readOnly={!canEdit || record.status !== "Draft"}
        />
        {canEdit && record.status === "Draft" ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleApprove}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              Approve for vendor invoice
            </button>
          </div>
        ) : null}
      </AppShell>
      <UnsavedChangesBar visible={dirty && canEdit} onSave={handleSave} onDiscard={() => { setDraft(null); setDirty(false); }} />
    </>
  );
}
