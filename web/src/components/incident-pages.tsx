"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { IncidentTabbedView } from "@/components/incident-view";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { useData } from "@/lib/data-store";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { canSeeAllIncidents, canViewIncidentRecord } from "@/lib/incident-list-access";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { exportPhase2DocumentHtml, printPhase2Document } from "@/lib/phase2-document-print";
import { useOrganization } from "@/lib/organization-store";
import {
  advanceIncidentWorkflow,
  isNdisReportOverdue,
  ndisDeadlineLabel,
  statusTone,
  type IncidentActionRow,
  type IncidentEvidenceRow,
  type IncidentNotificationRow,
  type IncidentPartyRow,
  type IncidentRecord,
} from "@/lib/incident";

const toneClasses: Record<string, string> = {
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  amber: "bg-amber-50 text-amber-900 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  rose: "bg-rose-50 text-rose-800 ring-rose-200",
  violet: "bg-violet-50 text-violet-900 ring-violet-200",
};

function IncidentTabbedViewFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>;
}

export function IncidentDetailView({ id }: { id: string }) {
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get("submitted") === "1";
  const { incidents, updateIncident, clients } = useData();
  const { session, canProcess, canWindow } = useAuth();
  const { organization } = useOrganization();
  const { resolveTemplate } = useDocumentPlatform();
  const canPrintNotification = canProcess(DOCUMENT_PRINT_PROCESSES.printIncidentNotification);
  const canSaveIncident = useModuleSaveAccess("incidents", "incident");
  const stored = incidents.find((r) => r.id === id);
  const [draft, setDraft] = useState<IncidentRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [printError, setPrintError] = useState("");
  const [printMessage, setPrintMessage] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const record = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);

  if (stored && session && !canViewIncidentRecord(stored, session, canSeeAllIncidents(canWindow))) {
    return (
      <AppShell
        title="Incident not available"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Incidents", href: "/incidents" },
          { label: "Not available" },
        ]}
        audit={{ moduleLabel: "Incidents" }}
      >
        <p className="text-slate-600">You can only open incident reports that you submitted and that are still open.</p>
        <Link href="/incidents" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to incidents
        </Link>
      </AppShell>
    );
  }

  if (!record) {
    return (
      <AppShell
        title="Incident not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Incidents", href: "/incidents" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Incident not found" }}
      >
        <p className="text-slate-600">No record with ID {id}.</p>
        <Link href="/incidents" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to incidents
        </Link>
      </AppShell>
    );
  }

  function patch(next: IncidentRecord) {
    setDraft({ ...next, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onChange(key: keyof IncidentRecord, value: string | boolean) {
    const base = draft ?? stored;
    if (!base) return;
    patch({ ...base, [key]: value });
  }

  function onPartiesChange(rows: IncidentPartyRow[]) {
    const base = draft ?? stored;
    if (!base) return;
    patch({ ...base, parties: rows });
  }

  function onActionsChange(rows: IncidentActionRow[]) {
    const base = draft ?? stored;
    if (!base) return;
    patch({ ...base, actions: rows });
  }

  function onNotificationsChange(rows: IncidentNotificationRow[]) {
    const base = draft ?? stored;
    if (!base) return;
    patch({ ...base, notifications: rows });
  }

  function onEvidenceChange(rows: IncidentEvidenceRow[]) {
    const base = draft ?? stored;
    if (!base) return;
    patch({ ...base, evidence: rows });
  }

  function onWorkflowAdvance(step: "manager_review" | "commission_notified") {
    const base = draft ?? stored;
    if (!base || !session) return;
    patch(advanceIncidentWorkflow(base, step, session.displayName));
  }

  function onSave() {
    if (!record) return;
    updateIncident(record);
    setDraft(null);
    setSaved(true);
    showSuccessToast(SAVE_TOAST_MESSAGES.saved);
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  const primaryClient = clients.find((c) => c.id === record.primaryClientId);

  async function handlePrintNotification() {
    if (!record) return;
    setPrintError("");
    setPrintMessage("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printIncidentNotification, "incident");
    if (!template) {
      setPrintError("No active incident notification template is available.");
      return;
    }
    const ctx = { incident: record, client: primaryClient, organization };
    const ok = printPhase2Document(ctx, template);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printIncidentNotification,
        entityType: "incident",
        entityId: record.id,
        entityLabel: record.documentNo,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportPhase2DocumentHtml(ctx, template);
    if (exported) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printIncidentNotification,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "incident",
          entityId: record.id,
          entityLabel: record.documentNo,
          fileName: `${record.documentNo.replace(/[^\w.-]+/g, "_")}-notification.html`,
        });
        setPrintMessage("Notification saved to the document registry.");
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  }

  async function handleDownloadPdf() {
    if (!record) return;
    setPrintError("");
    setPrintMessage("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printIncidentNotification, "incident");
    if (!template) {
      setPrintError("No active incident notification template is available.");
      return;
    }
    const ctx = { incident: record, client: primaryClient, organization };
    const exported = exportPhase2DocumentHtml(ctx, template);
    if (!exported) {
      setPrintError("Could not generate the document. Check incident fields and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "incident",
        entityId: record.id,
        entityLabel: record.documentNo,
        fileName: pdfFileName(`${record.documentNo}-notification`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printIncidentNotification,
        entityType: "incident",
        entityId: record.id,
        entityLabel: record.documentNo,
        detail: "PDF download",
      });
      setPrintMessage("Notification PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  }

  const tone = statusTone(record.status);

  return (
    <>
      <AppShell
        title={`${record.documentNo}${record.title ? ` — ${record.title}` : ""}`}
        subtitle="Incident tracking and NDIS safeguard reporting"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Incidents", href: "/incidents" },
          { label: record.documentNo },
        ]}
        actions={
          <>
            <Link
              href="/incidents"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Back
            </Link>
          </>
        }
        audit={{
          entityType: "incident",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {justSubmitted ? (
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm text-emerald-800">
              Incident submitted. Add investigation notes and notifications on the tabs below.
            </span>
          ) : null}
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]}`}
          >
            {record.status}
          </span>
          {record.isReportable ? (
            <span
              className={`text-xs font-medium ${
                isNdisReportOverdue(record) ? "text-rose-700" : "text-amber-800"
              }`}
            >
              {ndisDeadlineLabel(record)}
            </span>
          ) : null}
          {saved && !hasUnsavedChanges ? <span className="text-sm text-emerald-700">Saved</span> : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <Suspense fallback={<IncidentTabbedViewFallback />}>
            <IncidentTabbedView
              record={record}
              onChange={onChange}
              onPartiesChange={onPartiesChange}
              onActionsChange={onActionsChange}
              onNotificationsChange={onNotificationsChange}
              onEvidenceChange={onEvidenceChange}
              onWorkflowAdvance={onWorkflowAdvance}
            />
          </Suspense>
        </div>

        {canPrintNotification ? (
          <RecordDocumentsSection
            entityType="incident"
            entityId={record.id}
            refreshKey={historyRefresh}
            error={printError || undefined}
            message={printMessage || undefined}
            actions={[
              {
                processId: DOCUMENT_PRINT_PROCESSES.printIncidentNotification,
                label: "Print",
                onClick: () => void handlePrintNotification(),
              },
              {
                processId: DOCUMENT_PRINT_PROCESSES.printIncidentNotification,
                label: "PDF",
                onClick: () => void handleDownloadPdf(),
                busy: pdfBusy,
              },
            ]}
          />
        ) : null}
      </AppShell>

      <UnsavedChangesBar visible={hasUnsavedChanges && canSaveIncident} onSave={onSave} onDiscard={onDiscard} />
    </>
  );
}
