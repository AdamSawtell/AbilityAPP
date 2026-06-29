"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { EnquiryCoreSummary } from "@/components/enquiry-core-summary";
import { EnquiryCrmSyncPanel } from "@/components/enquiry-crm-sync-panel";
import { EnquiryPipelinePanel } from "@/components/enquiry-pipeline-panel";
import { EnquiryTabbedView } from "@/components/enquiry-view";
import { ClientRecordLink } from "@/components/record-link";
import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useModuleSaveAccess } from "@/lib/access/use-detail-write-access";
import { useConvertEnquiry, useData } from "@/lib/data-store";
import { useAuth } from "@/lib/auth-store";
import { useWorkspace, workspaceKey } from "@/lib/workspace-store";
import type { EnquiryActivityRow, EnquiryRecord } from "@/lib/enquiry";
import { normalizeEnquiry } from "@/lib/enquiry";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { exportExtendedDocumentHtml, printExtendedDocument } from "@/lib/extended-document-print";
import { useOrganization } from "@/lib/organization-store";
import {
  applyEnquiryStatusChange,
  enquiryPipelineBlocked,
  validateEnquiryPipeline,
} from "@/lib/enquiry-pipeline";

function EnquiryTabbedViewFallback() {
  return <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading…</div>;
}

