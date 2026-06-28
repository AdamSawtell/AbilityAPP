"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { useData } from "@/lib/data-store";
import { persistRecordAudit } from "@/lib/audit-mutation";
import { formatAuditDateTime } from "@/lib/audit";
import { useSystemAuthOptional } from "@/lib/system-auth-store";
import {
  applyNdisPriceImport,
  guideYearForFormat,
  ndisImportHandoffRows,
  previewNdisPriceImport,
  revertNdisPriceImport,
  type NdisPriceImportPreview,
} from "@/lib/ndis-price-import-engine";
import type { NdisPriceImportBatch, NdisPriceImportRow } from "@/lib/ndis-price-import";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  fetchNdisPriceImportBatches,
  fetchNdisPriceImportRows,
  saveNdisPriceImportBatch,
  savePriceList,
  savePriceListHeader,
  saveProduct,
} from "@/lib/supabase/data-api";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

// Supabase/PostgREST errors are plain objects, not Error instances, so a bare
// `instanceof Error` check hides the real cause behind a generic fallback.
function describeError(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const record = err as { message?: unknown; details?: unknown; hint?: unknown };
    const parts = [record.message, record.details, record.hint]
      .filter((part): part is string => typeof part === "string" && part.length > 0);
    if (parts.length) return parts.join(" — ");
  }
  return fallback;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    validated: "bg-sky-100 text-sky-800",
    applied: "bg-emerald-100 text-emerald-800",
    reverted: "bg-amber-100 text-amber-900",
    error: "bg-rose-100 text-rose-800",
    valid: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-900",
    skipped: "bg-slate-100 text-slate-600",
  };
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
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

