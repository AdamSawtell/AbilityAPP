"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { downloadDocumentHtml } from "@/lib/document-render";
import {
  exportEmployeeContractHtml,
  generateEmployeeContract,
  printEmployeeContract,
  resolveEmployeeContractTemplate,
} from "@/lib/employee-contract-print";
import type { EmployeeDocumentRow, EmployeeRecord } from "@/lib/employee";
import { useOrganization } from "@/lib/organization-store";

const inputClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function EmployeeContractGeneratePanel({
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
  const canGenerate = canProcess(DOCUMENT_PRINT_PROCESSES.printEmployeeContract);
  const [templateId, setTemplateId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printEmployeeContract, "employee");
  const activeTemplate = useMemo(
    () =>
      resolveEmployeeContractTemplate(employee, templates, resolveTemplate, templateId || undefined) ??
      templateOptions[0] ??
      null,
    [employee, templates, resolveTemplate, templateId, templateOptions]
  );

  if (!canGenerate) return null;

  const ctx = { employee, managerName, organization };

  async function handleGenerate() {
    setError("");
    setMessage("");
    if (!activeTemplate) {
      setError("No active employment contract template is available.");
      return;
    }
    setBusy(true);
    try {
      const result = await generateEmployeeContract({
        ctx,
        template: activeTemplate,
        existingDocuments,
      });
      onDocumentsChange([...existingDocuments, result.documentRow]);
      setMessage(
        result.registry
          ? `Contract ${result.registry.documentNo} generated and added to HR file. Save the employee record, then the staff member can view it in My workplace.`
          : "Contract generated and added to HR file. Save the employee record."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate contract.");
    } finally {
      setBusy(false);
    }
  }

  function handlePrint() {
    setError("");
    if (!activeTemplate) {
      setError("No active employment contract template is available.");
      return;
    }
    const ok = printEmployeeContract(ctx, activeTemplate);
    if (!ok) setError("Could not open the print window. Allow pop-ups and try again.");
  }

  function handleDownload() {
    setError("");
    if (!activeTemplate) {
      setError("No active employment contract template is available.");
      return;
    }
    const exported = exportEmployeeContractHtml(ctx, activeTemplate);
    if (!exported) {
      setError("Could not generate the document. Check employee and organisation fields.");
      return;
    }
    downloadDocumentHtml(exported.html, `${employee.searchKey}-contract`);
  }

  return (
    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <h3 className="text-sm font-semibold text-slate-900">Generate employment contract</h3>
      <p className="mt-1 text-sm text-slate-600">
        Creates a printable contract, saves it to the document registry, and adds an HR file line visible in My workplace.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-3">
        {templateOptions.length > 1 ? (
          <label className="text-sm text-slate-600">
            Template{" "}
            <select
              className={`${inputClass} ml-2`}
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
        ) : null}
        <button
          type="button"
          disabled={busy || !activeTemplate}
          onClick={() => void handleGenerate()}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:opacity-50"
        >
          {busy ? "Generating…" : "Generate contract"}
        </button>
        <button
          type="button"
          disabled={busy || !activeTemplate}
          onClick={handleDownload}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Download HTML
        </button>
        <button
          type="button"
          disabled={busy || !activeTemplate}
          onClick={handlePrint}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          Print preview
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-emerald-800">{message}</p> : null}
      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
    </div>
  );
}
