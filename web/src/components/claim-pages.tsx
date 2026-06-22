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
  claimRecordIsLocked,
  claimSaveBlocked,
  revalidateClaimRecord,
  type ClaimValidationContext,
} from "@/lib/claim-papl-validation";
import { ClaimGatewayPanel } from "@/components/claim-gateway-panel";
import { ClaimRemittancePanel } from "@/components/claim-remittance-panel";
import { claimLineTableConfig } from "@/lib/claim-line-tables";
import {
  generateClaimsFromTimesheets,
  previewClaimGeneration,
  type ClaimGenerationContext,
} from "@/lib/claim-generation";
import {
  generateCancellationClaims,
  previewCancellationClaims,
  type CancellationClaimContext,
} from "@/lib/cancellation-claim-generation";
import {
  claimDropdowns,
  findClaimByRouteId,
  formatClaimPeriod,
  normalizeClaim,
  sumClaimLineAmount,
  type ClaimRecord,
} from "@/lib/claim";
import { remittanceStatusClass } from "@/lib/claim-remittance";
import { registerGeneratedDocument } from "@/lib/document-client";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { exportPhase2DocumentHtml, printPhase2Document } from "@/lib/phase2-document-print";
import { useOrganization } from "@/lib/organization-store";
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
    invoices: data.invoices,
    rosterShifts: data.rosterShifts,
    locations: data.locations,
    clients: data.clients,
    serviceBookings: data.serviceBookings,
    products: data.products,
    priceLists: data.priceLists,
  };
}

function validationContext(data: ReturnType<typeof useData>): ClaimValidationContext {
  return {
    clients: data.clients,
    serviceBookings: data.serviceBookings,
    products: data.products,
    priceLists: data.priceLists,
  };
}

