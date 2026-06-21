import type { BoardReportPackRecord, BoardReportPackSection, BoardReportSectionSnapshot } from "@/lib/board-report-pack";
import type { BoardReportTemplateRecord, BoardReportTemplateSectionDef } from "@/lib/board-report-template";

export type BoardReportTemplateRow = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  is_default: boolean;
  created_by: string;
  updated_by: string;
  created_at?: string;
  updated_at?: string;
};

export type BoardReportTemplateSectionRow = {
  id: string;
  template_id: string;
  section_code: string;
  label: string;
  description: string;
  default_included: boolean;
  sort_order: number;
};

export type BoardReportPackRow = {
  id: string;
  template_id: string;
  report_period: string;
  title: string;
  status: string;
  executive_summary: string;
  ceo_commentary: string;
  key_decisions_required: string;
  operational_issues: string;
  reviewed_at: string | null;
  reviewed_by: string;
  approved_at: string | null;
  approved_by: string;
  published_at: string | null;
  published_by: string;
  created_by: string;
  updated_by: string;
  created_at?: string;
  updated_at?: string;
};

export type BoardReportPackSectionRow = {
  id: string;
  pack_id: string;
  section_code: string;
  label: string;
  sort_order: number;
  included: boolean;
  traffic_light: string;
  status_message: string;
  commentary: string;
  metrics_json: BoardReportSectionSnapshot | Record<string, unknown>;
  data_snapshot_json: BoardReportSectionSnapshot | Record<string, unknown>;
};

function snapshotFromJson(raw: unknown): BoardReportSectionSnapshot {
  if (!raw || typeof raw !== "object") return { metrics: [], tables: [], bullets: [] };
  const obj = raw as BoardReportSectionSnapshot;
  return {
    metrics: Array.isArray(obj.metrics) ? obj.metrics : [],
    tables: Array.isArray(obj.tables) ? obj.tables : [],
    bullets: Array.isArray(obj.bullets) ? obj.bullets : [],
  };
}

export function boardReportTemplateFromRows(
  template: BoardReportTemplateRow,
  sections: BoardReportTemplateSectionRow[]
): BoardReportTemplateRecord {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    active: template.active,
    isDefault: template.is_default,
    sections: sections
      .filter((s) => s.template_id === template.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(
        (s): BoardReportTemplateSectionDef => ({
          id: s.id,
          sectionCode: s.section_code,
          label: s.label,
          description: s.description,
          defaultIncluded: s.default_included,
          sortOrder: s.sort_order,
        })
      ),
    createdBy: template.created_by,
    updatedBy: template.updated_by,
  };
}

export function boardReportPackSectionFromRow(row: BoardReportPackSectionRow): BoardReportPackSection {
  const snapshot = snapshotFromJson(row.data_snapshot_json);
  if (!snapshot.metrics.length && row.metrics_json) {
    const metricsOnly = snapshotFromJson(row.metrics_json);
    snapshot.metrics = metricsOnly.metrics;
  }
  return {
    id: row.id,
    sectionCode: row.section_code,
    label: row.label,
    sortOrder: row.sort_order,
    included: row.included,
    trafficLight: (row.traffic_light as BoardReportPackSection["trafficLight"]) || "none",
    statusMessage: row.status_message,
    commentary: row.commentary,
    snapshot,
  };
}

export function boardReportPackFromRows(pack: BoardReportPackRow, sections: BoardReportPackSectionRow[]): BoardReportPackRecord {
  return {
    id: pack.id,
    templateId: pack.template_id,
    reportPeriod: pack.report_period,
    title: pack.title,
    status: pack.status as BoardReportPackRecord["status"],
    executiveSummary: pack.executive_summary,
    ceoCommentary: pack.ceo_commentary,
    keyDecisionsRequired: pack.key_decisions_required,
    operationalIssues: pack.operational_issues,
    reviewedAt: pack.reviewed_at ?? "",
    reviewedBy: pack.reviewed_by,
    approvedAt: pack.approved_at ?? "",
    approvedBy: pack.approved_by,
    publishedAt: pack.published_at ?? "",
    publishedBy: pack.published_by,
    sections: sections
      .filter((s) => s.pack_id === pack.id)
      .map(boardReportPackSectionFromRow)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    createdBy: pack.created_by,
    updatedBy: pack.updated_by,
    createdAt: pack.created_at,
    updatedAt: pack.updated_at,
  };
}

export function boardReportPackToRow(record: BoardReportPackRecord): BoardReportPackRow {
  return {
    id: record.id,
    template_id: record.templateId,
    report_period: record.reportPeriod,
    title: record.title,
    status: record.status,
    executive_summary: record.executiveSummary,
    ceo_commentary: record.ceoCommentary,
    key_decisions_required: record.keyDecisionsRequired,
    operational_issues: record.operationalIssues,
    reviewed_at: record.reviewedAt?.trim() ? record.reviewedAt : null,
    reviewed_by: record.reviewedBy,
    approved_at: record.approvedAt?.trim() ? record.approvedAt : null,
    approved_by: record.approvedBy,
    published_at: record.publishedAt?.trim() ? record.publishedAt : null,
    published_by: record.publishedBy,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function boardReportPackSectionToRow(section: BoardReportPackSection, packId: string): BoardReportPackSectionRow {
  return {
    id: section.id,
    pack_id: packId,
    section_code: section.sectionCode,
    label: section.label,
    sort_order: section.sortOrder,
    included: section.included,
    traffic_light: section.trafficLight,
    status_message: section.statusMessage,
    commentary: section.commentary,
    metrics_json: { metrics: section.snapshot.metrics },
    data_snapshot_json: section.snapshot,
  };
}
