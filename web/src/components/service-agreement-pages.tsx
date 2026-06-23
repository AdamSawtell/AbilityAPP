"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LineItemTable, type GenericTableConfig } from "@/components/line-item-table";
import { ClientRecordLink } from "@/components/record-link";
import { RecordTasksPanel } from "@/components/record-tasks-panel";
import { ServiceAgreementEsignPanel } from "@/components/service-agreement-esign-panel";
import { ServiceAgreementLifecyclePanel } from "@/components/service-agreement-lifecycle-panel";
import {
  ServiceAgreementScheduleSummary,
  ServiceAgreementScheduleWizard,
} from "@/components/service-agreement-schedule";
import { ServiceAgreementList } from "@/components/service-agreement-list";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { exportServiceAgreementHtml, printServiceAgreement } from "@/lib/agreement-print";
import { auditMetaFrom } from "@/lib/audit";
import { useAuth } from "@/lib/auth-store";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { downloadDocumentHtml } from "@/lib/document-render";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { formatContractDate } from "@/lib/contract";
import { newLineId } from "@/lib/client-line-tables";
import { useReferenceData } from "@/lib/config-store";
import { useData } from "@/lib/data-store";
import { useOrganization } from "@/lib/organization-store";
import {
  normalizeServiceAgreement,
  type ServiceAgreementLine,
  type ServiceAgreementRecord,
} from "@/lib/service-agreement";
import {
  agreementLifecycleBlocked,
  applyLifecycleStatusChange,
  lifecycleStatusTone,
  validateServiceAgreementLifecycle,
} from "@/lib/service-agreement-lifecycle";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const lineConfig: GenericTableConfig<ServiceAgreementLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number" as const, className: "w-14" },
    { key: "productId", label: "Product", type: "select" as const, optionsKey: "productId" },
    { key: "name", label: "Name", type: "text" as const },
    { key: "plannedPrice", label: "Planned price", type: "text" as const },
    { key: "fundingType", label: "Funding type", type: "select" as const, optionsKey: "fundingType" },
    { key: "fundingBody", label: "Funding body", type: "text" as const },
  ],
  emptyRow: (lineNo: number): ServiceAgreementLine => ({
    id: newLineId("sal"),
    lineNo,
    productId: "",
    name: "",
    description: "",
    plannedPrice: "",
    registrationGroup: "",
    fundingType: "Funding Body",
    fundingBody: "",
    fundingManagementType: "Portal Managed",
    budgetRules: "Strict Limit",
  }),
  addLabel: "Add agreement line",
  emptyMessage: "No service lines yet. Add products from the linked price list.",
};

export function ServiceAgreementListView() {
  const { serviceAgreements, clients } = useData();
  return <ServiceAgreementList records={serviceAgreements} clients={clients} />;
}