function revalidateClaimLines(record: ClaimRecord, data: ReturnType<typeof useData>): ClaimRecord {
  return revalidateClaimRecord(record, validationContext(data), "save");
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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="text-sm text-slate-600">
          Compare submitted claims to remittance payments on the claim reconciliation dashboard.
        </p>
        <Link
          href="/claim-reconciliation"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Claim reconciliation
        </Link>
      </div>
      <ClaimRemittancePanel />
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
              <th className="px-4 py-3">Remittance</th>
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
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${remittanceStatusClass(row.remittanceStatus || "Not imported")}`}
                  >
                    {row.remittanceStatus || "Not imported"}
                  </span>
                  {row.remittancePaidAmount > 0 ? (
                    <span className="mt-0.5 block text-xs text-slate-500">${row.remittancePaidAmount.toFixed(2)} paid</span>
                  ) : null}
                </td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
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
      `Generated claims: ${parts.join(", ") || "none"}.${result.skippedAlreadyClaimed ? ` ${result.skippedAlreadyClaimed} lines already on a claim.` : ""}${result.skippedUnverified ? ` ${result.skippedUnverified} lines skipped — not verified.` : ""}${result.skippedLockedClaim ? ` ${result.skippedLockedClaim} lines skipped — submitted claim exists for participant.` : ""}${result.skippedInvoiceManaged ? ` ${result.skippedInvoiceManaged} plan/self-managed lines skipped — use Generate invoices.` : ""}`
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
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
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan/self managed skipped</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.invoiceManagedSkippedCount}</p>
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
      <CancellationClaimsPanel />
    </div>
  );
}

function CancellationClaimsPanel() {
  const data = useData();
  const { session, canWriteWindow } = useAuth();
  const canGenerate = canWriteWindow("generate-claims");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [generating, setGenerating] = useState(false);

  const ctx = useMemo(
    (): CancellationClaimContext => ({
      serviceBookings: data.serviceBookings,
      claims: data.claims,
      clients: data.clients,
      products: data.products,
      priceLists: data.priceLists,
    }),
    [data]
  );
  const preview = useMemo(() => previewCancellationClaims(ctx), [ctx]);

  const handleGenerate = () => {
    if (!canGenerate) {
      setMessage("You do not have permission to generate cancellation claims.");
      return;
    }
    if (!preview.eligibleCount) {
      setMessage("No claimable cancelled bookings — check cancellation policy on service bookings.");
      return;
    }
    setGenerating(true);
    const actor = session?.displayName || "SuperUser";
    const result = generateCancellationClaims(ctx, actor, data.claims);
    const all = [...result.created, ...result.updated];
    data.bulkUpsertClaims(all);
    setGenerating(false);
    setMessage(
      `Cancellation claims: ${result.created.length} created, ${result.updated.length} updated.${result.skippedAlreadyLinked ? ` ${result.skippedAlreadyLinked} already linked.` : ""}`
    );
    if (result.created.length === 1) {
      router.push(`/claims/${result.created[0].id}`);
    }
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">Cancellation claims</h2>
      <p className="mt-1 text-sm text-slate-600">
        Generate draft NDIS claim lines from cancelled service bookings with short-notice participant cancellations.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Eligible bookings</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.eligibleCount}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Claimable total</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">${preview.totalClaimable.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Already linked</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{preview.alreadyLinkedCount}</p>
        </div>
      </div>
      {preview.rows.length ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {preview.rows.slice(0, 5).map((row) => (
            <li key={row.bookingId} className="rounded-lg border border-slate-100 px-3 py-2">
              <span className="font-medium">{row.documentNo}</span> — ${row.claimableAmount.toFixed(2)} (
              {row.claimablePercent}%)
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={generating || !preview.eligibleCount || !canGenerate}
          onClick={handleGenerate}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate cancellation claims"}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-slate-600">{message}</p> : null}
    </section>
  );
}

export function ClaimDetailView({ id }: { id: string }) {
  const data = useData();
  const { session, canWriteWindow, canProcess } = useAuth();
  const { organization } = useOrganization();
  const { resolveTemplate } = useDocumentPlatform();
  const canPrintClaim = canProcess(DOCUMENT_PRINT_PROCESSES.printClaimBatch);
  const canEdit = canWriteWindow("claims");
  const stored = findClaimByRouteId(data.claims, id);
  const [draft, setDraft] = useState<ClaimRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [printError, setPrintError] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

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
    const block = claimSaveBlocked(stored, validated, validationContext(data));
    if (block) {
      setSaveError(block);
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

  const locked = claimRecordIsLocked(stored ?? record);
  const ctx = validationContext(data);

  async function handlePrintClaimBatch() {
    if (!record) return;
    setPrintError("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printClaimBatch, "claim");
    if (!template) {
      setPrintError("No active claim batch template is available.");
      return;
    }
    const printCtx = { claim: record, client, organization };
    const ok = printPhase2Document(printCtx, template);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      return;
    }
    const exported = exportPhase2DocumentHtml(printCtx, template);
    if (exported) {
      try {
        await registerGeneratedDocument({
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "claim",
          entityId: record.id,
          entityLabel: record.documentNo,
          fileName: `${record.documentNo.replace(/[^\w.-]+/g, "_")}-claim-batch.html`,
        });
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  }

  async function handleDownloadPdf() {
    if (!record) return;
    setPrintError("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printClaimBatch, "claim");
    if (!template) {
      setPrintError("No active claim batch template is available.");
      return;
    }
    const printCtx = { claim: record, client, organization };
    const exported = exportPhase2DocumentHtml(printCtx, template);
    if (!exported) {
      setPrintError("Could not generate the document. Check claim fields and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "claim",
        entityId: record.id,
        entityLabel: record.documentNo,
        fileName: pdfFileName(`${record.documentNo}-claim-batch`),
      });
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  }

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
                disabled={!canEdit || locked}
                onChange={(e) => update({ status: e.target.value })}
                className={inputClass}
              >
                {claimDropdowns.status
                  .filter((s) => s !== "Submitted" || locked)
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
              {!locked ? (
                <p className="mt-1 text-xs text-slate-500">Use Submit to gateway to move a Draft claim to Submitted.</p>
              ) : null}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Plan management</span>
              <select
                value={record.planManagementType}
                disabled={!canEdit || locked}
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
              <span className="block text-sm text-slate-900">{record.gatewayStatus || "Not submitted"}</span>
              {record.gatewayRef ? (
                <span className="mt-0.5 block text-xs text-slate-500">Ref: {record.gatewayRef}</span>
              ) : null}
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Remittance</span>
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${remittanceStatusClass(record.remittanceStatus || "Not imported")}`}
              >
                {record.remittanceStatus || "Not imported"}
              </span>
              {record.remittancePaidAmount > 0 ? (
                <span className="mt-1 block text-sm text-slate-900">${record.remittancePaidAmount.toFixed(2)} paid</span>
              ) : null}
              {record.remittancePaymentRef ? (
                <span className="mt-0.5 block text-xs text-slate-500">Payment ref: {record.remittancePaymentRef}</span>
              ) : null}
            </label>
            <label className="block text-sm lg:col-span-3">
              <span className="mb-1 block font-medium text-slate-700">Notes</span>
              <textarea
                value={record.notes}
                disabled={!canEdit || locked}
                onChange={(e) => update({ notes: e.target.value })}
                rows={2}
                className={inputClass}
              />
            </label>
          </div>

          {canPrintClaim ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold text-slate-900">Claim batch summary</h2>
                <p className="mt-1 text-sm text-slate-500">Print a cover sheet and line summary for this claim batch.</p>
              </div>
              <button
                type="button"
                onClick={() => void handlePrintClaimBatch()}
                className="rounded-lg border border-[#d4147a] bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
              >
                Print claim batch
              </button>
              <button
                type="button"
                disabled={pdfBusy}
                onClick={() => void handleDownloadPdf()}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pdfBusy ? "Generating PDF…" : "Download PDF"}
              </button>
            </div>
          ) : null}
          {printError ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{printError}</p>
          ) : null}

          <ClaimValidationPanel lines={record.lines} claimStatus={record.status} />

          <ClaimGatewayPanel
            claim={record}
            client={client}
            products={data.products}
            validationCtx={ctx}
            canSubmit={canEdit}
            actorName={session?.displayName || "SuperUser"}
            onSubmitted={(next) => {
              data.upsertClaim(next);
              setDraft(null);
              setDirty(false);
              setSaveError("");
            }}
          />

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
