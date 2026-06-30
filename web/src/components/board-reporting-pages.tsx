"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { UnsavedChangesBar, type SaveConfirmation } from "@/components/unsaved-changes-bar";
import { useAuth } from "@/lib/auth-store";
import { auditMetaFrom } from "@/lib/audit";
import { SAVE_TOAST_MESSAGES, showSuccessToast } from "@/lib/toast";
import { buildBoardReportEvalContext, refreshBoardReportPackSections } from "@/lib/board-report-evaluators";
import {
  boardReportPackIsLocked,
  boardReportStatusClass,
  boardReportTrafficClass,
  createBoardReportPack,
  formatBoardReportPeriod,
  normalizeBoardReportPack,
  reorderBoardReportSections,
  visibleBoardReportSections,
  type BoardReportPackRecord,
  type BoardReportPackSection,
} from "@/lib/board-report-pack";
import { printBoardReportPack } from "@/lib/board-report-print";
import { boardReportRegistryLabel } from "@/lib/document-render-extended";
import { RecordDocumentsSection } from "@/components/record-documents-section";
import { auditDocumentProcess, registerDocumentWithAudit } from "@/lib/document-print-audit";
import { downloadDocumentPdf, pdfFileName } from "@/lib/document-pdf.client";
import { useDocumentPlatform } from "@/lib/document-platform-store";
import { DOCUMENT_PRINT_PROCESSES } from "@/lib/document-template";
import { exportExtendedDocumentHtml } from "@/lib/extended-document-print";
import { defaultBoardReportTemplate } from "@/lib/board-report-template";
import { currentPlanMonthIso } from "@/lib/monthly-service-plan";
import { useOrganization } from "@/lib/organization-store";
import { useData } from "@/lib/data-store";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function SectionPreview({ section }: { section: BoardReportPackSection }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${boardReportTrafficClass(section.trafficLight)}`}>
          {section.trafficLight === "none" ? "No indicator" : section.trafficLight}
        </span>
        <p className="text-sm text-slate-600">{section.statusMessage || "—"}</p>
      </div>
      {section.snapshot.metrics.length ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {section.snapshot.metrics.map((metric) => (
            <div key={metric.label} className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{metric.value}</p>
            </div>
          ))}
        </div>
      ) : null}
      {section.snapshot.tables.map((table) => (
        <div key={table.title} className="overflow-x-auto rounded-lg border border-slate-200">
          <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{table.title}</p>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                {table.headers.map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {row.map((cell, j) => (
                    <td key={j} className="px-3 py-2 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {section.snapshot.bullets.length ? (
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
          {section.snapshot.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      ) : null}
      {section.commentary.trim() ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-700">{section.commentary}</div>
      ) : null}
    </div>
  );
}

export function BoardReportingListView() {
  const { boardReportPacks } = useData();
  const { session, canWindow, canWriteWindow } = useAuth();
  const canView = canWindow("board-reporting");
  const canWrite = canWriteWindow("board-reporting");
  const isBoardViewer = session?.activeRoleId === "role-board" && !canWrite;

  const rows = useMemo(() => {
    let list = [...boardReportPacks].sort((a, b) => (b.reportPeriod || "").localeCompare(a.reportPeriod || ""));
    if (isBoardViewer) list = list.filter((r) => r.status === "Published");
    return list;
  }, [boardReportPacks, isBoardViewer]);

  if (!canView) {
    return <p className="text-sm text-slate-500">Your role does not have access to Board Reporting.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Generate NDIS board report packs with configurable sections, executive commentary, and printable export.
        </p>
        {canWrite ? (
          <Link
            href="/board-reporting/new"
            className="inline-flex rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            New board report
          </Link>
        ) : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Report</th>
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sections</th>
              <th className="px-4 py-3">Published</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                <td className="px-4 py-3">
                  <Link href={`/board-reporting/${row.id}`} className="font-medium text-[#b51266] hover:underline">
                    {row.title}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatBoardReportPeriod(row.reportPeriod)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${boardReportStatusClass(row.status)}`}>{row.status}</span>
                </td>
                <td className="px-4 py-3">{visibleBoardReportSections(row).length}</td>
                <td className="px-4 py-3 text-slate-600">{row.publishedAt ? new Date(row.publishedAt).toLocaleDateString("en-AU") : "—"}</td>
              </tr>
            ))}
            {!rows.length ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {isBoardViewer ? "No published board reports yet." : "No board reports yet — create a report for the current period."}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BoardReportingCreateView() {
  const data = useData();
  const router = useRouter();
  const { session, canWriteWindow } = useAuth();
  const canWrite = canWriteWindow("board-reporting");
  const [reportPeriod, setReportPeriod] = useState(currentPlanMonthIso());
  const template = data.boardReportTemplates[0] ?? defaultBoardReportTemplate();

  const handleCreate = () => {
    if (!canWrite) return;
    const actor = session?.displayName || "SuperUser";
    const pack = createBoardReportPack({ reportPeriod, createdBy: actor, updatedBy: actor }, template, data.boardReportPacks);
    const ctx = buildBoardReportEvalContext(data);
    const withData = normalizeBoardReportPack({
      ...pack,
      sections: refreshBoardReportPackSections(pack, ctx, reportPeriod),
    });
    data.upsertBoardReportPack(withData);
    router.push(`/board-reporting/${withData.id}`);
  };

  if (!canWrite) {
    return <p className="text-sm text-slate-500">You do not have permission to create board reports.</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">New board report</h2>
      <p className="text-sm text-slate-600">Choose a reporting period. Sections from the default NDIS template will be included — you can customise them on the next screen.</p>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">Reporting period</span>
        <input type="month" value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} className={inputClass} />
      </label>
      <p className="text-sm text-slate-600">
        Template: <span className="font-medium text-slate-900">{template.name}</span>
      </p>
      <button type="button" onClick={handleCreate} className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]">
        Generate report
      </button>
    </div>
  );
}