export function ClientServiceAgreementsPanel({
  clientId,
  searchKey,
}: {
  clientId: string;
  clientName: string;
  searchKey: string;
}) {
  const { getServiceAgreementsByClientId } = useData();
  const agreements = getServiceAgreementsByClientId(clientId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        NDIS service agreements for this client. Lines use products from the assigned price list.
      </p>
      {agreements.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {agreements.map((sa) => (
            <Link
              key={sa.id}
              href={`/service-agreements/${sa.id}`}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-[#f9a8d4] hover:shadow-md"
            >
              <p className="text-xs font-medium text-slate-500">{sa.searchKey}</p>
              <p className="font-semibold text-slate-900">{sa.name}</p>
              <p className="mt-2 text-sm text-slate-600">
                {formatContractDate(sa.contractDate)} → {formatContractDate(sa.finishDate)}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-800">${sa.totalPlannedAmount} planned</p>
              <p className="mt-2 text-xs text-slate-500">{sa.lines.length} service lines</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
          <p className="text-sm text-slate-600">No service agreements linked to {searchKey} yet.</p>
        </div>
      )}
    </div>
  );
}

export function ServiceAgreementDetailView({ id }: { id: string }) {
  const { serviceAgreements, clients, products, priceLists, upsertServiceAgreement } = useData();
  const { organization } = useOrganization();
  const { getOptions } = useReferenceData();
  const { session, canWriteWindow, canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();
  const canSaveAgreement = canWriteWindow("service-agreements");
  const canPrintAgreement = canProcess(DOCUMENT_PRINT_PROCESSES.printServiceAgreement);
  const canPrintVariation = canProcess(DOCUMENT_PRINT_PROCESSES.printAgreementVariation);
  const canPrint = canPrintAgreement || canPrintVariation;
  const stored = serviceAgreements.find((r) => r.id === id);
  const [draft, setDraft] = useState<ServiceAgreementRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [printError, setPrintError] = useState("");
  const [printMessage, setPrintMessage] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const [templateId, setTemplateId] = useState("");
  const record = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const client = record ? clients.find((c) => c.id === record.clientId) : null;
  const priceList = record ? priceLists.find((pl) => pl.id === record.priceListId) : null;

  const templateOptions = useMemo(() => {
    const options = canPrintAgreement
      ? listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printServiceAgreement, "service-agreement")
      : [];
    if (canPrintVariation) {
      const variations = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printAgreementVariation, "service-agreement");
      const ids = new Set(options.map((template) => template.id));
      for (const template of variations) {
        if (!ids.has(template.id)) options.push(template);
      }
    }
    return options;
  }, [canPrintAgreement, canPrintVariation, listTemplatesForProcess]);

  const activeTemplateId =
    templateId ||
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printServiceAgreement, "service-agreement")?.id ||
    templateOptions[0]?.id ||
    "";
  const activeTemplate =
    templateOptions.find((template) => template.id === activeTemplateId) ??
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printServiceAgreement, "service-agreement", activeTemplateId) ??
    templateOptions[0] ??
    null;

  const lifecycleIssues = useMemo(() => {
    if (!record) return [];
    return validateServiceAgreementLifecycle(record, stored?.status);
  }, [record, stored?.status]);
  const saveBlocked = agreementLifecycleBlocked(lifecycleIssues);

  const productDropdown = {
    productId: products.map((p) => p.id),
    fundingType: getOptions("fundingType"),
  };
  const productLabels = Object.fromEntries(products.map((p) => [p.id, `${p.searchKey} — ${p.name}`]));

  if (!record) {
    return (
      <AppShell title="Service agreement not found" audit={{ moduleLabel: "Service agreements" }}>
        <Link href="/service-agreements" className="text-[#b51266] hover:underline">
          Back to service agreements
        </Link>
      </AppShell>
    );
  }

  function onChange<K extends keyof ServiceAgreementRecord>(key: K, value: ServiceAgreementRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    let next = { ...base, [key]: value, updatedBy: "SuperUser" };
    if (key === "status") {
      next = applyLifecycleStatusChange(next, String(value));
    }
    setDraft(normalizeServiceAgreement(next));
    setSaved(false);
  }

  async function archiveAgreementDocument(agreement: ServiceAgreementRecord, labelSuffix = "") {
    const template =
      activeTemplate ??
      resolveTemplate(DOCUMENT_PRINT_PROCESSES.printServiceAgreement, "service-agreement") ??
      templateOptions[0] ??
      null;
    if (!template) return;
    const exported = exportServiceAgreementHtml({ agreement, client: client ?? undefined, organization }, template);
    if (!exported) return;
    await registerDocumentWithAudit({
      processId: DOCUMENT_PRINT_PROCESSES.printServiceAgreement,
      html: exported.html,
      templateId: exported.templateId,
      documentClass: template.documentClass,
      entityType: "service-agreement",
      entityId: agreement.id,
      entityLabel: `${agreement.searchKey}${labelSuffix}`,
      fileName: `${agreement.searchKey.replace(/[^\w.-]+/g, "_")}${labelSuffix}.html`,
    });
    setHistoryRefresh((n) => n + 1);
  }

  const handlePrint = async () => {
    setPrintError("");
    setPrintMessage("");
    if (!activeTemplate) {
      setPrintError("No active agreement template is available.");
      return;
    }
    const ok = printServiceAgreement({ agreement: record, client: client ?? undefined, organization }, activeTemplate);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printServiceAgreement,
        entityType: "service-agreement",
        entityId: record.id,
        entityLabel: record.searchKey,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    try {
      await archiveAgreementDocument(record);
      setPrintMessage("Agreement saved to the document registry.");
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  };

  const handleDownload = async () => {
    setPrintError("");
    setPrintMessage("");
    if (!activeTemplate) {
      setPrintError("No active agreement template is available.");
      return;
    }
    const exported = exportServiceAgreementHtml({ agreement: record, client: client ?? undefined, organization }, activeTemplate);
    if (!exported) {
      setPrintError("Could not generate the document. Check agreement fields and organisation profile.");
      return;
    }
    downloadDocumentHtml(exported.html, record.searchKey);
    try {
      await archiveAgreementDocument(record);
      setPrintMessage("Agreement HTML saved to the document registry.");
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
    }
  };

  const handleDownloadPdf = async () => {
    setPrintError("");
    setPrintMessage("");
    if (!activeTemplate) {
      setPrintError("No active agreement template is available.");
      return;
    }
    const exported = exportServiceAgreementHtml({ agreement: record, client: client ?? undefined, organization }, activeTemplate);
    if (!exported) {
      setPrintError("Could not generate the document. Check agreement fields and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: activeTemplate.documentClass,
        entityType: "service-agreement",
        entityId: record.id,
        entityLabel: record.searchKey,
        fileName: pdfFileName(record.searchKey),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printServiceAgreement,
        entityType: "service-agreement",
        entityId: record.id,
        entityLabel: record.searchKey,
        detail: "PDF download",
      });
      setPrintMessage("Agreement PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <>
      <AppShell
        title={record.name}
        subtitle={`${record.searchKey} · ${record.status}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Service agreements", href: "/service-agreements" },
          { label: record.searchKey },
        ]}
        actions={
          client ? (
            <Link
              href={`/clients/${client.id}?tab=Service%20agreements`}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View client
            </Link>
          ) : null
        }
        audit={{
          entityType: "service-agreement",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <div className="mb-6">
          <ServiceAgreementLifecyclePanel issues={lifecycleIssues} />
        </div>

        <div className="mb-6">
          <ServiceAgreementEsignPanel
            record={record}
            readOnly={!canSaveAgreement}
            onApply={(next) => {
              const normalized = normalizeServiceAgreement({
                ...next,
                updatedBy: session?.displayName || "SuperUser",
              });
              setDraft(normalized);
              setSaved(false);
              void archiveAgreementDocument(normalized, "-signed").catch(() => {
                /* registry is best-effort on sign */
              });
            }}
          />
        </div>

        <fieldset disabled={!canSaveAgreement} className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 disabled:opacity-100">
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Name</span>
            <input className={inputClass} value={record.name} onChange={(e) => onChange("name", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Term</span>
            <select className={inputClass} value={record.term} onChange={(e) => onChange("term", e.target.value)}>
              {getOptions("serviceAgreementTerm").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Execution date</span>
            <input className={inputClass} type="date" value={record.executionDate} onChange={(e) => onChange("executionDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Contract date</span>
            <input className={inputClass} type="date" value={record.contractDate} onChange={(e) => onChange("contractDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Finish date</span>
            <input className={inputClass} type="date" value={record.finishDate} onChange={(e) => onChange("finishDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Review date</span>
            <input className={inputClass} type="date" value={record.reviewDate} onChange={(e) => onChange("reviewDate", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Price list</span>
            <select className={inputClass} value={record.priceListId} onChange={(e) => onChange("priceListId", e.target.value)}>
              <option value="">None</option>
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
            <select className={inputClass} value={record.status} onChange={(e) => onChange("status", e.target.value)}>
              {getOptions("serviceAgreementStatus").map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Total planned amount</span>
            <input className={inputClass} value={record.totalPlannedAmount} readOnly />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Sent date</span>
            <input className={inputClass} type="date" value={record.sentAt} onChange={(e) => onChange("sentAt", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Signed date</span>
            <input className={inputClass} type="date" value={record.signedAt} onChange={(e) => onChange("signedAt", e.target.value)} />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-medium text-slate-600">Activated date</span>
            <input className={inputClass} type="date" value={record.activatedAt} onChange={(e) => onChange("activatedAt", e.target.value)} />
          </label>
        </fieldset>

        <div className="mb-6 space-y-4">
          <ServiceAgreementScheduleSummary lines={record.lines} />
          <ServiceAgreementScheduleWizard
            rows={record.lines}
            readOnly={!canSaveAgreement}
            onApply={(rows) => onChange("lines", rows)}
          />
        </div>

        {client ? (
          <p className="mb-4 text-sm text-slate-600">
            Client:{" "}
            <ClientRecordLink id={client.id} searchKey={client.searchKey} name={client.name} className="font-medium text-[#b51266] hover:underline" />
            {priceList ? <> · Price list: {priceList.name}</> : null}
          </p>
        ) : null}

        <h3 className="mb-3 text-sm font-semibold text-slate-900">Schedule of supports</h3>
        <LineItemTable
          config={lineConfig}
          rows={record.lines}
          dropdowns={productDropdown}
          optionLabels={productLabels}
          onChange={(rows) => onChange("lines", rows)}
          readOnly={!canSaveAgreement}
        />
        {saved && !hasUnsavedChanges ? <p className="mt-4 text-sm text-emerald-700">Saved</p> : null}

        {canPrint ? (
          <RecordDocumentsSection
            entityType="service-agreement"
            entityId={record.id}
            refreshKey={historyRefresh}
            error={printError || undefined}
            message={printMessage || undefined}
            extras={
              templateOptions.length > 1 ? (
                <label className="block text-sm">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Template</span>
                  <select
                    className={inputClass}
                    value={activeTemplateId}
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
                processId: DOCUMENT_PRINT_PROCESSES.printServiceAgreement,
                label: "Print",
                onClick: () => void handlePrint(),
              },
              {
                processId: DOCUMENT_PRINT_PROCESSES.printServiceAgreement,
                label: "PDF",
                onClick: () => void handleDownloadPdf(),
                busy: pdfBusy,
              },
              {
                processId: DOCUMENT_PRINT_PROCESSES.printServiceAgreement,
                label: "HTML",
                onClick: () => void handleDownload(),
              },
            ]}
          />
        ) : null}

        <div className="mt-8 border-t border-slate-200 pt-8">
          <RecordTasksPanel
            entityType="service-agreement"
            entityId={record.id}
            entityLabel={`${record.searchKey} — ${record.name}`}
          />
        </div>
      </AppShell>
      <UnsavedChangesBar
        visible={hasUnsavedChanges && canSaveAgreement}
        saveDisabled={saveBlocked}
        message={saveBlocked ? "Fix lifecycle errors before saving" : "You have unsaved changes"}
        onSave={() => {
          if (saveBlocked) return;
          upsertServiceAgreement(record);
          setDraft(null);
          setSaved(true);
        }}
        onDiscard={() => {
          setDraft(null);
          setSaved(false);
        }}
      />
    </>
  );
}
