"use client";

import { useMemo, useState } from "react";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { useAuth } from "@/lib/auth-store";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import type { ClientRecord } from "@/lib/client";
import { exportPhase2DocumentHtml, printPhase2Document } from "@/lib/phase2-document-print";
import { useOrganization } from "@/lib/organization-store";

export function ClientConsentSchedulePanel({ client }: { client: ClientRecord }) {
  const { organization } = useOrganization();
  const { canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();
  const canPrint = canProcess(DOCUMENT_PRINT_PROCESSES.printConsentSchedule);
  const [printError, setPrintError] = useState("");
  const [message, setMessage] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printConsentSchedule, "client");
  const activeTemplate =
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printConsentSchedule, "client") ?? templateOptions[0] ?? null;

  const consentCount = useMemo(() => client.consents?.length ?? 0, [client.consents]);
  const entityLabel = `${client.searchKey} — Consent schedule`;

  async function handlePrint() {
    setPrintError("");
    setMessage("");
    if (!activeTemplate) {
      setPrintError("No active consent schedule template is available.");
      return;
    }
    const ctx = { client, organization };
    const ok = printPhase2Document(ctx, activeTemplate);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
        entityType: "client",
        entityId: client.id,
        entityLabel,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportPhase2DocumentHtml(ctx, activeTemplate);
    if (exported) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "client",
          entityId: client.id,
          entityLabel,
          fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-consent-schedule.html`,
        });
        setMessage("Consent schedule saved to the document registry.");
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  }

  async function handleDownloadPdf() {
    setPrintError("");
    setMessage("");
    if (!activeTemplate) {
      setPrintError("No active consent schedule template is available.");
      return;
    }
    const ctx = { client, organization };
    const exported = exportPhase2DocumentHtml(ctx, activeTemplate);
    if (!exported) {
      setPrintError("Could not generate the document. Check consent lines and organisation profile.");
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
        fileName: pdfFileName(`${client.searchKey}-consent-schedule`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
        entityType: "client",
        entityId: client.id,
        entityLabel,
        detail: "PDF download",
      });
      setMessage("Consent schedule PDF saved to the document registry.");
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
      <p className="mt-4 text-xs text-slate-500">
        {consentCount} consent line{consentCount === 1 ? "" : "s"}
        {activeTemplate ? ` · Template: ${activeTemplate.name}` : ""}
      </p>
      <RecordDocumentsSection
        entityType="client"
        entityId={client.id}
        refreshKey={historyRefresh}
        error={printError || undefined}
        message={message || undefined}
        actions={[
          {
            processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
            label: "Print",
            onClick: () => void handlePrint(),
          },
          {
            processId: DOCUMENT_PRINT_PROCESSES.printConsentSchedule,
            label: "PDF",
            onClick: () => void handleDownloadPdf(),
            busy: pdfBusy,
          },
        ]}
      />
    </>
  );
}
