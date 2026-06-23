"use client";

import { useMemo, useState } from "react";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { useAuth } from "@/lib/auth-store";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { downloadDocumentHtml } from "@/lib/document-render";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import {
  exportEmployeeOfferHtml,
  generateEmployeeOffer,
  printEmployeeOffer,
  resolveEmployeeOfferTemplate,
} from "@/lib/employee-offer-print";
import type { EmployeeDocumentRow, EmployeeRecord } from "@/lib/employee";
import { useOrganization } from "@/lib/organization-store";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function EmployeeOfferGeneratePanel({
  employee,
  managerName,
  existingDocuments,
  onDocumentsChange,
}: {
  employee: EmployeeRecord;
  managerName: string;
  existingDocuments: EmployeeDocumentRow[];
  onDocumentsChange: (rows: EmployeeDocumentRow[]) => void;
}) {
  const { organization } = useOrganization();
  const { canProcess } = useAuth();
  const { templates, resolveTemplate, listTemplatesForProcess } = useDocumentPlatform();
  const canGenerate = canProcess(DOCUMENT_PRINT_PROCESSES.printEmployeeOffer);
  const [templateId, setTemplateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printEmployeeOffer, "employee");
  const activeTemplate = useMemo(
    () =>
      resolveEmployeeOfferTemplate(templates, resolveTemplate, templateId || undefined) ??
      templateOptions[0] ??
      null,
    [templates, resolveTemplate, templateId, templateOptions]
  );

  if (!canGenerate) return null;

  const ctx = { employee, managerName, organization };
  const entityLabel = `${employee.searchKey} — Offer of employment`;
  const processId = DOCUMENT_PRINT_PROCESSES.printEmployeeOffer;

  async function handleGenerate() {
    setError("");
    setMessage("");
    if (!activeTemplate) {
      setError("No active offer letter template is available.");
      return;
    }
    setBusy(true);
    try {
      const result = await generateEmployeeOffer({
        ctx,
        template: activeTemplate,
        existingDocuments,
      });
      onDocumentsChange([...existingDocuments, result.documentRow]);
      auditDocumentProcess({
        processId,
        entityType: "employee",
        entityId: employee.id,
        entityLabel,
        detail: result.registry?.documentNo ? `Generated ${result.registry.documentNo}` : "Generated offer letter",
      });
      setMessage(
        result.registry
          ? `Offer ${result.registry.documentNo} generated. Save the employee record to keep the HR file line.`
          : "Offer letter generated. Save the employee record."
      );
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate offer letter.");
    } finally {
      setBusy(false);
    }
  }

  async function handlePrint() {
    setError("");
    setMessage("");
    if (!activeTemplate) {
      setError("No active offer letter template is available.");
      return;
    }
    const ok = printEmployeeOffer(ctx, activeTemplate);
    if (!ok) {
      setError("Could not open the print window. Allow pop-ups and try again.");
      auditDocumentProcess({
        processId,
        entityType: "employee",
        entityId: employee.id,
        entityLabel,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportEmployeeOfferHtml(ctx, activeTemplate);
    if (!exported) return;
    try {
      await registerDocumentWithAudit({
        processId,
        html: exported.html,
        templateId: exported.templateId,
        documentClass: activeTemplate.documentClass,
        entityType: "employee",
        entityId: employee.id,
        entityLabel,
        fileName: `${employee.searchKey.replace(/[^\w.-]+/g, "_")}-offer.html`,
      });
      setMessage("Offer letter saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  }

  async function handleDownload() {
    setError("");
    setMessage("");
    if (!activeTemplate) {
      setError("No active offer letter template is available.");
      return;
    }
    const exported = exportEmployeeOfferHtml(ctx, activeTemplate);
    if (!exported) {
      setError("Could not generate the document. Check employee and organisation fields.");
      return;
    }
    downloadDocumentHtml(exported.html, `${employee.searchKey}-offer`);
    try {
      await registerDocumentWithAudit({
        processId,
        html: exported.html,
        templateId: exported.templateId,
        documentClass: activeTemplate.documentClass,
        entityType: "employee",
        entityId: employee.id,
        entityLabel,
        fileName: `${employee.searchKey.replace(/[^\w.-]+/g, "_")}-offer.html`,
      });
      setMessage("Offer letter HTML saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  }

  async function handleDownloadPdf() {
    setError("");
    setMessage("");
    if (!activeTemplate) {
      setError("No active offer letter template is available.");
      return;
    }
    const exported = exportEmployeeOfferHtml(ctx, activeTemplate);
    if (!exported) {
      setError("Could not generate the document. Check employee and organisation fields.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: activeTemplate.documentClass,
        entityType: "employee",
        entityId: employee.id,
        entityLabel: employee.searchKey,
        fileName: pdfFileName(`${employee.searchKey}-offer`),
      });
      auditDocumentProcess({
        processId,
        entityType: "employee",
        entityId: employee.id,
        entityLabel,
        detail: "PDF download",
      });
      setMessage("Offer letter PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <RecordDocumentsSection
      entityType="employee"
      entityId={employee.id}
      refreshKey={historyRefresh}
      error={error || undefined}
      message={message || undefined}
      extras={
        templateOptions.length > 1 ? (
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Template</span>
            <select
              className={inputClass}
              value={templateId || activeTemplate?.id || ""}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templateOptions.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </label>
        ) : activeTemplate ? (
          <p className="text-xs text-slate-500">Template: {activeTemplate.name}</p>
        ) : null
      }
      actions={[
        {
          processId,
          label: "Generate",
          onClick: () => void handleGenerate(),
          busy: busy,
          variant: "primary",
          disabled: !activeTemplate,
        },
        {
          processId,
          label: "Print",
          onClick: () => void handlePrint(),
          disabled: busy || pdfBusy || !activeTemplate,
        },
        {
          processId,
          label: "PDF",
          onClick: () => void handleDownloadPdf(),
          busy: pdfBusy,
          disabled: busy || !activeTemplate,
        },
        {
          processId,
          label: "HTML",
          onClick: () => void handleDownload(),
          disabled: busy || pdfBusy || !activeTemplate,
        },
      ]}
    />
  );
}
