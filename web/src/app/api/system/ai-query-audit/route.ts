import { NextResponse } from "next/server";
import {
  canExportMonitoring,
  canViewMonitoring,
  canViewSensitiveMonitoring,
} from "@/lib/audit-monitoring/access";
import { resolveAiQueryAuditAccess } from "@/lib/audit-monitoring/request-access";
import { clientIpFromRequest } from "@/lib/session-audit/parse-user-agent";
import {
  getAiQueryDashboardMetrics,
  listAiQueryAudits,
  logAiQueryAuditAccess,
  runAiQueryMetaRetention,
} from "@/lib/ai-query-audit/server";
import type { AiQueryAuditFilters, AiQueryOutcome, AiQueryType } from "@/lib/ai-query-audit/types";
import { parseAuditListParams } from "@/lib/audit-monitoring/list-params";
import { maskSensitive } from "@/components/admin/audit-monitoring-shared";

export async function GET(request: Request) {
  const { level, actorUserId, actorName } = await resolveAiQueryAuditAccess();
  if (!canViewMonitoring(level)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(request.url);
  if (url.searchParams.get("mode") === "dashboard") {
    const range = url.searchParams.get("range") ?? "7d";
    const now = new Date();
    const dateTo = url.searchParams.get("to") ?? now.toISOString();
    const dateFrom =
      range === "today"
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        : range === "30d"
          ? new Date(now.getTime() - 30 * 86400000).toISOString()
          : new Date(now.getTime() - 7 * 86400000).toISOString();
    const metrics = await getAiQueryDashboardMetrics(dateFrom, dateTo);
    await logAiQueryAuditAccess({
      actorUserId,
      actorName,
      action: "view_dashboard",
      detail: range,
      ipAddress: clientIpFromRequest(request),
    });
    return NextResponse.json({ metrics, dateFrom, dateTo });
  }

  const listParams = parseAuditListParams(url);
  const filters: AiQueryAuditFilters = {
    userId: url.searchParams.get("userId") ?? undefined,
    roleId: url.searchParams.get("roleId") ?? undefined,
    agentId: url.searchParams.get("agentId") ?? undefined,
    dateFrom: listParams.dateFrom,
    dateTo: listParams.dateTo,
    outcome: (url.searchParams.get("outcome") as AiQueryOutcome) ?? undefined,
    queryType: (url.searchParams.get("queryType") as AiQueryType) ?? undefined,
    riskLevel: url.searchParams.get("riskLevel") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    cursor: listParams.cursor,
    limit: listParams.limit,
  };

  const { records, total, nextCursor } = await listAiQueryAudits(filters);
  const showSensitive = canViewSensitiveMonitoring(level);
  await logAiQueryAuditAccess({
    actorUserId,
    actorName,
    action: "list_records",
    detail: `${records.length} rows`,
    ipAddress: clientIpFromRequest(request),
  });
  return NextResponse.json({
    records: records.map((r) => maskSensitive(r, showSensitive)),
    total,
    nextCursor,
    showSensitive,
  });
}

export async function POST(request: Request) {
  const { level } = await resolveAiQueryAuditAccess();
  if (level !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await request.json()) as { action?: string };
  if (body.action === "run_retention") {
    const deleted = await runAiQueryMetaRetention();
    return NextResponse.json({ deleted });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
