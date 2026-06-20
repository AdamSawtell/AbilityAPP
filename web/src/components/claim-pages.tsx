"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ClaimValidationPanel } from "@/components/claim-validation-panel";
import { LineItemTable } from "@/components/line-item-table";
import { ClientRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import {
  applyLineValidation,
  claimHasBlockingErrors,
  validateClaimLine,
} from "@/lib/claim-papl-validation";
import { claimLineTableConfig } from "@/lib/claim-line-tables";
import {
  generateClaimsFromTimesheets,
  previewClaimGeneration,
  type ClaimGenerationContext,
} from "@/lib/claim-generation";
import {
  claimDropdowns,
  formatClaimPeriod,
  normalizeClaim,
  sumClaimLineAmount,
  type ClaimRecord,
} from "@/lib/claim";
import { useData } from "@/lib/data-store";
import { weekStartFromDate } from "@/lib/roster-shift";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const statusTone: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-sky-100 text-sky-950",
  Accepted: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-950",
};

function clientLabel(clients: { id: string; searchKey: string; name: string }[], id: string): string {
  const match = clients.find((c) => c.id === id);
  return match ? `${match.searchKey} — ${match.name}` : id || "—";
}

function buildClaimContext(data: ReturnType<typeof useData>): ClaimGenerationContext {
  return {
    timesheets: data.timesheets,
    claims: data.claims,
    rosterShifts: data.rosterShifts,
    locations: data.locations,
    clients: data.clients,
    serviceBookings: data.serviceBookings,
    products: data.products,
    priceLists: data.priceLists,
  };
}

function revalidateClaimLines(record: ClaimRecord, data: ReturnType<typeof useData>): ClaimRecord {
  const lines = record.lines.map((line) => {
    const client = data.clients.find((c) => c.id === line.clientId);
    const product = data.products.find((p) => p.id === line.productId);
    const booking = data.serviceBookings.find((b) => b.id === line.serviceBookingId);
    const priceList = data.priceLists.find((pl) => pl.id === product?.priceListId) ?? data.priceLists[0];
    const validation = validateClaimLine({
      line,
      client,
      product,
      priceList,
      booking,
    });
    return applyLineValidation(line, validation);
  });
  return normalizeClaim({
    ...record,
    lines,
    totalAmount: sumClaimLineAmount(lines),
  });
}

