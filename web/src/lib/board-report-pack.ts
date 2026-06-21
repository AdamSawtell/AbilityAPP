import type { AuditStampable } from "@/lib/audit";
import {
  DEFAULT_BOARD_REPORT_TEMPLATE_ID,
  defaultBoardReportTemplate,
  type BoardReportTemplateRecord,
} from "@/lib/board-report-template";

export type BoardReportTrafficLight = "green" | "amber" | "red" | "none";

export type BoardReportStatus = "Draft" | "Reviewed" | "Approved" | "Published";

export type BoardReportMetric = {
  label: string;
  value: string;
  trafficLight?: BoardReportTrafficLight;
};

export type BoardReportTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export type BoardReportSectionSnapshot = {
  metrics: BoardReportMetric[];
  tables: BoardReportTable[];
  bullets: string[];
};

export type BoardReportPackSection = {
  id: string;
  sectionCode: string;
  label: string;
  sortOrder: number;
  included: boolean;
  trafficLight: BoardReportTrafficLight;
  statusMessage: string;
  commentary: string;
  snapshot: BoardReportSectionSnapshot;
};

export type BoardReportPackRecord = AuditStampable & {
  id: string;
  templateId: string;
  reportPeriod: string;
  title: string;
  status: BoardReportStatus;
  executiveSummary: string;
  ceoCommentary: string;
  keyDecisionsRequired: string;
  operationalIssues: string;
  reviewedAt: string;
  reviewedBy: string;
  approvedAt: string;
  approvedBy: string;
  publishedAt: string;
  publishedBy: string;
  sections: BoardReportPackSection[];
  createdBy: string;
  updatedBy: string;
};

export const boardReportDropdowns = {
  status: ["Draft", "Reviewed", "Approved", "Published"] as BoardReportStatus[],
  trafficLight: ["green", "amber", "red", "none"] as BoardReportTrafficLight[],
};

export function boardReportPackId(reportPeriod: string): string {
  return `brp-${reportPeriod}`;
}

export function emptySectionSnapshot(): BoardReportSectionSnapshot {
  return { metrics: [], tables: [], bullets: [] };
}

export function emptyBoardReportSection(
  partial: Pick<BoardReportPackSection, "sectionCode" | "label" | "sortOrder"> &
    Partial<BoardReportPackSection>
): BoardReportPackSection {
  return {
    id: partial.id ?? `brps-${partial.sectionCode}-${Date.now()}`,
    sectionCode: partial.sectionCode,
    label: partial.label,
    sortOrder: partial.sortOrder,
    included: partial.included ?? true,
    trafficLight: partial.trafficLight ?? "none",
    statusMessage: partial.statusMessage ?? "",
    commentary: partial.commentary ?? "",
    snapshot: partial.snapshot ?? emptySectionSnapshot(),
  };
}

export function formatBoardReportPeriod(reportPeriod: string): string {
  if (!/^\d{4}-\d{2}$/.test(reportPeriod)) return reportPeriod || "—";
  const [year, month] = reportPeriod.split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  return d.toLocaleDateString("en-AU", { month: "long", year: "numeric" });
}

export function boardReportTitle(reportPeriod: string): string {
  return `Monthly Board Report — ${formatBoardReportPeriod(reportPeriod)}`;
}

export function normalizeBoardReportPack(record: BoardReportPackRecord): BoardReportPackRecord {
  const sections = (record.sections ?? [])
    .map((section, index) =>
      emptyBoardReportSection({
        ...section,
        sortOrder: section.sortOrder || index + 1,
        snapshot: {
          metrics: section.snapshot?.metrics ?? [],
          tables: section.snapshot?.tables ?? [],
          bullets: section.snapshot?.bullets ?? [],
        },
      })
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...record,
    templateId: record.templateId || DEFAULT_BOARD_REPORT_TEMPLATE_ID,
    reportPeriod: record.reportPeriod?.slice(0, 7) ?? "",
    title: record.title?.trim() || boardReportTitle(record.reportPeriod),
    status: (boardReportDropdowns.status.includes(record.status as BoardReportStatus)
      ? record.status
      : "Draft") as BoardReportStatus,
    executiveSummary: record.executiveSummary ?? "",
    ceoCommentary: record.ceoCommentary ?? "",
    keyDecisionsRequired: record.keyDecisionsRequired ?? "",
    operationalIssues: record.operationalIssues ?? "",
    reviewedAt: record.reviewedAt ?? "",
    reviewedBy: record.reviewedBy ?? "",
    approvedAt: record.approvedAt ?? "",
    approvedBy: record.approvedBy ?? "",
    publishedAt: record.publishedAt ?? "",
    publishedBy: record.publishedBy ?? "",
    sections,
    createdBy: record.createdBy ?? "",
    updatedBy: record.updatedBy ?? "",
  };
}

