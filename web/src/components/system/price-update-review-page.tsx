"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useData } from "@/lib/data-store";
import { persistRecordAudit } from "@/lib/audit-mutation";
import { formatAuditDateTime } from "@/lib/audit";
import type { NdisPriceImportBatch } from "@/lib/ndis-price-import";
import {
  PRICE_UPDATE_CLASSIFICATION_LABELS,
  entityHref,
  type PriceUpdateImpact,
  type PriceUpdateRun,
} from "@/lib/price-update";
import {
  analysePriceUpdateRun,
  applyApprovedPriceUpdates,
  approveSafeImpacts,
  buildVariationTaskPartial,
  canApplyImpact,
  createEmptyRun,
  impactsToCsv,
  unresolvedImpactCount,
} from "@/lib/price-update-engine";
import { useSystemAuthOptional } from "@/lib/system-auth-store";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchNdisPriceImportBatches,
  fetchNdisPriceImportRows,
  fetchPriceUpdateImpacts,
  fetchPriceUpdateRuns,
  savePriceUpdateRun,
} from "@/lib/supabase/data-api";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function badge(text: string, tone: string) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>{text}</span>
  );
}

function classificationBadge(classification: string) {
  const tones: Record<string, string> = {
    safe_auto_update: "bg-emerald-100 text-emerald-800",
    review_required: "bg-sky-100 text-sky-800",
    consent_required: "bg-amber-100 text-amber-900",
    protected: "bg-slate-100 text-slate-700",
    no_action: "bg-slate-100 text-slate-600",
    blocked: "bg-rose-100 text-rose-800",
  };
  return badge(
    PRICE_UPDATE_CLASSIFICATION_LABELS[classification as keyof typeof PRICE_UPDATE_CLASSIFICATION_LABELS] ?? classification,
    tones[classification] ?? "bg-slate-100 text-slate-700"
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900">{value.toLocaleString()}</p>
    </div>
  );
}

