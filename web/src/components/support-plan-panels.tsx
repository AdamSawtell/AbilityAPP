"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LineItemTable, type GenericTableConfig } from "@/components/line-item-table";
import { useAuth } from "@/lib/auth-store";
import type { ClientRecord } from "@/lib/client";
import { useReferenceData } from "@/lib/config-store";
import { formatContractDate } from "@/lib/contract";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES, defaultSupportPlanTemplate } from "@/lib/document-template";
import { newLineId } from "@/lib/client-line-tables";
import { useData } from "@/lib/data-store";
import { useOrganization } from "@/lib/organization-store";
import { exportPhase2DocumentHtml, printPhase2Document } from "@/lib/phase2-document-print";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { DOCUMENT_SEND_VIA_EMAIL_LABEL } from "@/lib/document-email-template";
import { emailHandoffMessage, launchEmailWithPdfAttachment } from "@/lib/document-email-handoff";
import { organizationDisplayName } from "@/lib/organization";
import type { SupportPlanDocumentContext } from "@/lib/support-plan-print";
import {
  assistiveTechnologyTableConfig,
  diagnosisTableConfig,
  healthPlanTableConfig,
  medicationTableConfig,
  supportRequirementTableConfig,
} from "@/lib/support-plan-line-tables";
import {
  supportPlanSections,
  type SupportPlanGoalLine,
  type SupportPlanRecord,
} from "@/lib/support-plan";

const lineTableSections = [
  { id: "health-records", label: "Health records" },
  { id: "support-requirements", label: "Support requirements" },
  { id: "assistive-technology", label: "Assistive technology" },
  { id: "goals", label: "Goals" },
] as const;

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const goalTableConfig: GenericTableConfig<SupportPlanGoalLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "name", label: "Name", type: "text" },
    { key: "goalNumber", label: "Goal number", type: "select", optionsKey: "goalNumber" },
    { key: "goalTerm", label: "Goal term", type: "select", optionsKey: "goalTerm" },
    { key: "goalType", label: "Goal type", type: "select", optionsKey: "goalType" },
    { key: "goal", label: "Goal", type: "textarea", className: "min-w-[180px]" },
    { key: "ndisCategory", label: "NDIS category", type: "select", optionsKey: "ndisGoalCategory" },
    { key: "whyItMatters", label: "Why it matters", type: "textarea", className: "min-w-[160px]" },
    { key: "supportRequired", label: "Support activities", type: "textarea", className: "min-w-[180px]" },
    { key: "successMeasures", label: "Success measures", type: "textarea", className: "min-w-[160px]" },
    { key: "startDate", label: "Start", type: "date" },
    { key: "endDate", label: "End", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("goal"),
    lineNo,
    name: "",
    goalNumber: "",
    goalTerm: "",
    goalType: "NDIS Goal",
    goal: "",
    ndisCategory: "",
    whyItMatters: "",
    supportRequired: "",
    successMeasures: "",
    startDate: "",
    endDate: "",
  }),
  addLabel: "Add goal",
  emptyMessage: "No goals on this support plan yet.",
};

function SupportPlanField({
  field,
  plan,
  onChange,
  getOptions,
}: {
  field: (typeof supportPlanSections)[number]["fields"][number];
  plan: SupportPlanRecord;
  onChange: (key: keyof SupportPlanRecord, value: SupportPlanRecord[keyof SupportPlanRecord]) => void;
  getOptions: (key: string) => string[];
}) {
  const value = plan[field.key];

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.key, e.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "select" && field.optionsKey) {
    return (
      <label>
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
        <select
          className={inputClass}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          <option value="">Select…</option>
          {getOptions(field.optionsKey).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </label>
    );
  }

  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
      <input
        className={inputClass}
        type={field.type === "date" ? "date" : "text"}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </label>
  );
}

