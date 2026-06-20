import { auditPackManifestCsv, evaluateAuditPack, type AuditPackContext } from "@/lib/ndis-audit-pack";
import { currentPlanMonthIso } from "@/lib/monthly-service-plan";
import type { ReportResult } from "@/lib/reports/types";

export function buildNdisAuditPackSummaryReport(
  ctx: AuditPackContext,
  auditMonth = currentPlanMonthIso()
): ReportResult {
  const evaluation = evaluateAuditPack(ctx, auditMonth);

  return {
    columns: [
      { id: "auditMonth", label: "Audit month" },
      { id: "section", label: "Section" },
      { id: "status", label: "Status" },
      { id: "rowCount", label: "Row count" },
      { id: "message", label: "Message" },
    ],
    rows: evaluation.sections.map((section) => ({
      auditMonth: evaluation.auditMonth,
      section: section.label,
      status: section.status,
      rowCount: String(section.rowCount),
      message: section.message,
    })),
  };
}

export { auditPackManifestCsv };
