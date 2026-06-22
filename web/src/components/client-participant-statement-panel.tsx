"use client";

import { useMemo, useState } from "react";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
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
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

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
  const entityLabel = `${client.searchKey} — ${periodLabel}`;

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
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
        entityType: "client",
        entityId: client.id,
        entityLabel,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportExtendedDocumentHtml(
      { client, invoices: periodInvoices, periodLabel, organization },
      activeTemplate
    );
    if (!exported) return;
    try {
      await registerDocumentWithAudit({
        processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "client",
        entityId: client.id,
        entityLabel,
        fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-statement.html`,
      });
      setMessage("Statement saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  }

  async function handleDownloadPdf() {
    setPrintError("");
    setMessage("");
    if (!activeTemplate) {
      setPrintError("No active participant statement template is available.");
      return;
    }
    const exported = exportExtendedDocumentHtml(
      { client, invoices: periodInvoices, periodLabel, organization },
      activeTemplate
    );
    if (!exported) {
      setPrintError("Could not generate the document. Check invoice data and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "client",
        entityId: client.id,
        entityLabel,
        fileName: pdfFileName(`${client.searchKey}-statement`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
        entityType: "client",
        entityId: client.id,
        entityLabel,
        detail: "PDF download",
      });
      setMessage("Statement PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  }

  if (!canPrint) return null;

  return (
    <>
      <RecordDocumentsSection
        entityType="client"
        entityId={client.id}
        refreshKey={historyRefresh}
        error={printError || undefined}
        message={message || undefined}
        extras={
          <div className="flex flex-wrap items-end gap-3 text-sm">
            <label>
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
            <p className="text-xs text-slate-500">
              {periodInvoices.length} invoice{periodInvoices.length === 1 ? "" : "s"} in scope
              {activeTemplate ? ` · ${activeTemplate.name}` : ""}
            </p>
          </div>
        }
        actions={[
          {
            processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
            label: "Print",
            onClick: () => void handlePrint(),
          },
          {
            processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
            label: "PDF",
            onClick: () => void handleDownloadPdf(),
            busy: pdfBusy,
          },
        ]}
      />
    </>
  );
}
