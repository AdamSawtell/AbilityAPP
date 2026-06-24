"use client";

import { useEffect, useState } from "react";
import {
  AgencyPortalGuard,
  AgencyPortalLogoutButton,
} from "@/components/agency-portal/agency-portal-hub-page";
import { AgencyPortalNav, AgencyPortalShell } from "@/components/agency-portal/agency-portal-shell";
import { formatAgencyTimesheetPeriod } from "@/lib/agency-timesheet";
import { formatDisplayDate } from "@/lib/enquiry";
import type { AgencyPortalInvoiceItem, AgencyPortalTimesheetItem } from "@/lib/agency-portal/types";

function formatMoney(value: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(value || 0);
}

const statusTone: Record<string, string> = {
  Submitted: "bg-amber-100 text-amber-900",
  Approved: "bg-emerald-100 text-emerald-800",
  Paid: "bg-sky-100 text-sky-900",
  Rejected: "bg-rose-100 text-rose-900",
};

export function AgencyPortalInvoicesPage() {
  const [invoices, setInvoices] = useState<AgencyPortalInvoiceItem[] | null>(null);
  const [timesheets, setTimesheets] = useState<AgencyPortalTimesheetItem[]>([]);
  const [agencyTimesheetId, setAgencyTimesheetId] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [invRes, tsRes] = await Promise.all([
      fetch("/api/agency-portal/invoices", { credentials: "include" }),
      fetch("/api/agency-portal/timesheets", { credentials: "include" }),
    ]);
    if (invRes.ok) {
      const data = (await invRes.json()) as { invoices: AgencyPortalInvoiceItem[] };
      setInvoices(data.invoices);
    }
    if (tsRes.ok) {
      const data = (await tsRes.json()) as { timesheets: AgencyPortalTimesheetItem[] };
      setTimesheets(data.timesheets.filter((t) => !t.hasInvoice));
    }
  }

  useEffect(() => {
    reload()
      .catch(() => setError("Could not load invoices."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const sheet = timesheets.find((t) => t.id === agencyTimesheetId);
    if (sheet && !amount) setAmount(String(sheet.totalVendorCost));
  }, [agencyTimesheetId, timesheets, amount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invoiceFile) {
      setError("Attach your invoice as a PDF or image before submitting.");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("agencyTimesheetId", agencyTimesheetId);
      formData.set("invoiceNo", invoiceNo);
      formData.set("invoiceDate", invoiceDate);
      formData.set("amount", amount);
      formData.set("notes", notes);
      formData.set("file", invoiceFile);

      const res = await fetch("/api/agency-portal/invoices", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not submit invoice.");
        return;
      }
      setMessage("Invoice submitted. Finance will review in the provider system.");
      setAgencyTimesheetId("");
      setInvoiceNo("");
      setAmount("");
      setNotes("");
      setInvoiceFile(null);
      await reload();
    } catch {
      setError("Could not submit invoice.");
    } finally {
      setSubmitting(false);
    }
  }

  async function openInvoiceDocument(invoiceId: string) {
    try {
      const res = await fetch(`/api/agency-portal/invoices/${invoiceId}/document`, { credentials: "include" });
      const data = (await res.json()) as { signedUrl?: string; error?: string };
      if (!res.ok || !data.signedUrl) {
        setError(data.error ?? "Could not open invoice document.");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch {
      setError("Could not open invoice document.");
    }
  }

  return (
    <AgencyPortalGuard>
      {() => (
        <AgencyPortalShell
          title="Invoices"
          subtitle="Submit invoices against approved agency timesheets"
          actions={<AgencyPortalLogoutButton />}
        >
          <AgencyPortalNav active="invoices" />

          {timesheets.length > 0 ? (
            <form onSubmit={handleSubmit} className="mb-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-800">Submit invoice</h2>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Approved timesheet
                </span>
                <select
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={agencyTimesheetId}
                  onChange={(e) => {
                    setAgencyTimesheetId(e.target.value);
                    const sheet = timesheets.find((t) => t.id === e.target.value);
                    if (sheet) setAmount(String(sheet.totalVendorCost));
                  }}
                >
                  <option value="">Select timesheet…</option>
                  {timesheets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.documentNo} — {formatAgencyTimesheetPeriod(t.periodStart, t.periodEnd)} (
                      {formatMoney(t.totalVendorCost)})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Your invoice number
                  </span>
                  <input
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Invoice date
                  </span>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </label>
              </div>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Amount (AUD)</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Invoice document <span className="text-red-600">*</span>
                </span>
                <input
                  type="file"
                  required
                  accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-sky-800"
                  onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
                />
                <span className="mt-1 block text-xs text-slate-500">
                  PDF or image (JPEG, PNG, WebP). Max 10 MB. Required for AP processing.
                </span>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit invoice"}
              </button>
            </form>
          ) : null}

          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : invoices && invoices.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Timesheet</th>
                    <th className="px-4 py-3">Invoice no.</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Document</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.map((row) => (
                    <tr key={row.id}>
                      <td className="px-4 py-3 font-medium">{row.documentNo}</td>
                      <td className="px-4 py-3">{row.agencyTimesheetDocumentNo}</td>
                      <td className="px-4 py-3">{row.invoiceNo}</td>
                      <td className="px-4 py-3">{formatDisplayDate(row.invoiceDate)}</td>
                      <td className="px-4 py-3">{formatMoney(row.amount)}</td>
                      <td className="px-4 py-3">
                        {row.hasDocument ? (
                          <button
                            type="button"
                            onClick={() => openInvoiceDocument(row.id)}
                            className="text-sm font-medium text-sky-700 hover:underline"
                          >
                            {row.documentFileName || "View"}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
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
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-600">
              No invoices submitted yet.
            </p>
          )}
        </AgencyPortalShell>
      )}
    </AgencyPortalGuard>
  );
}
