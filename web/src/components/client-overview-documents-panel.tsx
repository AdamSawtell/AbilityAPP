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
import { exportPhase2DocumentHtml, printPhase2Document } from "@/lib/phase2-document-print";
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

/** Single Documents block for client Overview — participant statement + consent schedule. */
export function ClientOverviewDocumentsPanel({ client }: { client: ClientRecord }) {
  const { invoices } = useData();
  const { organization } = useOrganization();
  const { canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();

  const canPrintStatement = canProcess(DOCUMENT_PRINT_PROCESSES.printParticipantStatement);
  const canPrintConsent = canProcess(DOCUMENT_PRINT_PROCESSES.printConsentSchedule);

  const [periodMonth, setPeriodMonth] = useState("");
  const [statementError, setStatementError] = useState("");
  const [consentError, setConsentError] = useState("");
  const [message, setMessage] = useState("");
  const [statementPdfBusy, setStatementPdfBusy] = useState(false);
  const [consentPdfBusy, setConsentPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const statementTemplateOptions = listTemplatesForProcess(
    DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
    "client"
  );
  const statementTemplate =
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printParticipantStatement, "client") ??
    statementTemplateOptions[0] ??
    null;

  const consentTemplateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printConsentSchedule, "client");
  const consentTemplate =
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printConsentSchedule, "client") ?? consentTemplateOptions[0] ?? null;

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
  const statementEntityLabel = `${client.searchKey} — ${periodLabel}`;
  const consentEntityLabel = `${client.searchKey} — Consent schedule`;
  const consentCount = client.consents?.length ?? 0;

  async function handlePrintStatement() {
    setStatementError("");
    setConsentError("");
    setMessage("");
    if (!statementTemplate) {
      setStatementError("No active participant statement template is available.");
      return;
    }
    const ok = printExtendedDocument(
      { client, invoices: periodInvoices, periodLabel, organization },
      statementTemplate
    );
    if (!ok) {
      setStatementError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
        entityType: "client",
        entityId: client.id,
        entityLabel: statementEntityLabel,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportExtendedDocumentHtml(
      { client, invoices: periodInvoices, periodLabel, organization },
      statementTemplate
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
        entityLabel: statementEntityLabel,
        fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-statement.html`,
      });
      setMessage("Statement saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setStatementError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  }

  async function handleStatementPdf() {
    setStatementError("");
    setConsentError("");
    setMessage("");
    if (!statementTemplate) {
      setStatementError("No active participant statement template is available.");
      return;
    }
    const exported = exportExtendedDocumentHtml(
      { client, invoices: periodInvoices, periodLabel, organization },
      statementTemplate
    );
    if (!exported) {
      setStatementError("Could not generate the document. Check invoice data and organisation profile.");
      return;
    }
    setStatementPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "client",
        entityId: client.id,
        entityLabel: statementEntityLabel,
        fileName: pdfFileName(`${client.searchKey}-statement`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
        entityType: "client",
        entityId: client.id,
        entityLabel: statementEntityLabel,
        detail: "PDF download",
      });
      setMessage("Statement PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setStatementError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setStatementPdfBusy(false);
    }
  }

  async function handlePrintConsent() {
    setStatementError("");
    setConsentError("");
    setMessage("");
    if (!consentTemplate) {
      setConsentError("No active consent schedule template is available.");
      return;
    }
    const ctx = { client, organization };
    const ok = printPhase2Document(ctx, consentTemplate);
    if (!ok) {
      setConsentError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
        entityType: "client",
        entityId: client.id,
        entityLabel: consentEntityLabel,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportPhase2DocumentHtml(ctx, consentTemplate);
    if (exported) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "client",
          entityId: client.id,
          entityLabel: consentEntityLabel,
          fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-consent-schedule.html`,
        });
        setMessage("Consent schedule saved to the document registry.");
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        setConsentError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  }

  async function handleConsentPdf() {
    setStatementError("");
    setConsentError("");
    setMessage("");
    if (!consentTemplate) {
      setConsentError("No active consent schedule template is available.");
      return;
    }
    const ctx = { client, organization };
    const exported = exportPhase2DocumentHtml(ctx, consentTemplate);
    if (!exported) {
      setConsentError("Could not generate the document. Check consent lines and organisation profile.");
      return;
    }
    setConsentPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "client",
        entityId: client.id,
        entityLabel: consentEntityLabel,
        fileName: pdfFileName(`${client.searchKey}-consent-schedule`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
        entityType: "client",
        entityId: client.id,
        entityLabel: consentEntityLabel,
        detail: "PDF download",
      });
      setMessage("Consent schedule PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setConsentError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setConsentPdfBusy(false);
    }
  }

  if (!canPrintStatement && !canPrintConsent) return null;

  const error = statementError || consentError || undefined;

  return (
    <RecordDocumentsSection
      entityType="client"
      entityId={client.id}
      refreshKey={historyRefresh}
      error={error}
      message={message || undefined}
      extras={
        <div className="space-y-3 text-sm">
          {canPrintStatement ? (
            <div className="flex flex-wrap items-end gap-3">
              <label>
                <span className="mb-1 block text-xs font-medium text-slate-600">Statement period</span>
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
                {statementTemplate ? ` · ${statementTemplate.name}` : ""}
              </p>
            </div>
          ) : null}
          {canPrintConsent ? (
            <p className="text-xs text-slate-500">
              {consentCount} consent line{consentCount === 1 ? "" : "s"}
              {consentTemplate ? ` · ${consentTemplate.name}` : ""}
            </p>
          ) : null}
        </div>
      }
      actions={[
        ...(canPrintStatement
          ? [
              {
                processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
                label: "Print statement",
                onClick: () => void handlePrintStatement(),
              },
              {
                processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
                label: "PDF statement",
                onClick: () => void handleStatementPdf(),
                busy: statementPdfBusy,
              },
            ]
          : []),
        ...(canPrintConsent
          ? [
              {
                processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
                label: "Print consent",
                onClick: () => void handlePrintConsent(),
              },
              {
                processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
                label: "PDF consent",
                onClick: () => void handleConsentPdf(),
                busy: consentPdfBusy,
              },
            ]
          : []),
      ]}
    />
  );
}