export function ClientSupportPlanPanel({
  client,
  onDirty,
}: {
  client: ClientRecord;
  onDirty?: (dirty: boolean) => void;
}) {
  const clientId = client.id;
  const { organization } = useOrganization();
  const { canProcess } = useAuth();
  const { listTemplatesForProcess, resolveTemplate } = useDocumentPlatform();
  const {
    getSupportPlanByClientId,
    upsertSupportPlan,
    getServiceBookingsByClientId,
    getPlanDocumentsByClientId,
    rosterShifts,
    businessPartners,
    getEmployeeById,
  } = useData();
  const canPrint = canProcess(DOCUMENT_PRINT_PROCESSES.printSupportPlan);
  const canSend = canProcess(DOCUMENT_PRINT_PROCESSES.sendSupportPlan);
  const [printError, setPrintError] = useState("");
  const [printMessage, setPrintMessage] = useState("");
  const [sendError, setSendError] = useState("");
  const [sendMessage, setSendMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [registryDocumentNo, setRegistryDocumentNo] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const templateOptions = listTemplatesForProcess(DOCUMENT_PRINT_PROCESSES.printSupportPlan, "client");
  const activeTemplate =
    resolveTemplate(DOCUMENT_PRINT_PROCESSES.printSupportPlan, "client") ??
    templateOptions[0] ??
    defaultSupportPlanTemplate();
  const { getOptions } = useReferenceData();
  const stored = getSupportPlanByClientId(clientId);
  const [draft, setDraft] = useState<SupportPlanRecord | null>(null);
  const [section, setSection] = useState(supportPlanSections[0]?.id ?? "about");
  const plan = draft ?? stored ?? null;
  const activeSection = supportPlanSections.find((s) => s.id === section) ?? supportPlanSections[0];

  const referenceDropdowns = useMemo(
    () => ({
      goalNumber: getOptions("goalNumber"),
      goalTerm: getOptions("goalTerm"),
      goalType: getOptions("goalType"),
      ndisGoalCategory: getOptions("ndisGoalCategory"),
      healthPlanType: getOptions("healthPlanType"),
      supportRequirementArea: getOptions("supportRequirementArea"),
      supportAssistanceLevel: getOptions("supportAssistanceLevel"),
      supportFrequency: getOptions("supportFrequency"),
    }),
    [getOptions]
  );

  const printContext = useMemo((): SupportPlanDocumentContext | null => {
    if (!plan) return null;
    return {
      client,
      plan,
      organization,
      serviceBookings: getServiceBookingsByClientId(clientId),
      rosterShifts: rosterShifts.filter((shift) => shift.clientId === clientId),
      planDocuments: getPlanDocumentsByClientId(clientId),
      resolvePartnerName: (partnerId) => businessPartners.find((bp) => bp.id === partnerId)?.name,
      resolveEmployeeName: (employeeId) => getEmployeeById(employeeId)?.name,
    };
  }, [
    businessPartners,
    client,
    clientId,
    getEmployeeById,
    getPlanDocumentsByClientId,
    getServiceBookingsByClientId,
    organization,
    plan,
    rosterShifts,
  ]);

  async function handlePrintSupportPlan() {
    setPrintError("");
    setPrintMessage("");
    if (!printContext || !activeTemplate) {
      setPrintError("No active support plan template is available.");
      return;
    }
    const entityLabel = `${client.searchKey} — Support plan ${plan?.documentNo ?? ""}`.trim();
    const ok = printPhase2Document(printContext, activeTemplate);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printSupportPlan,
        entityType: "client",
        entityId: client.id,
        entityLabel,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportPhase2DocumentHtml(printContext, activeTemplate);
    if (exported) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printSupportPlan,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "client",
          entityId: client.id,
          entityLabel,
          fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-support-plan.html`,
        });
        setPrintMessage("Support plan saved to the document registry.");
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  }

  async function handleDownloadSupportPlanPdf() {
    setPrintError("");
    setPrintMessage("");
    if (!printContext || !activeTemplate) {
      setPrintError("No active support plan template is available.");
      return;
    }
    const exported = exportPhase2DocumentHtml(printContext, activeTemplate);
    if (!exported) {
      setPrintError("Could not generate the document. Check the support plan and organisation profile.");
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
        entityLabel: `${client.searchKey} — Support plan ${plan?.documentNo ?? ""}`.trim(),
        fileName: pdfFileName(`${client.searchKey}-support-plan-${plan?.documentNo ?? "plan"}`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printSupportPlan,
        entityType: "client",
        entityId: client.id,
        entityLabel: `${client.searchKey} — Support plan ${plan?.documentNo ?? ""}`.trim(),
        detail: "PDF download",
      });
      setPrintMessage("Support plan PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handleSendSupportPlan() {
    setSendError("");
    setSendMessage("");
    setPrintError("");
    if (!printContext || !activeTemplate) {
      setSendError("No active support plan template is available.");
      return;
    }
    const exported = exportPhase2DocumentHtml(printContext, activeTemplate);
    if (!exported) {
      setSendError("Could not generate the document. Check the support plan and organisation profile.");
      return;
    }
    const recipientName = client.preferredName?.trim() || client.name?.trim() || client.searchKey;
    const orgName = organizationDisplayName(organization);
    const pdfName = pdfFileName(`${client.searchKey}-support-plan-${plan?.documentNo ?? "plan"}`);
    setSending(true);
    try {
      const res = await fetch("/api/documents/send-support-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityId: client.id,
          entityLabel: `${client.searchKey} — Support plan ${plan?.documentNo ?? ""}`.trim(),
          fileName: `${client.searchKey.replace(/[^\w.-]+/g, "_")}-support-plan.html`,
          pdfFileName: pdfName,
          recipientEmail: client.email,
          recipientName,
          emailPlaceholders: {
            orgName,
            recipientName,
            recipientEmail: client.email?.trim() || "",
            planDocumentNo: plan?.documentNo ?? "",
            entityLabel: `${client.searchKey} — Support plan ${plan?.documentNo ?? ""}`.trim(),
          },
        }),
      });
      const payload = (await res.json()) as {
        error?: string;
        message?: string;
        documentNo?: string;
        pdfBase64?: string;
        attachmentFileName?: string;
        mailtoUrl?: string | null;
        subject?: string;
        body?: string;
      };
      if (!res.ok) {
        setSendError(payload.error ?? "Could not send the support plan.");
        return;
      }
      if (payload.documentNo) setRegistryDocumentNo(payload.documentNo);
      if (payload.pdfBase64 && payload.attachmentFileName) {
        const handoff = await launchEmailWithPdfAttachment({
          pdfBase64: payload.pdfBase64,
          fileName: payload.attachmentFileName,
          mailtoUrl: payload.mailtoUrl ?? null,
          subject: payload.subject ?? "",
          body: payload.body ?? "",
        });
        setSendMessage(`${payload.message ?? "Support plan sent."} ${emailHandoffMessage(handoff)}`);
      } else if (payload.mailtoUrl) {
        window.location.href = payload.mailtoUrl;
        setSendMessage(payload.message ?? "Support plan saved — email draft opened.");
      } else {
        const registryNote = payload.documentNo ? ` Registry reference ${payload.documentNo}.` : "";
        setSendMessage(`${payload.message ?? "Support plan sent in-system."}${registryNote}`);
      }
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.sendSupportPlan,
        entityType: "client",
        entityId: client.id,
        entityLabel: `${client.searchKey} — Support plan ${plan?.documentNo ?? ""}`.trim(),
        detail: payload.documentNo ? `Registry ${payload.documentNo}` : undefined,
      });
      setHistoryRefresh((n) => n + 1);
    } catch {
      setSendError("Could not send the support plan. Try again.");
    } finally {
      setSending(false);
    }
  }

  if (!plan) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
        <p className="text-sm text-slate-600">No support plan for this client yet.</p>
        <p className="mt-1 text-xs text-slate-500">Create one from Plan &amp; Assessment or add sample data.</p>
      </div>
    );
  }

  function onChange<K extends keyof SupportPlanRecord>(key: K, value: SupportPlanRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    onDirty?.(true);
  }

  function save() {
    if (!plan) return;
    upsertSupportPlan(plan);
    setDraft(null);
    onDirty?.(false);
  }

  function discard() {
    setDraft(null);
    onDirty?.(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#f9a8d4]/60 bg-gradient-to-br from-[#fdf2f8] to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">Support plan</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Document {plan.documentNo}</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{plan.description}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>Provided {formatContractDate(plan.providedToReceiver)}</p>
            <p>{plan.active ? "Active" : "Inactive"}</p>
          </div>
        </div>
        {draft ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              Save support plan
            </button>
            <button
              type="button"
              onClick={discard}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Discard
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <nav className="flex shrink-0 flex-wrap gap-1 lg:w-52 lg:flex-col">
          {supportPlanSections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                section === s.id
                  ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                  : "text-slate-600 hover:bg-white/80"
              }`}
            >
              {s.label}
            </button>
          ))}
          {lineTableSections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                section === s.id
                  ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                  : "text-slate-600 hover:bg-white/80"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {section === "goals" ? (
            <LineItemTable
              config={goalTableConfig}
              rows={plan.goals}
              dropdowns={referenceDropdowns}
              onChange={(rows) => onChange("goals", rows)}
            />
          ) : section === "health-records" ? (
            <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-5">
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Medications</h4>
                <LineItemTable
                  config={medicationTableConfig}
                  rows={plan.medications ?? []}
                  onChange={(rows) => onChange("medications", rows)}
                />
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Diagnoses</h4>
                <LineItemTable
                  config={diagnosisTableConfig}
                  rows={plan.diagnoses ?? []}
                  onChange={(rows) => onChange("diagnoses", rows)}
                />
              </div>
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Health plans</h4>
                <LineItemTable
                  config={healthPlanTableConfig}
                  rows={plan.healthPlans ?? []}
                  dropdowns={referenceDropdowns}
                  onChange={(rows) => onChange("healthPlans", rows)}
                />
              </div>
            </div>
          ) : section === "support-requirements" ? (
            <LineItemTable
              config={supportRequirementTableConfig}
              rows={plan.supportRequirements ?? []}
              dropdowns={referenceDropdowns}
              onChange={(rows) => onChange("supportRequirements", rows)}
            />
          ) : section === "assistive-technology" ? (
            <LineItemTable
              config={assistiveTechnologyTableConfig}
              rows={plan.assistiveTechnology ?? []}
              onChange={(rows) => onChange("assistiveTechnology", rows)}
            />
          ) : (
            <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
              {activeSection?.fields.map((field) => (
                <SupportPlanField key={field.key} field={field} plan={plan} onChange={onChange} getOptions={getOptions} />
              ))}
            </div>
          )}
        </div>
      </div>

      {canPrint || canSend ? (
        <RecordDocumentsSection
          entityType="client"
          entityId={client.id}
          refreshKey={historyRefresh}
          error={printError || sendError || undefined}
          message={printMessage || sendMessage || undefined}
          actions={[
            ...(canPrint
              ? [
                  {
                    processId: DOCUMENT_PRINT_PROCESSES.printSupportPlan,
                    label: "Print",
                    onClick: () => void handlePrintSupportPlan(),
                  },
                  {
                    processId: DOCUMENT_PRINT_PROCESSES.printSupportPlan,
                    label: "PDF",
                    onClick: () => void handleDownloadSupportPlanPdf(),
                    busy: pdfBusy,
                  },
                ]
              : []),
            ...(canSend
              ? [
                  {
                    processId: DOCUMENT_PRINT_PROCESSES.sendSupportPlan,
                    label: DOCUMENT_SEND_VIA_EMAIL_LABEL,
                    onClick: () => void handleSendSupportPlan(),
                    busy: sending,
                    variant: "primary" as const,
                  },
                ]
              : []),
          ]}
        />
      ) : null}
    </div>
  );
}

export function ClientPlanAssessmentPanel({ clientId }: { clientId: string }) {
  const { getPlanDocumentsByClientId, getSupportPlanByClientId } = useData();
  const documents = getPlanDocumentsByClientId(clientId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Plan and assessment documents for this client. Support plans open from here.
      </p>
      {documents.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Document no</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plan type</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const plan = doc.supportPlanId ? getSupportPlanByClientId(clientId) : null;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{doc.documentNo}</td>
                    <td className="px-4 py-3">{doc.documentType}</td>
                    <td className="px-4 py-3">
                      {doc.planType === "Support Plan" && plan ? (
                        <Link
                          href={`/clients/${clientId}?tab=Support%20Plan`}
                          className="text-[#b51266] hover:underline"
                        >
                          {doc.planType} ({plan.documentNo})
                        </Link>
                      ) : (
                        doc.planType
                      )}
                    </td>
                    <td className="px-4 py-3">{formatContractDate(doc.reviewDate)}</td>
                    <td className="px-4 py-3">{doc.documentStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-sm text-slate-600">
          No plan documents yet.
        </div>
      )}
    </div>
  );
}
