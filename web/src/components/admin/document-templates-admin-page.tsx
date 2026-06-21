"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SystemShell } from "@/components/system/system-shell";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useAdminPageAccess } from "@/lib/access/window-surface";
import {
  DOCUMENT_CLASS_LABELS,
  DOCUMENT_PRINT_PROCESSES,
  DEFAULT_AGREEMENT_TEMPLATE_ID,
  DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID,
  DEFAULT_BOARD_REPORT_TEMPLATE_ID,
  DEFAULT_ENQUIRY_ACK_TEMPLATE_ID,
  DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID,
  DEFAULT_INVOICE_TEMPLATE_ID,
  DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID,
  DEFAULT_REMITTANCE_COVER_TEMPLATE_ID,
  cloneDocumentTemplate,
  type DocumentTemplateRecord,
} from "@/lib/document-template";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { renderDocument } from "@/lib/document-render";
import { useOrganization } from "@/lib/organization-store";
import { useData } from "@/lib/data-store";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function DocumentTemplatesAdminPage() {
  const { hasAnyAccess } = useAdminPageAccess("system");
  const hasPageAccess = hasAnyAccess(["admin-document-templates"]);
  const { templates, bindings, upsertTemplate, upsertBinding, loading } = useDocumentPlatform();
  const { organization } = useOrganization();
  const { invoices, clients, serviceAgreements, employees, enquiries, boardReportPacks } = useData();
  const sorted = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name)),
    [templates]
  );
  const [activeId, setActiveId] = useState<string | null>(sorted[0]?.id ?? null);
  const [draft, setDraft] = useState<DocumentTemplateRecord | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [saveError, setSaveError] = useState("");
  const [bindingError, setBindingError] = useState("");
  const [bindingBusy, setBindingBusy] = useState(false);

  const record = draft ?? sorted.find((t) => t.id === activeId) ?? null;
  const persisted = sorted.find((t) => t.id === activeId) ?? null;
  const isDirty = Boolean(draft && (!persisted || JSON.stringify(draft) !== JSON.stringify(persisted)));

  const preview = useMemo(() => {
    if (!record) return null;
    if (record.documentClass.startsWith("tax-invoice")) {
      const invoice = invoices[0];
      if (!invoice) return null;
      const client = clients.find((c) => c.id === invoice.clientId);
      return renderDocument(record, { invoice, client, organization }, { skipValidation: true });
    }
    if (record.documentClass.startsWith("service-agreement")) {
      const agreement = serviceAgreements[0];
      if (!agreement) return null;
      const client = clients.find((c) => c.id === agreement.clientId);
      return renderDocument(record, { agreement, client, organization }, { skipValidation: true });
    }
    if (record.documentClass.startsWith("hr-contract")) {
      const employee = employees[0];
      if (!employee) return null;
      return renderDocument(record, { employee, managerName: "Manager", organization }, { skipValidation: true });
    }
    if (record.documentClass === "enquiry-letter") {
      const enquiry = enquiries[0];
      if (!enquiry) return null;
      return renderDocument(record, { enquiry, organization }, { skipValidation: true });
    }
    if (record.documentClass === "remittance-cover") {
      return renderDocument(record, { rows: [], periodLabel: "Sample period", organization }, { skipValidation: true });
    }
    if (record.documentClass === "participant-statement") {
      const client = clients[0];
      if (!client) return null;
      const clientInvoices = invoices.filter((inv) => inv.clientId === client.id).slice(0, 3);
      return renderDocument(record, { client, invoices: clientInvoices, periodLabel: "Sample period", organization }, { skipValidation: true });
    }
    if (record.documentClass === "board-report") {
      const pack = boardReportPacks[0];
      if (!pack) return null;
      return renderDocument(record, { pack, organization }, { skipValidation: true });
    }
    return null;
  }, [record, invoices, serviceAgreements, employees, clients, organization, enquiries, boardReportPacks]);

  const processBindings = useMemo(
    () => bindings.filter((b) => b.templateId === record?.id),
    [bindings, record?.id]
  );

  const invoiceTemplates = useMemo(
    () => sorted.filter((t) => t.active && t.documentClass.startsWith("tax-invoice")),
    [sorted]
  );

  const agreementTemplates = useMemo(
    () =>
      sorted.filter(
        (t) => t.active && (t.documentClass === "service-agreement" || t.documentClass === "service-agreement-variation")
      ),
    [sorted]
  );

  const hrTemplates = useMemo(
    () => sorted.filter((t) => t.active && t.documentClass.startsWith("hr-contract")),
    [sorted]
  );

  const enquiryTemplates = useMemo(
    () => sorted.filter((t) => t.active && t.documentClass === "enquiry-letter"),
    [sorted]
  );

  const remittanceTemplates = useMemo(
    () => sorted.filter((t) => t.active && t.documentClass === "remittance-cover"),
    [sorted]
  );

  const statementTemplates = useMemo(
    () => sorted.filter((t) => t.active && t.documentClass === "participant-statement"),
    [sorted]
  );

  const boardReportTemplates = useMemo(
    () => sorted.filter((t) => t.active && t.documentClass === "board-report"),
    [sorted]
  );

  const processBindingRows = useMemo(
    () =>
      [
        {
          processId: DOCUMENT_PRINT_PROCESSES.printInvoice,
          entityType: "invoice",
          label: "Print invoice (detail)",
          templates: invoiceTemplates,
          fallbackId: DEFAULT_INVOICE_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.batchPrintInvoices,
          entityType: "invoice",
          label: "Batch print invoices (list)",
          templates: invoiceTemplates,
          fallbackId: DEFAULT_INVOICE_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.printServiceAgreement,
          entityType: "service-agreement",
          label: "Print service agreement",
          templates: agreementTemplates.filter((t) => t.documentClass === "service-agreement"),
          fallbackId: DEFAULT_AGREEMENT_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.printAgreementVariation,
          entityType: "service-agreement",
          label: "Print agreement variation",
          templates: agreementTemplates.filter((t) => t.documentClass === "service-agreement-variation"),
          fallbackId: DEFAULT_AGREEMENT_VARIATION_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.printEmployeeContract,
          entityType: "employee",
          label: "Generate employee contract",
          templates: hrTemplates,
          fallbackId: DEFAULT_HR_CONTRACT_CASUAL_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement,
          entityType: "enquiry",
          label: "Print enquiry acknowledgement",
          templates: enquiryTemplates,
          fallbackId: DEFAULT_ENQUIRY_ACK_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.printRemittanceCover,
          entityType: "invoice",
          label: "Print remittance cover",
          templates: remittanceTemplates,
          fallbackId: DEFAULT_REMITTANCE_COVER_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.printParticipantStatement,
          entityType: "client",
          label: "Print participant statement",
          templates: statementTemplates,
          fallbackId: DEFAULT_PARTICIPANT_STATEMENT_TEMPLATE_ID,
        },
        {
          processId: DOCUMENT_PRINT_PROCESSES.printBoardReport,
          entityType: "board-report",
          label: "Print board report",
          templates: boardReportTemplates,
          fallbackId: DEFAULT_BOARD_REPORT_TEMPLATE_ID,
        },
      ] as const,
    [invoiceTemplates, agreementTemplates, hrTemplates, enquiryTemplates, remittanceTemplates, statementTemplates, boardReportTemplates]
  );

  async function handleBindingChange(processId: string, entityType: string, templateId: string) {
    const existing = bindings.find((b) => b.processId === processId && b.entityType === entityType && b.isDefault);
    const next = {
      id: existing?.id ?? `pdb-${processId}`,
      processId,
      entityType,
      templateId,
      isDefault: true,
      allowUserOverride: existing?.allowUserOverride ?? true,
    };
    setBindingError("");
    setBindingBusy(true);
    try {
      await upsertBinding(next);
    } catch (err) {
      setBindingError(err instanceof Error ? err.message : "Could not save process binding");
    } finally {
      setBindingBusy(false);
    }
  }

  if (!hasPageAccess) {
    return (
      <SystemShell title="Document templates" audit={{ moduleLabel: "Document template administration" }}>
        <p className="text-sm text-slate-600">Sign in to System to manage document templates.</p>
      </SystemShell>
    );
  }

  async function handleSave() {
    if (!record) return;
    setSaveError("");
    setSaveState("saving");
    try {
      await upsertTemplate({ ...record, updatedBy: "System operator" });
      setDraft(null);
      setSaveState("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save template");
      setSaveState("idle");
    }
  }

  async function handleClone() {
    if (!record) return;
    setSaveError("");
    try {
      const cloned = cloneDocumentTemplate(record, "System operator");
      await upsertTemplate(cloned);
      setActiveId(cloned.id);
      setDraft(null);
      setSaveState("saved");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not duplicate template");
    }
  }

  return (
    <SystemShell
      title="Document templates"
      subtitle="Manage print layouts, org header and footer, and process bindings."
      audit={{ moduleLabel: "Document template administration" }}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Active templates are used when users print invoices and other documents. Edit title and footer text; layout blocks are managed by the template class.
        </p>
        <Link href="/system/admin/document-registry" className="text-sm font-medium text-[#b51266] hover:underline">
          Document registry
        </Link>
      </div>

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Default templates by process</h2>
        <p className="mt-1 text-sm text-slate-600">
          Choose which active template users get for invoice and service agreement print. Active templates are production-ready.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {processBindingRows.map((row) => {
            const binding = bindings.find(
              (b) => b.processId === row.processId && b.entityType === row.entityType && b.isDefault
            );
            return (
              <label key={`${row.processId}-${row.entityType}`} className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">{row.label}</span>
                <select
                  className={inputClass}
                  value={binding?.templateId ?? row.fallbackId}
                  onChange={(e) => void handleBindingChange(row.processId, row.entityType, e.target.value)}
                  disabled={!row.templates.length || bindingBusy}
                >
                  {row.templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        {bindingError ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{bindingError}</p>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Templates</p>
          {loading ? <p className="px-2 text-sm text-slate-500">Loading…</p> : null}
          <ul className="space-y-1">
            {sorted.map((template) => (
              <li key={template.id}>
                <button
                  type="button"
                  onClick={() => {
                    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
                    setActiveId(template.id);
                    setDraft(null);
                    setSaveState("idle");
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    activeId === template.id ? "bg-[#fdf2f8] font-medium text-[#9d174d]" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {template.name}
                  {!template.active ? <span className="ml-2 text-xs text-slate-400">Inactive</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {record ? (
          <div className="space-y-4">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{record.name}</h2>
                  <p className="text-sm text-slate-500">{DOCUMENT_CLASS_LABELS[record.documentClass]}</p>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={record.active}
                    onChange={(e) => setDraft({ ...(draft ?? record), active: e.target.checked })}
                  />
                  Active
                </label>
                <button
                  type="button"
                  onClick={() => void handleClone()}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Duplicate template
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-slate-700">Description</span>
                  <textarea
                    className={`${inputClass} min-h-[72px]`}
                    value={(draft ?? record).description}
                    onChange={(e) => setDraft({ ...(draft ?? record), description: e.target.value })}
                  />
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Document title</span>
                  <input
                    className={inputClass}
                    value={(draft ?? record).titleText}
                    onChange={(e) => setDraft({ ...(draft ?? record), titleText: e.target.value })}
                    placeholder="Invoice"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm pt-7">
                  <input
                    type="checkbox"
                    checked={(draft ?? record).isDefault}
                    onChange={(e) => setDraft({ ...(draft ?? record), isDefault: e.target.checked })}
                  />
                  Default for class
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-slate-700">Footer override</span>
                  <textarea
                    className={`${inputClass} min-h-[72px]`}
                    value={(draft ?? record).footerText}
                    onChange={(e) => setDraft({ ...(draft ?? record), footerText: e.target.value })}
                    placeholder="Leave blank to use organisation document footer"
                  />
                </label>
              </div>

              {saveError ? (
                <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{saveError}</p>
              ) : null}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Process bindings</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {processBindings.length ? (
                  processBindings.map((binding) => (
                    <li key={binding.id}>
                      <span className="font-medium">{binding.processId}</span>
                      <span className="text-slate-500"> · {binding.entityType}</span>
                      {binding.isDefault ? <span className="ml-2 text-xs text-emerald-700">Default</span> : null}
                    </li>
                  ))
                ) : (
                  <li className="text-slate-500">No process bindings for this template.</li>
                )}
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Invoice print uses <code className="rounded bg-slate-100 px-1">{DOCUMENT_PRINT_PROCESSES.printInvoice}</code> and batch print uses{" "}
                <code className="rounded bg-slate-100 px-1">{DOCUMENT_PRINT_PROCESSES.batchPrintInvoices}</code>.
              </p>
            </section>

            {preview?.html ? (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-900">Preview (sample record)</h3>
                <iframe title="Template preview" className="mt-3 h-[480px] w-full rounded-lg border border-slate-200 bg-white" srcDoc={preview.html} />
              </section>
            ) : null}

            <UnsavedChangesBar
              visible={isDirty}
              onSave={() => void handleSave()}
              onDiscard={() => {
                setDraft(null);
                setSaveState("idle");
              }}
              saveDisabled={saveState === "saving"}
              message={saveState === "saved" ? "Template saved" : "You have unsaved template changes"}
            />
          </div>
        ) : (
          <p className="text-sm text-slate-600">Select a template.</p>
        )}
      </div>
    </SystemShell>
  );
}