export function NdisPriceImporterView() {
  const systemAuth = useSystemAuthOptional();
  const { products, priceLists, upsertProduct, upsertPriceList } = useData();
  const actorName = systemAuth?.session?.displayName ?? systemAuth?.session?.username ?? "System operator";
  const hasPageAccess = Boolean(systemAuth?.session);

  const [history, setHistory] = useState<NdisPriceImportBatch[]>([]);
  const [historyRows, setHistoryRows] = useState<NdisPriceImportRow[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [preview, setPreview] = useState<NdisPriceImportPreview | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [confirmApply, setConfirmApply] = useState(false);
  const [rowFilter, setRowFilter] = useState("all");
  const [rowSearch, setRowSearch] = useState("");

  const activeGuide = useMemo(() => {
    const applied = history.filter((batch) => batch.status === "applied");
    const latest = applied[0];
    if (!latest) return null;
    const list = priceLists.find((entry) => entry.guideYear === latest.guideYear);
    return { batch: latest, list, productCount: products.filter((p) => p.ndisSupportItem).length };
  }, [history, priceLists, products]);

  const filteredPreviewRows = useMemo(() => {
    if (!preview) return [];
    return preview.rows.filter((row) => {
      if (rowFilter !== "all" && row.status !== rowFilter && row.action !== rowFilter) return false;
      if (!rowSearch.trim()) return true;
      const q = rowSearch.trim().toLowerCase();
      return (
        row.supportItemNumber.toLowerCase().includes(q) ||
        row.message.toLowerCase().includes(q) ||
        (row.normalized?.supportItemName.toLowerCase().includes(q) ?? false)
      );
    });
  }, [preview, rowFilter, rowSearch]);

  const loadHistory = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    try {
      const supabase = createClient();
      const batches = await fetchNdisPriceImportBatches(supabase);
      setHistory(batches);
    } catch {
      // Local-only mode keeps empty history until batches are saved remotely.
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!selectedBatchId || !isSupabaseConfigured()) {
      setHistoryRows([]);
      return;
    }
    void (async () => {
      try {
        const supabase = createClient();
        const rows = await fetchNdisPriceImportRows(supabase, selectedBatchId);
        setHistoryRows(rows);
      } catch {
        setHistoryRows([]);
      }
    })();
  }, [selectedBatchId]);

  async function onFileSelected(file: File | null) {
    setError("");
    setMessage("");
    setConfirmApply(false);
    setPreview(null);
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Upload a CSV file from the NDIS Price Guides folder.");
      return;
    }
    setBusy("Validating file…");
    try {
      const csvText = await file.text();
      const result = previewNdisPriceImport({
        csvText,
        fileName: file.name,
        actorName,
        products,
        priceLists,
      });
      setPreview(result);
      if (result.batch.status === "error") {
        setError(result.batch.warnings[0] ?? "Could not validate this file.");
      } else {
        setMessage(
          `Detected ${result.format.replace(/-/g, " ")} format for guide ${result.batch.guideYear || guideYearForFormat(result.format) || "unknown"}.`
        );
      }
    } catch (err) {
      setError(describeError(err, "Could not read the uploaded file."));
    } finally {
      setBusy("");
    }
  }

  async function onApplyPreview() {
    if (!preview || !preview.canApply || !confirmApply || busy) return;
    const snapshot = preview;
    setPreview(null);
    setConfirmApply(false);
    setBusy("Applying import…");
    setError("");
    try {
      const applied = applyNdisPriceImport({
        batch: snapshot.batch,
        rows: snapshot.rows,
        products,
        priceLists,
        actorName,
      });

      const changedLists = applied.changedPriceListIds
        .map((id) => applied.priceLists.find((entry) => entry.id === id))
        .filter((list): list is NonNullable<typeof list> => Boolean(list));
      const changedProducts = applied.changedProductIds
        .map((id) => applied.products.find((entry) => entry.id === id))
        .filter((product): product is NonNullable<typeof product> => Boolean(product));

      const batchRecord = {
        ...applied.batch,
        createdBy: applied.batch.importedBy,
        updatedBy: actorName,
        createdAt: applied.batch.importedAt,
        updatedAt: new Date().toISOString(),
      } as NdisPriceImportBatch & { createdBy: string; updatedBy: string; createdAt: string; updatedAt: string };

      // Persist remotely in foreign-key order so every child reference resolves.
      // product.price_list_id and price_list_line.product_id form a cycle, so the
      // price list header is written before products and its lines after:
      //   1. ndis_price_import_batch — parent of price lists and import rows
      //   2. price_list (header)     — references source_import_batch_id
      //   3. product                 — references price_list_id; rows reference it
      //   4. price_list (with lines) — lines reference product_id
      //   5. ndis_price_import_row   — references batch_id and matched_product_id
      // The batch is saved first without its rows, then re-saved with rows once
      // the matched products exist, otherwise matched_product_id violates its FK.
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        // Write the batch with a non-terminal status first so a mid-sequence
        // failure never leaves an "applied" batch with missing products, price
        // list lines, or import rows. The terminal status + rows are only
        // committed in the final save once every child write has succeeded.
        await saveNdisPriceImportBatch(supabase, { ...batchRecord, status: "validated" }, []);
        for (const list of changedLists) {
          await savePriceListHeader(supabase, list);
        }
        for (const product of changedProducts) {
          await saveProduct(supabase, product);
        }
        for (const list of changedLists) {
          await savePriceList(supabase, list);
        }
        await saveNdisPriceImportBatch(supabase, batchRecord, applied.rows);
        await loadHistory();
      }
      persistRecordAudit("ndis-price-import-batch", batchRecord, true);

      changedLists.forEach((list) => upsertPriceList(list));
      changedProducts.forEach((product) => upsertProduct(product));
      const handoffCount = ndisImportHandoffRows(applied.rows).length;
      setMessage(
        applied.batch.status === "applied"
          ? `Import applied — ${applied.batch.addCount} new, ${applied.batch.updateCount} updated, ${applied.batch.unchangedCount} unchanged. ${handoffCount} rows ready for review in the Price Dependant Updater.`
          : `Import finished with errors — review import history. ${applied.batch.errorCount} row(s) failed during apply.`
      );
    } catch (err) {
      setError(describeError(err, "Apply failed."));
    } finally {
      setBusy("");
    }
  }

  async function onRevertBatch(batch: NdisPriceImportBatch) {
    if (batch.status !== "applied" || busy) return;
    setBusy("Reverting batch…");
    setError("");
    try {
      let rowsForBatch: NdisPriceImportRow[] = [];
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        rowsForBatch = await fetchNdisPriceImportRows(supabase, batch.id);
      } else if (selectedBatchId === batch.id) {
        rowsForBatch = historyRows;
      }

      const reverted = revertNdisPriceImport({ batch, products, priceLists, actorName });
      reverted.products.forEach((product) => {
        const before = products.find((entry) => entry.id === product.id);
        if (before && JSON.stringify(before) !== JSON.stringify(product)) {
          upsertProduct(product);
        }
      });
      reverted.priceLists.forEach((list) => {
        const before = priceLists.find((entry) => entry.id === list.id);
        if (before && JSON.stringify(before) !== JSON.stringify(list)) {
          upsertPriceList(list);
        }
      });
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await saveNdisPriceImportBatch(supabase, reverted.batch, rowsForBatch);
        await loadHistory();
      }
      persistRecordAudit(
        "ndis-price-import-batch",
        {
          ...reverted.batch,
          createdBy: reverted.batch.importedBy,
          updatedBy: actorName,
          createdAt: reverted.batch.importedAt,
          updatedAt: new Date().toISOString(),
        },
        false,
        {
          ...batch,
          createdBy: batch.importedBy,
          updatedBy: actorName,
          createdAt: batch.importedAt,
          updatedAt: batch.importedAt,
        },
        {
          action: "updated",
          summary: "NDIS price import batch reverted",
        }
      );
      setMessage(`Batch ${batch.sourceFileName} marked reverted. Lines and products from this batch were deactivated.`);
    } catch (err) {
      setError(describeError(err, "Revert failed."));
    } finally {
      setBusy("");
    }
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="NDIS Price Guide Importer" audit={{ moduleLabel: "NDIS Price Guide Importer" }}>
        <p className="text-sm text-slate-600">Sign in to System setup to import NDIS price guide files.</p>
      </SystemShell>
    );
  }

  return (
    <SystemShell
      title="NDIS Price Guide Importer"
      subtitle="Upload NDIS support catalogue CSV files, preview impact, and apply master product and price list updates."
      breadcrumbs={[
        { label: "System", href: "/system" },
        { label: "Services", href: "/system/services/ndis-price-importer" },
        { label: "NDIS Price Guide Importer" },
      ]}
      audit={{ moduleLabel: "NDIS Price Guide Importer" }}
    >
      <div className="space-y-6">
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
          <h2 className="text-base font-semibold text-slate-900">Current pricing status</h2>
          <p className="mt-1 text-sm text-slate-500">
            Master NDIS products and price lists only — service agreements, bookings, claims, and invoices are not changed by this importer.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            <div>
              <dt className="text-xs text-slate-500">NDIS products in catalogue</dt>
              <dd className="font-medium text-slate-900">{products.filter((p) => p.ndisSupportItem).length}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">NDIS price lists</dt>
              <dd className="font-medium text-slate-900">{priceLists.filter((l) => l.schema === "NDIS").length}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Latest applied guide</dt>
              <dd className="font-medium text-slate-900">{activeGuide?.batch.guideYear ?? "None yet"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Latest import</dt>
              <dd className="font-medium text-slate-900">
                {activeGuide ? formatAuditDateTime(activeGuide.batch.appliedAt || activeGuide.batch.importedAt) : "—"}
              </dd>
            </div>
          </dl>
          {!activeGuide ? (
            <p className="mt-4 text-sm text-slate-600">
              No NDIS price guide imported yet. Import the 2025–26 baseline CSV first, then the 2026–27 update file.
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Upload import file</h2>
          <p className="mt-1 text-sm text-slate-500">
            Supported shapes: 2025–26 wide or long catalogue, 2026–27 system update or long schedule, and the AbilityVua template. Maximum file size 5 MB.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept=".csv,text/ccsv"
              className={inputClass}
              disabled={Boolean(busy)}
              onChange={(event) => void onFileSelected(event.target.files?.[0] ?? null)}
            />
            {busy ? <span className="text-sm text-slate-500">{busy}</span> : null}
          </div>
        </section>

        {preview ? (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Validation preview</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {preview.batch.sourceFileName} · {preview.format.replace(/-/g, " ")} · guide {preview.batch.guideYear}
                  </p>
                </div>
                {statusBadge(preview.batch.status)}
              </div>
              {preview.batch.warnings.length ? (
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {preview.batch.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                <Metric label="Rows" value={preview.batch.rowCount} />
                <Metric label="New items" value={preview.batch.addCount} />
                <Metric label="Updates" value={preview.batch.updateCount} />
                <Metric label="Unchanged" value={preview.batch.unchangedCount} />
                <Metric label="Skipped" value={preview.batch.skippedCount} />
                <Metric label="Warnings" value={preview.batch.warningCount} />
                <Metric label="Errors" value={preview.batch.errorCount} />
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Row review</h2>
                  <p className="mt-1 text-sm text-slate-500">Filter by status or search support item number and message.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <select className={inputClass} value={rowFilter} onChange={(event) => setRowFilter(event.target.value)}>
                    <option value="all">All rows</option>
                    <option value="valid">Valid</option>
                    <option value="warning">Warnings</option>
                    <option value="error">Errors</option>
                    <option value="add_new_item">New items</option>
                    <option value="update_existing_item">Updates</option>
                    <option value="unchanged">Unchanged</option>
                  </select>
                  <input
                    className={inputClass}
                    placeholder="Search rows…"
                    value={rowSearch}
                    onChange={(event) => setRowSearch(event.target.value)}
                  />
                </div>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Support item</th>
                      <th className="px-2 py-2">Region</th>
                      <th className="px-2 py-2">Action</th>
                      <th className="px-2 py-2">Status</th>
                      <th className="px-2 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPreviewRows.slice(0, 200).map((row) => (
                      <tr key={row.id} className="border-b border-slate-100">
                        <td className="px-2 py-2 text-slate-500">{row.rowNo}</td>
                        <td className="px-2 py-2 font-mono text-xs">{row.supportItemNumber}</td>
                        <td className="px-2 py-2">{row.normalized?.region ?? "—"}</td>
                        <td className="px-2 py-2">{row.action.replace(/_/g, " ")}</td>
                        <td className="px-2 py-2">{statusBadge(row.status)}</td>
                        <td className="px-2 py-2 text-slate-600">{row.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredPreviewRows.length > 200 ? (
                  <p className="mt-2 text-xs text-slate-500">Showing first 200 of {filteredPreviewRows.length.toLocaleString()} rows.</p>
                ) : null}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Apply import</h2>
              <p className="mt-1 text-sm text-slate-500">
                Applying updates master products and price list lines only. Existing historical price windows are preserved; new windows are appended.
              </p>
              <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={confirmApply}
                  disabled={!preview.canApply}
                  onChange={(event) => setConfirmApply(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  I confirm this file is the correct NDIS guide, I have reviewed the preview counts, and I understand master pricing records will be updated.
                </span>
              </label>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!preview.canApply || !confirmApply || Boolean(busy)}
                  onClick={() => void onApplyPreview()}
                  className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply import
                </button>
                <button
                  type="button"
                  className="rounded-lg border px-4 py-2 text-sm"
                  onClick={() => {
                    setPreview(null);
                    setConfirmApply(false);
                  }}
                >
                  Discard preview
                </button>
              </div>
              {!preview.canApply ? (
                <p className="mt-3 text-sm text-rose-700">Apply is blocked until all row errors are resolved.</p>
              ) : null}
            </section>
          </>
        ) : null}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Import history</h2>
          <p className="mt-1 text-sm text-slate-500">Previous batches with status, counts, and revert for applied imports.</p>
          {history.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600">No import batches recorded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2">File</th>
                    <th className="px-2 py-2">Guide</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Imported</th>
                    <th className="px-2 py-2">Counts</th>
                    <th className="px-2 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((batch) => (
                    <tr key={batch.id} className="border-b border-slate-100">
                      <td className="px-2 py-2">{batch.sourceFileName}</td>
                      <td className="px-2 py-2">{batch.guideYear}</td>
                      <td className="px-2 py-2">{statusBadge(batch.status)}</td>
                      <td className="px-2 py-2">{formatAuditDateTime(batch.importedAt)}</td>
                      <td className="px-2 py-2 text-xs text-slate-600">
                        +{batch.addCount} · ~{batch.updateCount} · ={batch.unchangedCount} · !{batch.errorCount}
                      </td>
                      <td className="px-2 py-2">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded border px-2 py-1 text-xs"
                            onClick={() => setSelectedBatchId(batch.id)}
                          >
                            View rows
                          </button>
                          {batch.status === "applied" ? (
                            <button
                              type="button"
                              className="rounded border px-2 py-1 text-xs text-amber-900"
                              disabled={Boolean(busy)}
                              onClick={() => void onRevertBatch(batch)}
                            >
                              Revert
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {selectedBatchId && historyRows.length ? (
            <p className="mt-3 text-sm text-slate-600">{historyRows.length.toLocaleString()} rows loaded for selected batch.</p>
          ) : null}
          {activeGuide?.batch.status === "applied" ? (
            <p className="mt-4 text-sm text-slate-600">
              Next:{" "}
              <Link href="/system/services/price-update-review" className="text-[#d4147a] underline">
                Review dependent price updates (Price Dependant Updater)
              </Link>
            </p>
          ) : null}
        </section>
      </div>
    </SystemShell>
  );
}