export function BoardReportingDetailView({ id }: { id: string }) {
  const data = useData();
  const { organization } = useOrganization();
  const { session, canWindow, canWriteWindow, canProcess } = useAuth();
  const { resolveTemplate } = useDocumentPlatform();
  const canPrintReport = canProcess(DOCUMENT_PRINT_PROCESSES.printBoardReport);
  const canView = canWindow("board-reporting");
  const canWrite = canWriteWindow("board-reporting");
  const isBoardViewer = session?.activeRoleId === "role-board" && !canWrite;
  const stored = data.boardReportPacks.find((p) => p.id === id);
  const [draft, setDraft] = useState<BoardReportPackRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState<SaveConfirmation | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [printError, setPrintError] = useState("");
  const [printMessage, setPrintMessage] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  const record = draft ?? stored;
  const locked = boardReportPackIsLocked(stored ?? record) || (isBoardViewer && record?.status !== "Published");
  const canEdit = canWrite && !locked;

  const ctx = useMemo(() => buildBoardReportEvalContext(data), [data]);
  const visibleSections = useMemo(() => (record ? visibleBoardReportSections(record) : []), [record]);

  if (!canView) {
    return <p className="text-sm text-slate-500">Your role does not have access to Board Reporting.</p>;
  }

  if (!record) {
    return (
      <AppShell title="Report not found" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Board Reporting", href: "/board-reporting" }, { label: "Not found" }]} audit={{ moduleLabel: "Board Reporting" }}>
        <p className="text-sm text-slate-600">Board report not found.</p>
      </AppShell>
    );
  }

  if (isBoardViewer && record.status !== "Published") {
    return (
      <AppShell title="Report not available" breadcrumbs={[{ label: "Home", href: "/" }, { label: "Board Reporting", href: "/board-reporting" }, { label: record.title }]} audit={{ moduleLabel: "Board Reporting" }}>
        <p className="text-sm text-slate-600">This report is not published. Board members can only view published reports.</p>
      </AppShell>
    );
  }

  const update = (patch: Partial<BoardReportPackRecord>) => {
    setDraft((prev) => normalizeBoardReportPack({ ...(prev ?? stored!), ...patch }));
    setDirty(true);
  };

  const updateSection = (sectionCode: string, patch: Partial<BoardReportPackSection>) => {
    update({
      sections: record.sections.map((s) => (s.sectionCode === sectionCode ? { ...s, ...patch } : s)),
    });
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const sorted = [...record.sections].sort((a, b) => a.sortOrder - b.sortOrder);
    const target = index + direction;
    if (target < 0 || target >= sorted.length) return;
    update({ sections: reorderBoardReportSections(record.sections, index, target) });
  };

  const handleGenerate = () => {
    if (!canEdit) return;
    const refreshed = refreshBoardReportPackSections(record, ctx, record.reportPeriod);
    update({ sections: refreshed });
    setDirty(true);
  };

  const handleSave = () => {
    if (!record || !canEdit) return;
    const actor = session?.displayName || "SuperUser";
    data.upsertBoardReportPack({ ...record, updatedBy: actor });
    setDraft(null);
    setDirty(false);
    showSuccessToast(SAVE_TOAST_MESSAGES.saved);
    setSaveConfirmation({ message: `Saved — ${record.title} updated` });
  };

  const handleDiscard = () => {
    setDraft(null);
    setDirty(false);
    setSaveConfirmation(null);
  };

  const handleStatus = (status: BoardReportPackRecord["status"]) => {
    if (!canEdit) return;
    const actor = session?.displayName || "SuperUser";
    const now = new Date().toISOString();
    const patch: Partial<BoardReportPackRecord> = { status };
    if (status === "Reviewed") patch.reviewedAt = now;
    if (status === "Reviewed") patch.reviewedBy = actor;
    if (status === "Approved") patch.approvedAt = now;
    if (status === "Approved") patch.approvedBy = actor;
    if (status === "Published") {
      patch.publishedAt = now;
      patch.publishedBy = actor;
    }
    update(patch);
    setDirty(true);
  };

  const handlePrint = async () => {
    setPrintError("");
    setPrintMessage("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printBoardReport, "board-report");
    if (!template) {
      setPrintError("No active board report template is available.");
      return;
    }
    const ok = printBoardReportPack({ pack: record, organization });
    if (!ok) {
      setPrintError("Could not open print window. Allow pop-ups and try again.");
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printBoardReport,
        entityType: "board-report",
        entityId: record.id,
        entityLabel: boardReportRegistryLabel(record),
        outcome: "failed",
        failureReason: "Print window blocked",
      });
      return;
    }
    const exported = exportExtendedDocumentHtml({ pack: record, organization }, template);
    if (exported && canPrintReport) {
      try {
        await registerDocumentWithAudit({
          processId: DOCUMENT_PRINT_PROCESSES.printBoardReport,
          html: exported.html,
          templateId: exported.templateId,
          documentClass: exported.documentClass,
          entityType: "board-report",
          entityId: record.id,
          entityLabel: boardReportRegistryLabel(record),
          fileName: `${record.title.replace(/[^\w.-]+/g, "_")}-board-report.html`,
        });
        setPrintMessage("Board report saved to the document registry.");
        setHistoryRefresh((n) => n + 1);
      } catch (err) {
        setPrintError(err instanceof Error ? err.message : "Could not save to the document registry.");
      }
    }
  };

  const handleDownloadPdf = async () => {
    setPrintError("");
    setPrintMessage("");
    const template = resolveTemplate(DOCUMENT_PRINT_PROCESSES.printBoardReport, "board-report");
    if (!template) {
      setPrintError("No active board report template is available.");
      return;
    }
    const exported = exportExtendedDocumentHtml({ pack: record, organization }, template);
    if (!exported) {
      setPrintError("Could not generate the document. Check report fields and organisation profile.");
      return;
    }
    setPdfBusy(true);
    try {
      await downloadDocumentPdf({
        html: exported.html,
        templateId: exported.templateId,
        documentClass: exported.documentClass,
        entityType: "board-report",
        entityId: record.id,
        entityLabel: boardReportRegistryLabel(record),
        fileName: pdfFileName(`${record.title}-board-report`),
      });
      auditDocumentProcess({
        processId: DOCUMENT_PRINT_PROCESSES.printBoardReport,
        entityType: "board-report",
        entityId: record.id,
        entityLabel: boardReportRegistryLabel(record),
        detail: "PDF download",
      });
      setPrintMessage("Board report PDF saved to the document registry.");
      setHistoryRefresh((n) => n + 1);
    } catch (err) {
      setPrintError(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setPdfBusy(false);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview" },
    ...record.sections
      .filter((s) => s.included)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((s) => ({ id: s.sectionCode, label: s.label })),
    { id: "configure", label: "Configure sections" },
  ];

  return (
    <>
      <AppShell
        title={record.title}
        subtitle={`${formatBoardReportPeriod(record.reportPeriod)} · ${record.status}`}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Board Reporting", href: "/board-reporting" }, { label: record.title }]}
        audit={{ entityType: "board-report-pack", entityId: record.id, meta: auditMetaFrom(stored ?? record) }}
        actions={
          <div className="flex flex-wrap gap-2">
            {canEdit ? (
              <>
                <button type="button" onClick={handleGenerate} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Generate report
                </button>
                <button type="button" onClick={() => setPreviewMode((v) => !v)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {previewMode ? "Edit mode" : "Preview"}
                </button>
                {record.status === "Draft" ? (
                  <button type="button" onClick={() => handleStatus("Reviewed")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Mark reviewed
                  </button>
                ) : null}
                {record.status === "Reviewed" ? (
                  <button type="button" onClick={() => handleStatus("Approved")} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    Approve
                  </button>
                ) : null}
                {record.status === "Approved" || record.status === "Draft" ? (
                  <button type="button" onClick={() => handleStatus("Published")} className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266]">
                    Publish
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        }
      >
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="lg:w-56 shrink-0">
            <nav className="sticky top-4 space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                    activeSection === item.id ? "bg-[#fdf2f8] font-medium text-[#b51266]" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 space-y-6">
            {activeSection === "overview" ? (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Report overview</h2>
                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block text-sm lg:col-span-2">
                    <span className="mb-1 block font-medium text-slate-700">Executive summary</span>
                    <textarea
                      className={`${inputClass} min-h-[96px]`}
                      value={record.executiveSummary}
                      disabled={!canEdit || previewMode}
                      onChange={(e) => update({ executiveSummary: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm lg:col-span-2">
                    <span className="mb-1 block font-medium text-slate-700">CEO commentary</span>
                    <textarea
                      className={`${inputClass} min-h-[96px]`}
                      value={record.ceoCommentary}
                      disabled={!canEdit || previewMode}
                      onChange={(e) => update({ ceoCommentary: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Key decisions required</span>
                    <textarea
                      className={`${inputClass} min-h-[80px]`}
                      value={record.keyDecisionsRequired}
                      disabled={!canEdit || previewMode}
                      onChange={(e) => update({ keyDecisionsRequired: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-slate-700">Operational issues</span>
                    <textarea
                      className={`${inputClass} min-h-[80px]`}
                      value={record.operationalIssues}
                      disabled={!canEdit || previewMode}
                      onChange={(e) => update({ operationalIssues: e.target.value })}
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {visibleSections.slice(0, 6).map((section) => (
                    <button
                      key={section.sectionCode}
                      type="button"
                      onClick={() => setActiveSection(section.sectionCode)}
                      className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-left hover:bg-white"
                    >
                      <p className="text-xs font-medium text-slate-500">{section.label}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${boardReportTrafficClass(section.trafficLight)}`}>
                        {section.trafficLight}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {activeSection === "configure" && canEdit && !previewMode ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-slate-900">Configure sections</h2>
                <p className="text-sm text-slate-600">Include or exclude sections and change their order in the printed pack.</p>
                {[...record.sections]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((section, index) => (
                    <div key={section.sectionCode} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 px-3 py-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={section.included}
                          onChange={(e) => updateSection(section.sectionCode, { included: e.target.checked })}
                        />
                        {section.label}
                      </label>
                      <div className="ml-auto flex gap-1">
                        <button type="button" disabled={index === 0} onClick={() => moveSection(index, -1)} className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40">
                          Up
                        </button>
                        <button
                          type="button"
                          disabled={index === record.sections.length - 1}
                          onClick={() => moveSection(index, 1)}
                          className="rounded border border-slate-200 px-2 py-1 text-xs disabled:opacity-40"
                        >
                          Down
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : null}

            {activeSection !== "overview" && activeSection !== "configure" ? (
              (() => {
                const section = record.sections.find((s) => s.sectionCode === activeSection);
                if (!section) return null;
                return (
                  <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">{section.label}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${boardReportTrafficClass(section.trafficLight)}`}>
                        {section.trafficLight}
                      </span>
                    </div>
                    {canEdit && !previewMode ? (
                      <label className="block text-sm">
                        <span className="mb-1 block font-medium text-slate-700">Section commentary</span>
                        <textarea
                          className={`${inputClass} min-h-[80px]`}
                          value={section.commentary}
                          onChange={(e) => updateSection(section.sectionCode, { commentary: e.target.value })}
                        />
                      </label>
                    ) : null}
                    <SectionPreview section={section} />
                  </div>
                );
              })()
            ) : null}
          </div>
        </div>

        {canPrintReport ? (
          <RecordDocumentsSection
            entityType="board-report"
            entityId={record.id}
            refreshKey={historyRefresh}
            error={printError || undefined}
            message={printMessage || undefined}
            actions={[
              {
                processId: DOCUMENT_PRINT_PROCESSES.printBoardReport,
                label: "Print",
                onClick: () => void handlePrint(),
              },
              {
                processId: DOCUMENT_PRINT_PROCESSES.printBoardReport,
                label: "PDF",
                onClick: () => void handleDownloadPdf(),
                busy: pdfBusy,
              },
            ]}
          />
        ) : null}
      </AppShell>
      <UnsavedChangesBar
        visible={dirty && canEdit}
        confirmation={saveConfirmation}
        onConfirmationDismiss={() => setSaveConfirmation(null)}
        onSave={handleSave}
        onDiscard={handleDiscard}
      />
    </>
  );
}