export function EnquiryDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { enquiries, updateEnquiry, getClientByEnquiryId } = useData();
  const convert = useConvertEnquiry();
  const { canProcess, session, canWriteWindow } = useAuth();
  const { organization } = useOrganization();
  const { resolveTemplate } = useDocumentPlatform();
  const canPrintAck = canProcess(DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement);
  const [printError, setPrintError] = useState("");
  const [printMessage, setPrintMessage] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const canSaveEnquiry = useModuleSaveAccess("enquiries", "enquiry");
  const canSyncCrm = canWriteWindow("enquiries");
  const { openEnquiry, setTabDirty } = useWorkspace();
  const stored = enquiries.find((r) => r.id === id);
  const linkedClient = getClientByEnquiryId(id);
  const [draft, setDraft] = useState<EnquiryRecord | null>(null);
  const [saved, setSaved] = useState(false);
  const [converting, setConverting] = useState(false);

  const record = draft ?? stored ?? null;
  const hasUnsavedChanges = Boolean(draft);
  const tabKey = workspaceKey("enquiry", id);

  const pipelineIssues = useMemo(() => {
    if (!record) return [];
    return validateEnquiryPipeline(record, stored?.status);
  }, [record, stored?.status]);
  const saveBlocked = enquiryPipelineBlocked(pipelineIssues);

  useEffect(() => {
    if (!stored) return;
    openEnquiry(stored.id, stored.documentNo, `${stored.firstName} ${stored.lastName}`.trim());
  }, [id, stored, openEnquiry]);

  useEffect(() => {
    setTabDirty(tabKey, hasUnsavedChanges);
  }, [tabKey, hasUnsavedChanges, setTabDirty]);

  if (!record) {
    return (
      <AppShell
        title="Enquiry not found"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Enquiries", href: "/enquiries" },
          { label: "Not found" },
        ]}
        audit={{ moduleLabel: "Enquiries" }}
      >
        <p className="text-slate-600">No record with ID {id}.</p>
        <Link href="/enquiries" className="mt-4 inline-block text-[#b51266] hover:underline">
          Back to enquiries
        </Link>
      </AppShell>
    );
  }

  const isConverted = Boolean(linkedClient);
  const participantName = `${record.firstName} ${record.lastName}`.trim();

  function onChange(key: keyof EnquiryRecord, value: string) {
    const base = draft ?? stored;
    if (!base) return;
    let next = { ...base, [key]: value, updatedBy: "SuperUser" };
    if (key === "status") {
      next = applyEnquiryStatusChange(next, value);
    }
    setDraft(normalizeEnquiry(next));
    setSaved(false);
  }

  function onActivityChange(rows: EnquiryActivityRow[]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, activity: rows, updatedBy: "SuperUser" });
    setSaved(false);
  }

  function onSave() {
    if (!record || saveBlocked) return;
    updateEnquiry(normalizeEnquiry(record));
    setDraft(null);
    setSaved(true);
    showSuccessToast(SAVE_TOAST_MESSAGES.saved);
  }

  function onDiscard() {
    setDraft(null);
    setSaved(false);
  }

  function onConvert() {
    setConverting(true);
    const client = convert(id);
    if (client) {
      router.push(`/clients/${client.id}?tab=${encodeURIComponent("Activity")}`);
    }
    setConverting(false);
  }

  async function handlePrintAcknowledgement() {
    if (!record) return;
    setPrintError("");
    setPrintMessage("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement, "enquiry");
    if (!template) {
      setPrintError("No active enquiry acknowledgement template is available.");
      return;
    }
    const ok = printExtendedDocument({ enquiry: record, organization }, template);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement,
        entityType: "enquiry",
        entityId: record.id,
        entityLabel: record.documentNo,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportExtendedDocumentHtml({ enquiry: record, organization }, template);
    if (exported) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "enquiry",
          entityId: record.id,
          entityLabel: record.documentNo,
          fileName: `${record.documentNo.replace(/[^\w.-]+/g, "_")}-ack.html`,
        });
        setPrintMessage("Acknowledgement saved to the document registry.");
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
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement, "enquiry");
    if (!template) {
      setPrintError("No active enquiry acknowledgement template is available.");
      return;
    }
    const exported = exportExtendedDocumentHtml({ enquiry: record, organization }, template);
    if (!exported) {
      setPrintError("Could not generate the document. Check enquiry fields and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "enquiry",
        entityId: record.id,
        entityLabel: record.documentNo,
        fileName: pdfFileName(`${record.documentNo}-ack`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement,
        entityType: "enquiry",
        entityId: record.id,
        entityLabel: record.documentNo,
        detail: "PDF download",
      });
      setPrintMessage("Acknowledgement PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <>
      <AppShell
        title={`Enquiry ${record.documentNo}`}
        subtitle={participantName || "Participant details"}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Enquiries", href: "/enquiries" },
          { label: record.documentNo },
        ]}
        actions={
          <>
            <Link
              href="/enquiries"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Back
            </Link>
            {linkedClient ? (
              <ClientRecordLink
                id={linkedClient.id}
                searchKey={linkedClient.searchKey}
                name={linkedClient.name}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm hover:bg-emerald-100"
              >
                View client
              </ClientRecordLink>
            ) : canProcess("enquiry-to-client") ? (
              <button
                type="button"
                disabled={converting || isConverted || hasUnsavedChanges}
                title={hasUnsavedChanges ? "Save changes before converting" : undefined}
                onClick={onConvert}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isConverted ? "Converted" : converting ? "Converting…" : "Convert to client"}
              </button>
            ) : null}
          </>
        }
        audit={{
          entityType: "enquiry",
          entityId: record.id,
          meta: auditMetaFrom(stored ?? record),
        }}
      >
        <EnquiryCoreSummary
          record={record}
          participantName={participantName}
          linkedClient={linkedClient}
          saved={saved && !hasUnsavedChanges}
        />


        <div className="mb-6">
          <EnquiryPipelinePanel status={record.status} issues={pipelineIssues} />
        </div>

        <div className="mb-6">
          <EnquiryCrmSyncPanel
            enquiry={record}
            canSync={canSyncCrm}
            actorName={session?.displayName ?? "SuperUser"}
            onSynced={(next) => {
              updateEnquiry(normalizeEnquiry(next));
              if (draft?.id === next.id) {
                setDraft(null);
              }
            }}
          />
        </div>

        <Suspense fallback={<EnquiryTabbedViewFallback />}>
          <EnquiryTabbedView
            record={record}
            participantName={participantName}
            onChange={onChange}
            onActivityChange={onActivityChange}
          />
        </Suspense>

        {canPrintAck ? (
          <RecordDocumentsSection
            entityType="enquiry"
            entityId={record.id}
            refreshKey={historyRefresh}
            error={printError || undefined}
            message={printMessage || undefined}
            actions={[
              {
                processId: DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement,
                label: "Print",
                onClick: () => void handlePrintAcknowledgement(),
              },
              {
                processId: DOCUMENT_PRINT_PROCESSES.printEnquiryAcknowledgement,
                label: "PDF",
                onClick: () => void handleDownloadPdf(),
                busy: pdfBusy,
              },
            ]}
          />
        ) : null}
      </AppShell>

      <UnsavedChangesBar
        visible={hasUnsavedChanges && canSaveEnquiry}
        onSave={onSave}
        onDiscard={onDiscard}
        saveDisabled={saveBlocked}
        message={saveBlocked ? "Fix pipeline errors before you can save." : "You have unsaved changes"}
      />
    </>
  );
}
