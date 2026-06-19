import { NextResponse } from "next/server";
import { canExportMonitoring, canViewSensitiveMonitoring } from "@/lib/audit-monitoring/access";
import { resolveAiQueryAuditAccess } from "@/lib/audit-monitoring/request-access";
import { listAiQueryAudits } from "@/lib/ai-query-audit/server";
import { AI_QUERY_OUTCOME_LABELS } from "@/lib/ai-query-audit/constants";
import { RISK_SEVERITY_LABELS } from "@/lib/session-audit/constants";
import { formatAuditDateTime } from "@/lib/audit";
import { truncateText } from "@/lib/audit-monitoring/shared";

export async function GET(request: Request) {
  const { level } = await resolveAiQueryAuditAccess();
  if (!canExportMonitoring(level)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const url = new URL(request.url);
  const { records } = await listAiQueryAudits({
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    limit: 5000,
    offset: 0,
  });
  const showSensitive = canViewSensitiveMonitoring(level);
  const header = ["ID", "User", "Agent", "Query", "Outcome", "Tools", "Risk", "Created"];
  const rows = records.map((r) => [
    r.id,
    r.userName,
    r.agentName,
    showSensitive ? truncateText(r.userMessage, 200) : "[Restricted]",
    AI_QUERY_OUTCOME_LABELS[r.outcome],
    String(r.toolCallCount),
    r.riskLevel === "none" ? "" : RISK_SEVERITY_LABELS[r.riskLevel as keyof typeof RISK_SEVERITY_LABELS] ?? r.riskLevel,
    formatAuditDateTime(r.createdAt),
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ai-query-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
