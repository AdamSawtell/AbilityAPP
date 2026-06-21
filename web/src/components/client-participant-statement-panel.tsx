"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { registerGeneratedDocument } from "@/lib/document-client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { exportExtendedDocumentHtml, printExtendedDocument } from "@/lib/extended-document-print";
import type { ClientRecord } from "@/lib/client";
import type { InvoiceRecord } from "@/lib/invoice";
import { useOrganization } from "@/lib/organization-store";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function periodOverlapsMonth(periodStart: string, periodEnd: string, month: string): boolean {
  if (!month.trim()) return true;
  const startMonth = periodStart?.slice(0, 7) ?? "";
  const endMonth = periodEnd?.slice(0, 7) ?? startMonth;
  if (startMonth === month || endMonth === month) return true;
  if (!startMonth || !endMonth) return false;
  return startMonth <= month && endMonth >= month;
}

export function ClientParticipantStatementPanel({ client }: { client: ClientRecord }) {
  const { invoices } = useData();
  const { organization } = useOrganization();
  const { canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();
  const canPrint = canProcess(DOCUMENT_PRINT_PROCESSES.printParticipantStatement);
  const [periodMonth, setPeriodMonth] = useState("");
  const [printError, setPrintError] = useState("");
  const [message, setMessage] = useState("");

  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printParticipantStatement, "client");
  const activeTemplate =
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printParticipantStatement, "client") ?? templateOptions[0] ?? null;

  const clientInvoices = useMemo(
    () => invoices.filter((inv) => inv.clientId === client.id),
    [invoices, client.id]
  );

  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    for (const invoice of clientInvoices) {
      if (invoice.periodStart) months.add(invoice.periodStart.slice(0, 7));
      if (invoice.periodEnd) months.add(invoice.periodEnd.slice(0, 7));
    }
    return [...months].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [clientInvoices]);

  const periodInvoices = useMemo(
    () =>
      clientInvoices.filter((inv: InvoiceRecord) =>
        periodOverlapsMonth(inv.periodStart, inv.periodEnd, periodMonth)
      ),
    [clientInvoices, periodMonth]
  );

  const periodLabel = periodMonth || "All periods";

  async function archiveStatement() {
    if (!activeTemplate) return;
    const exported = exportExtendedDocumentHtml(
      { client, invoices: periodInvoices, periodLabel, organization },
      activeTemplate
    );
    if (!exported) return;
    await registerGeneratedDocument({
      html: exported.html,
      templateId: exported.templateId,
      documentClass: exported.documentClass,
      entityType: "client",
      entityId: client.id,
      entityLabel: `${client.searchKey} — ${periodLabel}`,
      fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-statement.html`,
    });
  }

  async function handlePrint() {
    setPrintError("");
    setMessage("");
    if (!activeTemplate) {
      setPrintError("No active participant statement template is available.");
      return;
    }
    const ok = printExtendedDocument(
      { client, invoices: periodInvoices, periodLabel, organization },
      activeTemplate
    );
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      return;
    }
    try {
      await archiveStatement();
      setMessage("Statement saved to the document registry.");
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  }

  if (!canPrint) return null;

  return (
    <div className="mt-6 border-t border-slate-100 pt-5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Participant service statement</h4>
          <p className="mt-1 text-sm text-slate-500">
            Print a summary of invoices for this participant. Use Save as PDF from the browser print dialog.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Period</span>
            <select className={inputClass} value={periodMonth} onChange={(e) => setPeriodMonth(e.target.value)}>
              <option value="">All periods</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void handlePrint()}
            className="rounded-lg border border-[#d4147a] bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Print statement
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {periodInvoices.length} invoice{periodInvoices.length === 1 ? "" : "s"} in scope
        {activeTemplate ? ` · Template: ${activeTemplate.name}` : ""}
      </p>
      {printError ? (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{printError}</p>
      ) : null}
      {message ? (
        <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p>
      ) : null}
    </div>
  );
}
