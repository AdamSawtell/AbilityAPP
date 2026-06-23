"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { exportPhase2DocumentHtml, printPhase2Document } from "@/lib/phase2-document-print";
import { formatPlanMonthLabel, currentPlanMonthIso } from "@/lib/monthly-service-plan";
import {
  auditPackManifestCsv,
  auditPackSectionCsv,
  auditPackStatusClass,
  evaluateAuditPack,
  type AuditPackContext,
} from "@/lib/ndis-audit-pack";
import { downloadCsv } from "@/lib/reports/export";
import { useOrganization } from "@/lib/organization-store";

function buildContext(data: ReturnType<typeof useData>): AuditPackContext {
  return {
    clients: data.clients,
    employees: data.employees,
    serviceAgreements: data.serviceAgreements,
    incidents: data.incidents,
    monthlyServicePlans: data.monthlyServicePlans,
    timesheets: data.timesheets,
    rosterShifts: data.rosterShifts,
    locations: data.locations,
    claims: data.claims,
    invoices: data.invoices,
    payrollClosedPeriods: data.payrollClosedPeriods,
    financialClosedMonths: data.financialClosedMonths,
  };
}

export function NdisAuditPackView() {
  const data = useData();
  const { canWindow, canWriteWindow, canProcess } = useAuth();
  const { organization } = useOrganization();
  const { resolveTemplate } = useDocumentPlatform();
  const canView = canWindow("ndis-audit-pack");
  const canExport = canWriteWindow("ndis-audit-pack");
  const canPrint = canProcess(DOCUMENT_PRINT_PROCESSES.printAuditPack);

  const [auditMonth, setAuditMonth] = useState(currentPlanMonthIso());
  const [printError, setPrintError] = useState("");
  const [printMessage, setPrintMessage] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const ctx = useMemo(() => buildContext(data), [data]);
  const evaluation = useMemo(() => evaluateAuditPack(ctx, auditMonth), [ctx, auditMonth]);

  const monthOptions = useMemo(() => {
    const months = new Set(data.monthlyServicePlans.map((plan) => plan.planMonth).filter(Boolean));
    for (const claim of data.claims) {
      if (claim.periodStart) months.add(claim.periodStart.slice(0, 7));
    }
    months.add(auditMonth);
    return [...months].filter(Boolean).sort((a, b) => b.localeCompare(a));
  }, [data.claims, data.monthlyServicePlans, auditMonth]);

  if (!canView) {
    return (
      <p className="text-sm text-slate-500">
        Your role does not have access to the NDIS audit pack. Ask an administrator to grant the NDIS audit pack window.
      </p>
    );
  }

  const handleManifestExport = () => {
    downloadCsv(`ndis-audit-pack-manifest-${auditMonth}.csv`, auditPackManifestCsv(evaluation));
  };

  const handleSectionExport = (sectionCode: string, label: string) => {
    const content = auditPackSectionCsv(ctx, evaluation, sectionCode);
    if (!content) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    downloadCsv(`ndis-audit-pack-${slug}-${auditMonth}.csv`, content);
  };

  async function handlePrintAuditPack() {
    setPrintError("");
    setPrintMessage("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printAuditPack, "audit-pack");
    if (!template) {
      setPrintError("No active audit pack template is available.");
      return;
    }
    const printCtx = { evaluation, organization };
    const ok = printPhase2Document(printCtx, template);
    if (!ok) {
      setPrintError("Could not open the print window. Allow pop-ups for this site and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printAuditPack,
        entityType: "audit-pack",
        entityId: `audit-${auditMonth}`,
        entityLabel: `Audit pack ${auditMonth}`,
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportPhase2DocumentHtml(printCtx, template);
    if (exported) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printAuditPack,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "audit-pack",
          entityId: `audit-${auditMonth}`,
          entityLabel: `Audit pack ${auditMonth}`,
          fileName: `ndis-audit-pack-${auditMonth}.html`,
        });
        setPrintMessage("Audit pack saved to the document registry.");
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  }

  async function handleDownloadPdf() {
    setPrintError("");
    setPrintMessage("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printAuditPack, "audit-pack");
    if (!template) {
      setPrintError("No active audit pack template is available.");
      return;
    }
    const printCtx = { evaluation, organization };
    const exported = exportPhase2DocumentHtml(printCtx, template);
    if (!exported) {
      setPrintError("Could not generate the document. Check audit pack data and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "audit-pack",
        entityId: `audit-${auditMonth}`,
        entityLabel: `Audit pack ${auditMonth}`,
        fileName: pdfFileName(`ndis-audit-pack-${auditMonth}`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printAuditPack,
        entityType: "audit-pack",
        entityId: `audit-${auditMonth}`,
        entityLabel: `Audit pack ${auditMonth}`,
        detail: "PDF download",
      });
      setPrintMessage("Audit pack PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Prepare an NDIS audit evidence pack for a selected month — review section readiness, then export the manifest and
        supporting CSV extracts for quality and compliance review.
      </p>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-slate-600">Audit month</span>
          <input
            type="month"
            value={auditMonth}
            onChange={(e) => setAuditMonth(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </label>
        {monthOptions.length > 1 ? (
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Quick pick</span>
            <select
              value={auditMonth}
              onChange={(e) => setAuditMonth(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {formatPlanMonthLabel(month)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        {canExport ? (
          <button
            type="button"
            onClick={handleManifestExport}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export manifest
          </button>
        ) : null}
        <Link
          href="/financial-close"
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Financial close
        </Link>
      </div>

      <div
        className={`rounded-xl border px-4 py-3 ${
          evaluation.readyForAudit ? "border-emerald-200 bg-emerald-50/80" : "border-amber-200 bg-amber-50/80"
        }`}
      >
        <p className="text-sm font-semibold text-slate-900">
          {evaluation.readyForAudit ? "Audit pack ready to export" : "Resolve blocked sections before audit handoff"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Period {evaluation.periodStart} – {evaluation.periodEnd} · Generated {evaluation.generatedAt.slice(0, 10)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Participants</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{evaluation.summary.participantCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Timesheets</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{evaluation.summary.timesheetCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reportable incidents</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{evaluation.summary.reportableIncidentCount}</p>
        </div>
      </div>

      <div className="space-y-3">
        {evaluation.sections.map((section) => (
          <div
            key={section.code}
            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-900">{section.label}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${auditPackStatusClass(section.status)}`}
                >
                  {section.status}
                </span>
                <span className="text-xs text-slate-500">{section.rowCount} rows</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{section.message}</p>
              <p className="mt-1 text-xs text-slate-500">{section.description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {section.href ? (
                <Link
                  href={section.href}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Review
                </Link>
              ) : null}
              {canExport ? (
                <button
                  type="button"
                  onClick={() => handleSectionExport(section.code, section.label)}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Export CSV
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {canPrint ? (
        <RecordDocumentsSection
          entityType="audit-pack"
          entityId={`audit-${auditMonth}`}
          refreshKey={historyRefresh}
          error={printError || undefined}
          message={printMessage || undefined}
          actions={[
            {
              processId: DOCUMENT_PRINT_PROCESSES.printAuditPack,
              label: "Print",
              onClick: () => void handlePrintAuditPack(),
            },
            {
              processId: DOCUMENT_PRINT_PROCESSES.printAuditPack,
              label: "PDF",
              onClick: () => void handleDownloadPdf(),
              busy: pdfBusy,
            },
          ]}
        />
      ) : null}
    </div>
  );
}
