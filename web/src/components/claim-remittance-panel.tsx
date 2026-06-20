"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { downloadCsv } from "@/lib/reports/export";
import {
  createRemittance,
  matchRemittanceLines,
  normalizeRemittance,
  parseRemittanceCsv,
  REMITTANCE_CSV_HEADERS,
  remittanceCsvTemplateFromClaims,
  remittanceStatusClass,
  type ClaimRemittanceRecord,
} from "@/lib/claim-remittance";

const matchTone: Record<string, string> = {
  Matched: "bg-emerald-100 text-emerald-950",
  Variance: "bg-amber-100 text-amber-950",
  Unmatched: "bg-rose-100 text-rose-950",
  Pending: "bg-slate-100 text-slate-700",
};

export function ClaimRemittancePanel() {
  const { claims, clients, claimRemittances, applyClaimRemittance } = useData();
  const { session, canWriteWindow } = useAuth();
  const canImport = canWriteWindow("claims");
  const actor = session?.displayName || "SuperUser";

  const [csvText, setCsvText] = useState("");
  const [sourceFilename, setSourceFilename] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [remittanceDate, setRemittanceDate] = useState("");
  const [preview, setPreview] = useState<ClaimRemittanceRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submittedClaims = useMemo(
    () => claims.filter((c) => c.gatewayRef?.trim() && (c.status === "Submitted" || c.gatewayStatus === "Submitted")),
    [claims]
  );

  const digest = useMemo(() => {
    const matched = claims.filter((c) => c.remittanceStatus === "Matched").length;
    const variance = claims.filter((c) => c.remittanceStatus === "Variance").length;
    const paid = claims.reduce((sum, c) => sum + (c.remittancePaidAmount || 0), 0);
    return { matched, variance, paid, imports: claimRemittances.length };
  }, [claims, claimRemittances.length]);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setSourceFilename(file.name);
    setCsvText(await file.text());
    setPreview(null);
    setError("");
    setMessage("");
  };

  const handlePreview = () => {
    setError("");
    setMessage("");
    const parsed = parseRemittanceCsv(csvText);
    if (parsed.error) {
      setError(parsed.error);
      setPreview(null);
      return;
    }
    const matchedLines = matchRemittanceLines(parsed.lines, claims, clients);
    const draft = createRemittance(
      {
        sourceFilename: sourceFilename || "pasted.csv",
        paymentReference: paymentReference || parsed.paymentReference,
        remittanceDate,
        lines: matchedLines,
        createdBy: actor,
        updatedBy: actor,
      },
      claimRemittances
    );
    setPreview(normalizeRemittance(draft));
    if (!paymentReference && parsed.paymentReference) {
      setPaymentReference(parsed.paymentReference);
    }
  };

  const handleDownloadTemplate = () => {
    const content = remittanceCsvTemplateFromClaims(claims, clients);
    downloadCsv("ndis-remittance-template.csv", content);
  };

  const handleApply = () => {
    if (!preview) {
      setError("Preview matches before applying.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { remittance, updatedClaims } = applyClaimRemittance(
        normalizeRemittance({
          ...preview,
          paymentReference: paymentReference || preview.paymentReference,
          remittanceDate: remittanceDate || preview.remittanceDate,
          sourceFilename: sourceFilename || preview.sourceFilename,
        }),
        actor
      );
      setMessage(
        `Imported ${remittance.documentNo} — ${remittance.matchedCount} matched, ${remittance.varianceCount} variance, ${remittance.unmatchedCount} unmatched. Updated ${updatedClaims.length} claim${updatedClaims.length === 1 ? "" : "s"}.`
      );
      setCsvText("");
      setPreview(null);
      setSourceFilename("");
      setPaymentReference("");
      setRemittanceDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remittance import failed.");
    } finally {
      setBusy(false);
    }
  };

  if (!canImport) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Remittance import</h2>
          <p className="mt-1 text-sm text-slate-600">
            Import NDIS payment advice CSV from PRODA or the gateway. Lines match submitted claims by gateway ref,
            participant NDIS number, support item, service date, and amount.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          disabled={!submittedClaims.length}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download template
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Claims matched</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.matched}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Variance</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.variance}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Paid recorded</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">${digest.paid.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Import batches</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.imports}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <label className="block text-sm lg:col-span-2">
          <span className="mb-1 block font-medium text-slate-700">Remittance CSV</span>
          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              setPreview(null);
            }}
            rows={6}
            placeholder={`${REMITTANCE_CSV_HEADERS.join(",")}\nGW-123,430000000,01_011_0107_1_1,2025-10-06,120.00,120.00`}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Upload file</span>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Payment reference</span>
          <input
            value={paymentReference}
            onChange={(e) => setPaymentReference(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Remittance date</span>
          <input
            type="date"
            value={remittanceDate}
            onChange={(e) => setRemittanceDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={!csvText.trim() || busy}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Preview matches
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!preview || busy}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Applying…" : "Apply remittance"}
        </button>
      </div>

      {preview ? (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Line</th>
                <th className="px-3 py-2">Gateway ref</th>
                <th className="px-3 py-2">NDIS</th>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Paid</th>
                <th className="px-3 py-2">Match</th>
                <th className="px-3 py-2">Claim</th>
              </tr>
            </thead>
            <tbody>
              {preview.lines.map((line) => {
                const claim = claims.find((c) => c.id === line.claimId);
                return (
                  <tr key={line.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">{line.lineNo}</td>
                    <td className="px-3 py-2 font-mono text-xs">{line.gatewayClaimRef || "—"}</td>
                    <td className="px-3 py-2">{line.participantNdisNumber || "—"}</td>
                    <td className="px-3 py-2">{line.supportItemNumber || "—"}</td>
                    <td className="px-3 py-2">{line.serviceDate || "—"}</td>
                    <td className="px-3 py-2">${line.paidAmount.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${matchTone[line.matchStatus] ?? ""}`}>
                        {line.matchStatus}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {claim ? (
                        <Link href={`/claims/${claim.id}`} className="text-[#b51266] hover:underline">
                          {claim.documentNo}
                        </Link>
                      ) : (
                        <span className="text-slate-500">{line.matchMessage || "—"}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {claimRemittances.length ? (
        <div className="mt-4">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent imports</h3>
          <ul className="mt-2 space-y-1 text-sm text-slate-700">
            {claimRemittances.slice(0, 5).map((batch) => (
              <li key={batch.id} className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{batch.documentNo}</span>
                <span className="text-slate-500">{batch.remittanceDate || batch.sourceFilename}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${remittanceStatusClass("Matched")}`}>
                  {batch.matchedCount} matched
                </span>
                {batch.varianceCount ? (
                  <span className={`rounded-full px-2 py-0.5 text-xs ${remittanceStatusClass("Variance")}`}>
                    {batch.varianceCount} variance
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
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
    </section>
  );
}
