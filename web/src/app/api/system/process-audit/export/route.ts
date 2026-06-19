import { NextResponse } from "next/server";
import { canExportMonitoring, canViewSensitiveMonitoring } from "@/lib/audit-monitoring/access";
import { resolveProcessAuditAccess } from "@/lib/audit-monitoring/request-access";
import { listProcessAudits } from "@/lib/process-audit/server";
import { PROCESS_OUTCOME_LABELS, PROCESS_STATUS_LABELS } from "@/lib/process-audit/constants";
import { RISK_SEVERITY_LABELS } from "@/lib/session-audit/constants";
import { formatAuditDateTime } from "@/lib/audit";

export async function GET(request: Request) {
  const { level } = await resolveProcessAuditAccess();
  if (!canExportMonitoring(level)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const { records } = await listProcessAudits({
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    limit: 5000,
    offset: 0,
  });
  const showSensitive = canViewSensitiveMonitoring(level);
  const header = [
    "ID",
    "User",
    "Role",
    "Process",
    "Entity",
    "Outcome",
    "Status",
    "Started",
    "Duration (ms)",
    "Risk",
    "IP",
    "Detail",
  ];
  const rows = records.map((r) => [
    r.id,
    r.userName,
    r.roleName,
    r.processLabel,
    r.entityLabel || r.entityId,
    PROCESS_OUTCOME_LABELS[r.outcome],
    PROCESS_STATUS_LABELS[r.status],
    formatAuditDateTime(r.startedAt),
    r.durationMs != null ? String(r.durationMs) : "",
    r.riskLevel === "none" ? "" : RISK_SEVERITY_LABELS[r.riskLevel as keyof typeof RISK_SEVERITY_LABELS] ?? r.riskLevel,
    showSensitive ? r.ipAddress : "[Restricted]",
    r.detail,
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="process-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