export function PriceUpdateReviewView() {
  const systemAuth = useSystemAuthOptional();
  const {
    products,
    priceLists,
    serviceAgreements,
    serviceBookings,
    clients,
    monthlyServicePlans,
    claims,
    invoices,
    upsertServiceAgreement,
    upsertServiceBooking,
    upsertMonthlyServicePlan,
    upsertClaim,
    upsertInvoice,
    addTask,
  } = useData();

  const actorName = systemAuth?.session?.displayName ?? systemAuth?.session?.username ?? "System operator";
  const actorUserId = systemAuth?.session?.userId ?? "";
  const hasPageAccess = Boolean(systemAuth?.session);

  const [importBatches, setImportBatches] = useState<NdisPriceImportBatch[]>([]);
  const [runHistory, setRunHistory] = useState<PriceUpdateRun[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [run, setRun] = useState<PriceUpdateRun | null>(null);
  const [impacts, setImpacts] = useState<PriceUpdateImpact[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmApply, setConfirmApply] = useState(false);
  const [filterClass, setFilterClass] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedImpactId, setSelectedImpactId] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [ignoreReason, setIgnoreReason] = useState("");

  const appliedBatches = useMemo(
    () => importBatches.filter((batch) => batch.status === "applied"),
    [importBatches]
  );
  const selectedBatch = appliedBatches.find((batch) => batch.id === selectedBatchId);

  const filteredImpacts = useMemo(() => {
    return impacts.filter((impact) => {
      if (filterClass !== "all" && impact.classification !== filterClass) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        impact.recordLabel.toLowerCase().includes(q) ||
        impact.clientName.toLowerCase().includes(q) ||
        impact.supportItemNumber.toLowerCase().includes(q)
      );
    });
  }, [impacts, filterClass, search]);

  const selectedImpact = impacts.find((impact) => impact.id === selectedImpactId) ?? filteredImpacts[0];
  const applyEligibleCount = impacts.filter((impact) => canApplyImpact(impact)).length;
  const unresolved = unresolvedImpactCount(impacts);

  const loadMeta = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      const [batches, runs] = await Promise.all([
        fetchNdisPriceImportBatches(supabase),
        fetchPriceUpdateRuns(supabase),
      ]);
      setImportBatches(batches);
      setRunHistory(runs);
    } catch {
      // local-only
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  async function persistRun(nextRun: PriceUpdateRun, nextImpacts: PriceUpdateImpact[], isCreate: boolean) {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await savePriceUpdateRun(supabase, nextRun, nextImpacts);
      await loadMeta();
    }
    persistRecordAudit(
      "price-update-run",
      { ...nextRun, createdBy: nextRun.createdBy, updatedBy: actorName, createdAt: nextRun.createdAt, updatedAt: new Date().toISOString() },
      isCreate
    );
  }

  async function onAnalyse() {
    if (!selectedBatch || busy) return;
    setBusy("Analysing impacts…");
    setError("");
    setMessage("");
    try {
      let importRows: Awaited<ReturnType<typeof fetchNdisPriceImportRows>> = [];
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        importRows = await fetchNdisPriceImportRows(supabase, selectedBatch.id);
      }
      const draftRun = createEmptyRun(selectedBatch, actorName);
      const result = analysePriceUpdateRun(draftRun, {
        batch: selectedBatch,
        importRows,
        products,
        priceLists,
        serviceAgreements,
        serviceBookings,
        clients,
        monthlyServicePlans,
        claims,
        invoices,
        actorName,
      });
      setRun(result.run);
      setImpacts(result.impacts);
      await persistRun(result.run, result.impacts, true);
      setMessage(
        `Analysis complete — ${result.impacts.length} impacted row(s) from ${result.run.scannedCount.toLocaleString()} scanned records.`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed.");
    } finally {
      setBusy("");
    }
  }

  async function loadRun(runId: string) {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const history = await fetchPriceUpdateRuns(supabase);
    const found = history.find((entry) => entry.id === runId);
    if (!found) return;
    const rows = await fetchPriceUpdateImpacts(supabase, runId);
    setRun(found);
    setImpacts(rows);
    setSelectedBatchId(found.sourceImportBatchId);
  }

  async function saveCurrentState(nextImpacts = impacts, nextRun = run) {
    if (!nextRun) return;
    setImpacts(nextImpacts);
    await persistRun(nextRun, nextImpacts, false);
  }

  function onApproveSelected() {
    if (!selectedImpact || !run) return;
    const next = impacts.map((impact) =>
      impact.id === selectedImpact.id
        ? {
            ...impact,
            decision: "approved" as const,
            approvedBy: actorName,
            approvedAt: new Date().toISOString(),
            evidenceRef: impact.classification === "consent_required" ? evidenceRef : impact.evidenceRef,
          }
        : impact
    );
    void saveCurrentState(next, run);
    setMessage(`Approved ${selectedImpact.recordLabel} for apply.`);
  }

  function onIgnoreSelected() {
    if (!selectedImpact || !ignoreReason.trim() || !run) return;
    const next = impacts.map((impact) =>
      impact.id === selectedImpact.id
        ? {
            ...impact,
            decision: "ignored" as const,
            decisionReason: ignoreReason.trim(),
            applyStatus: "skipped" as const,
            applyMessage: ignoreReason.trim(),
          }
        : impact
    );
    void saveCurrentState(next, run);
    setIgnoreReason("");
    setMessage(`Ignored ${selectedImpact.recordLabel}.`);
  }

  function onApproveAllSafe() {
    if (!run) return;
    const next = approveSafeImpacts(impacts);
    void saveCurrentState(next, run);
    setMessage("All safe auto-update rows marked approved.");
  }

  function onCreateTask() {
    if (!selectedImpact || !run) return;
    const task = addTask(buildVariationTaskPartial(selectedImpact, actorUserId, actorName));
    const next = impacts.map((impact) => (impact.id === selectedImpact.id ? { ...impact, taskId: task.id } : impact));
    void saveCurrentState(next, run);
    setMessage(`Variation task ${task.documentNo} created.`);
  }

  async function onApplyApproved() {
    if (!run || !confirmApply || busy || applyEligibleCount === 0) return;
    setBusy("Applying approved updates…");
    setError("");
    try {
      let importRows: Awaited<ReturnType<typeof fetchNdisPriceImportRows>> = [];
      if (selectedBatch && isSupabaseConfigured()) {
        importRows = await fetchNdisPriceImportRows(createClient(), selectedBatch.id);
      }
      const result = applyApprovedPriceUpdates({
        run,
        impacts,
        batch: selectedBatch!,
        importRows,
        products,
        priceLists,
        serviceAgreements,
        serviceBookings,
        clients,
        monthlyServicePlans,
        claims,
        invoices,
        actorName,
      });

      result.changedAgreementIds.forEach((id) => {
        const record = result.serviceAgreements.find((entry) => entry.id === id);
        if (record) upsertServiceAgreement(record);
      });
      result.changedBookingIds.forEach((id) => {
        const record = result.serviceBookings.find((entry) => entry.id === id);
        if (record) upsertServiceBooking(record);
      });
      result.changedMonthlyPlanIds.forEach((id) => {
        const record = result.monthlyServicePlans.find((entry) => entry.id === id);
        if (record) upsertMonthlyServicePlan(record);
      });
      result.changedClaimIds.forEach((id) => {
        const record = result.claims.find((entry) => entry.id === id);
        if (record) upsertClaim(record);
      });
      result.changedInvoiceIds.forEach((id) => {
        const record = result.invoices.find((entry) => entry.id === id);
        if (record) upsertInvoice(record);
      });

      setRun(result.run);
      setImpacts(result.impacts);
      await persistRun(result.run, result.impacts, false);
      setConfirmApply(false);
      setMessage(`Applied ${result.run.appliedCount} update(s). ${unresolvedImpactCount(result.impacts)} item(s) remain unresolved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Apply failed.");
    } finally {
      setBusy("");
    }
  }

  function onExportCsv() {
    const blob = new Blob([impactsToCsv(impacts)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `price-update-impacts-${run?.id ?? "export"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function onCloseRun() {
    if (!run || unresolved > 0) return;
    const closed: PriceUpdateRun = {
      ...run,
      status: "closed",
      closedBy: actorName,
      closedAt: new Date().toISOString(),
    };
    setRun(closed);
    await persistRun(closed, impacts, false);
    setMessage("Update run closed — all impacts resolved, ignored, protected, or applied.");
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Price Dependant Updater" audit={{ moduleLabel: "Price Dependant Updater" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to review NDIS price-change impacts.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="Price Dependant Updater"
      subtitle="Review and safely apply NDIS price-guide changes to agreements, bookings, budgets, and billing records."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "Services", href: "/system/services/price-update-review" },
        { label: "Price Dependant Updater" },
      ]}
      audit={{ moduleLabel: "Price Dependant Updater" }}
    >
      <div className="space-y-6">
        <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          This workflow will not update active or signed service agreements unless approval evidence is recorded. Submitted claims and issued invoices are protected. Historical service dates before the effective start are not repriced.
        </section>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="status">
            {message}
          </div>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Source import batch</h2>
          <p className="mt-1 text-sm text-slate-500">Select a completed AB-0011 import batch, then run dry-run impact analysis.</p>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Import batch</span>
              <select
                className={inputClass}
                value={selectedBatchId}
                onChange={(event) => {
                  setSelectedBatchId(event.target.value);
                  setRun(null);
                  setImpacts([]);
                }}
              >
                <option value="">Select applied import…</option>
                {appliedBatches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.guideYear} — {batch.sourceFileName} ({formatAuditDateTime(batch.appliedAt || batch.importedAt)})
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!selectedBatchId || Boolean(busy)}
              onClick={() => void onAnalyse()}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Run impact analysis
            </button>
            {selectedBatch ? (
              <p className="text-xs text-slate-500">
                Guide {selectedBatch.guideYear} · +{selectedBatch.addCount} / ~{selectedBatch.updateCount} from import
              </p>
            ) : null}
          </div>
        </section>

        {run ? (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-900">Impact summary</h2>
                {badge(run.status, "bg-slate-100 text-slate-700")}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
                <Metric label="Scanned" value={run.scannedCount} />
                <Metric label="Impacts" value={run.impactCount} />
                <Metric label="Safe auto-update" value={run.safeCount} />
                <Metric label="Review required" value={run.reviewCount} />
                <Metric label="Consent required" value={run.consentCount} />
                <Metric label="Protected" value={run.protectedCount} />
              </div>
              <p className="mt-3 text-sm text-slate-600">
                Effective from {run.effectiveStart || "—"} · {unresolved.toLocaleString()} unresolved · {applyEligibleCount.toLocaleString()} ready to apply
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={onApproveAllSafe}>
                  Approve all safe rows
                </button>
                <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={onExportCsv} disabled={!impacts.length}>
                  Export impact CSV
                </button>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-900">Impact table</h2>
                  <div className="flex flex-wrap gap-2">
                    <select className={inputClass} value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
                      <option value="all">All classifications</option>
                      <option value="safe_auto_update">Safe auto-update</option>
                      <option value="review_required">Review required</option>
                      <option value="consent_required">Consent required</option>
                      <option value="protected">Protected</option>
                    </select>
                    <input className={inputClass} placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-2 py-2">Type</th>
                        <th className="px-2 py-2">Client</th>
                        <th className="px-2 py-2">Record</th>
                        <th className="px-2 py-2">Old → New</th>
                        <th className="px-2 py-2">Class</th>
                        <th className="px-2 py-2">Decision</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredImpacts.slice(0, 150).map((impact) => (
                        <tr
                          key={impact.id}
                          className={`border-b border-slate-100 cursor-pointer ${selectedImpact?.id === impact.id ? "bg-pink-50" : ""}`}
                          onClick={() => setSelectedImpactId(impact.id)}
                        >
                          <td className="px-2 py-2">{impact.entityType.replace(/-/g, " ")}</td>
                          <td className="px-2 py-2">{impact.clientName || "—"}</td>
                          <td className="px-2 py-2">
                            <Link href={entityHref(impact.entityType, impact.entityId)} className="text-[#d4147a] underline">
                              {impact.recordLabel}
                            </Link>
                          </td>
                          <td className="px-2 py-2 font-mono text-xs">
                            {impact.oldPrice?.toFixed(2) ?? "—"} → {impact.newPrice?.toFixed(2) ?? "—"}
                          </td>
                          <td className="px-2 py-2">{classificationBadge(impact.classification)}</td>
                          <td className="px-2 py-2">{impact.decision}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-semibold text-slate-900">Decision panel</h2>
                {selectedImpact ? (
                  <div className="mt-3 space-y-3 text-sm">
                    <p className="font-medium text-slate-900">{selectedImpact.recordLabel}</p>
                    <p className="text-slate-600">{selectedImpact.recommendedAction}</p>
                    <p>
                      Status: {selectedImpact.recordStatus} · Item {selectedImpact.supportItemNumber} · effective {selectedImpact.effectiveStart}
                    </p>
                    {selectedImpact.classification === "consent_required" ? (
                      <label className="block">
                        <span className="text-xs text-slate-500">Consent / variation evidence ref</span>
                        <input
                          className={`${inputClass} mt-1 w-full`}
                          value={evidenceRef}
                          onChange={(e) => setEvidenceRef(e.target.value)}
                          placeholder="e.g. variation note REQ-1234"
                        />
                      </label>
                    ) : null}
                    <div className="flex flex-wrap gap-2">
                      <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={onApproveSelected}>
                        Approve for apply
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border px-3 py-1.5 text-sm"
                        onClick={onCreateTask}
                        disabled={!["consent_required", "review_required"].includes(selectedImpact.classification)}
                      >
                        Create variation task
                      </button>
                    </div>
                    <label className="block">
                      <span className="text-xs text-slate-500">Ignore with reason</span>
                      <input
                        className={`${inputClass} mt-1 w-full`}
                        value={ignoreReason}
                        onChange={(e) => setIgnoreReason(e.target.value)}
                        placeholder="Provider does not deliver this item"
                      />
                    </label>
                    <button type="button" className="rounded-lg border px-3 py-1.5 text-sm" onClick={onIgnoreSelected}>
                      Mark ignored
                    </button>
                    {selectedImpact.taskId ? (
                      <p className="text-xs text-slate-500">Linked task: {selectedImpact.taskId}</p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Select an impact row to review.</p>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Apply approved updates</h2>
              <p className="mt-1 text-sm text-slate-500">
                {applyEligibleCount.toLocaleString()} row(s) eligible. Plan budget funding totals are never changed automatically.
              </p>
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={confirmApply} onChange={(e) => setConfirmApply(e.target.checked)} className="mt-1" />
                <span>
                  I confirm only approved or safe rows will be updated from the effective date. Active/signed agreements require evidence; protected billing records will not change.
                </span>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!confirmApply || applyEligibleCount === 0 || Boolean(busy)}
                  onClick={() => void onApplyApproved()}
                  className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  Apply approved updates
                </button>
                <button
                  type="button"
                  disabled={unresolved > 0}
                  onClick={() => void onCloseRun()}
                  className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50"
                >
                  Close run
                </button>
              </div>
            </section>
          </>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Run history</h2>
          {runHistory.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600">No price update runs yet.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
              {runHistory.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 py-2">
                  <span>
                    {entry.guideYear} · {entry.impactCount} impacts · {entry.status} · {formatAuditDateTime(entry.createdAt)}
                  </span>
                  <button type="button" className="rounded border px-2 py-1 text-xs" onClick={() => void loadRun(entry.id)}>
                    Open
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </SystemShell>
  );
}