export function ClaimListView() {
  const { claims, clients } = useData();
  const [statusFilter, setStatusFilter] = useState("");

  const rows = useMemo(() => {
    let sorted = [...claims].sort((a, b) => (b.periodStart || "").localeCompare(a.periodStart || ""));
    if (statusFilter) sorted = sorted.filter((r) => r.status === statusFilter);
    return sorted;
  }, [claims, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          NDIS claim batches generated from approved, verified timesheet lines. Submit via PRODA or gateway when ready.
        </p>
        <Link
          href="/generate-claims"
          className="inline-flex shrink-0 rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          Generate claims
        </Link>
      </div>
      <label className="text-sm text-slate-600">
        Status{" "}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="ml-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
        >
          <option value="">All</option>
          {claimDropdowns.status.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Lines</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Gateway</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link href={`/claims/${row.id}`} className="font-medium text-[#b51266] hover:underline">
                    {row.documentNo}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <ClientRecordLink
                    id={row.clientId}
                    searchKey={clients.find((c) => c.id === row.clientId)?.searchKey ?? row.clientId}
                    name={clients.find((c) => c.id === row.clientId)?.name ?? ""}
                  />
                </td>
                <td className="px-4 py-3 text-slate-700">{formatClaimPeriod(row)}</td>
                <td className="px-4 py-3 text-slate-700">{row.lines.length}</td>
                <td className="px-4 py-3 text-slate-700">${row.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[row.status] ?? ""}`}>
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{row.gatewayStatus}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No claims yet — generate from approved timesheets.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function GenerateClaimsView() {
  const data = useData();
  const { session, canWriteWindow } = useAuth();
  const canGenerate = canWriteWindow("generate-claims");
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

  const ctx = useMemo(() => buildClaimContext(data), [data]);
  const preview = useMemo(
    () => previewClaimGeneration(ctx, periodStart, periodEnd),
    [ctx, periodStart, periodEnd]
  );

  const handleGenerate = () => {
    if (!canGenerate) {
      setMessage("You do not have permission to generate claims.");
      return;
    }
    if (!preview.eligibleLineCount) {
      setMessage(
        "No eligible lines — approve timesheets, verify check-ins, and ensure lines are not already claimed."
      );
      return;
    }
    setGenerating(true);
    const actor = session?.displayName || "SuperUser";
    const result = generateClaimsFromTimesheets(ctx, periodStart, periodEnd, actor);
    const all = [...result.created, ...result.updated];
    data.bulkUpsertClaims(all);
    setGenerating(false);
    const parts = [];
    if (result.created.length) parts.push(`${result.created.length} created`);
    if (result.updated.length) parts.push(`${result.updated.length} updated`);
    setMessage(
      `Generated claims: ${parts.join(", ") || "none"}.${result.skippedAlreadyClaimed ? ` ${result.skippedAlreadyClaimed} lines already on a claim.` : ""}${result.skippedUnverified ? ` ${result.skippedUnverified} lines skipped — not verified.` : ""}${result.skippedLockedClaim ? ` ${result.skippedLockedClaim} lines skipped — submitted claim exists for participant.` : ""}`
    );
    if (result.created.length === 1) {
      router.push(`/claims/${result.created[0].id}`);
    } else if (all.length) {
      router.push("/claims");
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Bulk-create draft NDIS claim batches from approved timesheet lines with verified check-ins. One claim is created
        per participant for the selected period.
      </p>
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:max-w-xl">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Claim period start</span>
          <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Claim period end</span>
          <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className={inputClass} />
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Eligible lines</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.eligibleLineCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Participants</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.rows.length}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Already claimed</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.alreadyClaimedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unverified skipped</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.unverifiedSkippedCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Locked claims skipped</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.lockedClaimSkippedCount}</p>
        </div>
      </div>
      {preview.rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Lines</th>
                <th className="px-4 py-3">Est. amount</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map((row) => (
                <tr key={row.clientId} className="border-b border-slate-100">
                  <td className="px-4 py-3">{clientLabel(data.clients, row.clientId)}</td>
                  <td className="px-4 py-3">{row.lineCount}</td>
                  <td className="px-4 py-3">${row.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={generating || !preview.eligibleLineCount || !canGenerate}
          onClick={handleGenerate}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate claims"}
        </button>
        <Link href="/claims" className="text-sm font-medium text-[#b51266] hover:underline">
          View claims
        </Link>
      </div>
      {message ? <p className="text-sm text-slate-600">{message}</p> : null}
    </div>
  );
}

export function ClaimDetailView({ id }: { id: string }) {
  const data = useData();
  const { session, canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("claims");
  const stored = data.claims.find((c) => c.id === id);
  const [draft, setDraft] = useState<ClaimRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");

  const record = draft ?? stored;
  const client = data.clients.find((c) => c.id === record?.clientId);

  if (!record) {
    return (
      <AppShell
        title="Claim not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Claims", href: "/claims" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Claims" }}
      >
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">Claim not found.</p>
          <Link href="/claims" className="mt-3 inline-flex text-sm font-medium text-[#b51266] hover:underline">
            Back to claims
          </Link>
        </div>
      </AppShell>
    );
  }

  const update = (patch: Partial<ClaimRecord>) => {
    setSaveError("");
    setDraft((prev) => normalizeClaim({ ...(prev ?? stored!), ...patch }));
    setDirty(true);
  };

  const handleSave = () => {
    if (!record || !canEdit) return;
    const actor = session?.displayName || "SuperUser";
    const validated = revalidateClaimLines(record, data);
    if (validated.status === "Submitted" && claimHasBlockingErrors(validated.lines)) {
      setSaveError("Fix PAPL validation errors before submitting this claim.");
      return;
    }
    data.upsertClaim({ ...validated, updatedBy: actor });
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
        subtitle={client ? `${client.searchKey} — ${client.name}` : "NDIS claim batch"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Claims", href: "/claims" },
          { label: record.documentNo },
        ]}
        audit={{
          entityType: "claim",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <div className="space-y-6">
          <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:grid-cols-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Client</span>
              {client ? (
                <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} />
              ) : (
                <span className="text-slate-600">{record.clientId || "—"}</span>
              )}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Period</span>
              <span className="text-slate-900">{formatClaimPeriod(record)}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Total amount</span>
              <span className="text-lg font-semibold text-slate-900">${record.totalAmount.toFixed(2)}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Status</span>
              <select
                value={record.status}
                disabled={!canEdit}
                onChange={(e) => update({ status: e.target.value })}
                className={inputClass}
              >
                {claimDropdowns.status.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Plan management</span>
              <select
                value={record.planManagementType}
                disabled={!canEdit}
                onChange={(e) => update({ planManagementType: e.target.value })}
                className={inputClass}
              >
                {claimDropdowns.planManagementType.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Gateway status</span>
              <select
                value={record.gatewayStatus}
                disabled={!canEdit}
                onChange={(e) => update({ gatewayStatus: e.target.value })}
                className={inputClass}
              >
                {claimDropdowns.gatewayStatus.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm lg:col-span-3">
              <span className="mb-1 block font-medium text-slate-700">Notes</span>
              <textarea
                value={record.notes}
                disabled={!canEdit}
                onChange={(e) => update({ notes: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </label>
          </div>

          <ClaimValidationPanel lines={record.lines} />

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">Claim lines</h2>
            <div className="mt-4">
              <LineItemTable
                config={claimLineTableConfig}
                rows={record.lines}
                onChange={() => {}}
                readOnly
              />
            </div>
          </div>

          {saveError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{saveError}</p>
          ) : null}
        </div>
      </AppShell>
      <UnsavedChangesBar visible={dirty && canEdit} onSave={handleSave} onDiscard={handleDiscard} />
    </>
  );
}
