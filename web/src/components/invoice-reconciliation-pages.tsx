"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import { useAuth } from "@/lib/auth-store";
import { registerGeneratedDocument } from "@/lib/document-client";
import { useData } from "@/lib/data-store";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { exportExtendedDocumentHtml, printExtendedDocument } from "@/lib/extended-document-print";
import {
  buildInvoiceReconcileRows,
  INVOICE_RECONCILE_STATUSES,
  invoiceReconcileCsv,
  invoiceReconcileStatusClass,
  summarizeInvoiceReconciliation,
} from "@/lib/invoice-reconciliation";
import { currentPlanMonthIso } from "@/lib/monthly-service-plan";
import { useOrganization } from "@/lib/organization-store";
import { downloadCsv } from "@/lib/reports/export";

export function InvoiceReconciliationView() {
  const { invoices, clients } = useData();
  const { organization } = useOrganization();
  const { canProcess, canWriteWindow } = useAuth();
  const { resolveTemplate } = useDocumentPlatform();
  const canExport = canWriteWindow("invoice-reconciliation");
  const canPrintRemittance = canProcess(DOCUMENT_PRINT_PROCESSES.printRemittanceCover);

  const [periodMonth, setPeriodMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [printError, setPrintError] = useState("");

  const rows = useMemo(() => buildInvoiceReconcileRows(invoices, periodMonth), [invoices, periodMonth]);
  const digest = useMemo(() => summarizeInvoiceReconciliation(rows), [rows]);

  const filteredRows = useMemo(() => {
    if (!statusFilter) return rows.filter((row) => row.invoicedAmount > 0);
    return rows.filter((row) => row.reconcileStatus === statusFilter && row.invoicedAmount > 0);
  }, [rows, statusFilter]);

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    for (const invoice of invoices) {
      if (invoice.periodStart) months.add(invoice.periodStart.slice(0, 7));
      if (invoice.periodEnd) months.add(invoice.periodEnd.slice(0, 7));
    }
    if (periodMonth) months.add(periodMonth);
    return [...months].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [invoices, periodMonth]);

  const handleExport = () => {
    const content = invoiceReconcileCsv(filteredRows, clients);
    const suffix = periodMonth || currentPlanMonthIso();
    downloadCsv(`invoice-reconciliation-${suffix}.csv`, content);
  };

  const periodLabel = periodMonth || "All periods";

  const handlePrintRemittance = async () => {
    setPrintError("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printRemittanceCover, "invoice");
    if (!template) {
      setPrintError("No active remittance cover template is available.");
      return;
    }
    const rows = filteredRows.filter((row) => row.invoicedAmount > 0);
    const ok = printExtendedDocument({ rows, periodLabel, organization }, template);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      return;
    }
    const exported = exportExtendedDocumentHtml({ rows, periodLabel, organization }, template);
    if (exported) {
      try {
        await registerGeneratedDocument({
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "invoice",
          entityId: periodMonth || "all-periods",
          entityLabel: `Remittance — ${periodLabel}`,
          fileName: `remittance-${(periodMonth || "all").replace(/[^\w.-]+/g, "_")}.html`,
        });
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Review plan-managed and self-managed invoices against recorded payments. Use this dashboard before financial
        close to follow up unpaid or overdue participant invoices.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Invoice period month</span>
          <select
            value={periodMonth}
            onChange={(e) => setPeriodMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All periods</option>
            {monthOptions.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Reconcile status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {INVOICE_RECONCILE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        {canExport ? (
          <button
            type="button"
            onClick={handleExport}
            disabled={!filteredRows.length}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export CSV
          </button>
        ) : null}
        {canPrintRemittance ? (
          <button
            type="button"
            onClick={() => void handlePrintRemittance()}
            disabled={!filteredRows.length}
            className="rounded-lg border border-[#d4147a] bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Print remittance cover
          </button>
        ) : null}
      </div>

      {printError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{printError}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Invoices</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{digest.invoiceCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Unpaid</p>
          <p className="mt-1 text-lg font-semibold text-amber-900">{digest.unpaidCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Overdue</p>
          <p className="mt-1 text-lg font-semibold text-rose-900">{digest.overdueCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Invoiced</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">${digest.totalInvoicedAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Outstanding</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">${digest.totalOutstandingAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Invoiced</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Message</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length ? (
              filteredRows.map((row) => {
                const client = clients.find((c) => c.id === row.clientId);
                return (
                <tr key={row.invoiceId} className="border-b border-slate-100">
                  <td className="px-4 py-3">
                    <Link href={`/invoices/${row.invoiceId}`} className="font-medium text-[#b51266] hover:underline">
                      {row.documentNo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {client ? (
                      <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} />
                    ) : (
                      row.clientId
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {row.periodStart} – {row.periodEnd}
                  </td>
                  <td className="px-4 py-3">${row.invoicedAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">${row.paidAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${invoiceReconcileStatusClass(row.reconcileStatus)}`}
                    >
                      {row.reconcileStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.reconcileMessage}</td>
                </tr>
              );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No sent or paid invoices match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