export function createBoardReportPack(
  partial: Partial<BoardReportPackRecord> & { reportPeriod: string },
  template: BoardReportTemplateRecord = defaultBoardReportTemplate(),
  existing: BoardReportPackRecord[] = []
): BoardReportPackRecord {
  const reportPeriod = partial.reportPeriod.slice(0, 7);
  const id =
    partial.id?.trim() ||
    (existing.some((r) => r.id === boardReportPackId(reportPeriod))
      ? `brp-${reportPeriod}-${existing.length + 1}`
      : boardReportPackId(reportPeriod));

  const sections = (
    partial.sections?.length
      ? partial.sections
      : template.sections.map((t) => ({
          sectionCode: t.sectionCode,
          label: t.label,
          sortOrder: t.sortOrder,
          included: t.defaultIncluded,
        }))
  ).map((row, index) =>
    emptyBoardReportSection({
      id: `brps-${row.sectionCode}-${id}`,
      sectionCode: row.sectionCode,
      label: row.label,
      sortOrder: row.sortOrder ?? index + 1,
      included: row.included ?? true,
    })
  );

  return normalizeBoardReportPack({
    ...partial,
    id,
    templateId: partial.templateId ?? template.id,
    reportPeriod,
    title: partial.title ?? boardReportTitle(reportPeriod),
    status: partial.status ?? "Draft",
    executiveSummary: partial.executiveSummary ?? "",
    ceoCommentary: partial.ceoCommentary ?? "",
    keyDecisionsRequired: partial.keyDecisionsRequired ?? "",
    operationalIssues: partial.operationalIssues ?? "",
    reviewedAt: partial.reviewedAt ?? "",
    reviewedBy: partial.reviewedBy ?? "",
    approvedAt: partial.approvedAt ?? "",
    approvedBy: partial.approvedBy ?? "",
    publishedAt: partial.publishedAt ?? "",
    publishedBy: partial.publishedBy ?? "",
    sections,
    createdBy: partial.createdBy ?? "SuperUser",
    updatedBy: partial.updatedBy ?? "SuperUser",
  });
}

export function boardReportPackIsLocked(record: BoardReportPackRecord | undefined): boolean {
  return record?.status === "Published";
}

export function boardReportTrafficClass(light: BoardReportTrafficLight): string {
  if (light === "green") return "bg-emerald-100 text-emerald-900 ring-emerald-200";
  if (light === "amber") return "bg-amber-100 text-amber-950 ring-amber-200";
  if (light === "red") return "bg-rose-100 text-rose-950 ring-rose-200";
  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export function boardReportStatusClass(status: BoardReportStatus): string {
  if (status === "Published") return "bg-emerald-100 text-emerald-800";
  if (status === "Approved") return "bg-sky-100 text-sky-950";
  if (status === "Reviewed") return "bg-indigo-100 text-indigo-950";
  return "bg-slate-100 text-slate-700";
}

export function reorderBoardReportSections(
  sections: BoardReportPackSection[],
  fromIndex: number,
  toIndex: number
): BoardReportPackSection[] {
  const sorted = [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
  if (fromIndex < 0 || fromIndex >= sorted.length || toIndex < 0 || toIndex >= sorted.length) return sorted;
  const [moved] = sorted.splice(fromIndex, 1);
  sorted.splice(toIndex, 0, moved);
  return sorted.map((section, index) => ({ ...section, sortOrder: index + 1 }));
}

export function visibleBoardReportSections(pack: BoardReportPackRecord): BoardReportPackSection[] {
  return pack.sections.filter((s) => s.included).sort((a, b) => a.sortOrder - b.sortOrder);
}
