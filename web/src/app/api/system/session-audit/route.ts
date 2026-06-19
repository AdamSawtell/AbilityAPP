import { NextResponse } from "next/server";
import {
  addRiskNote,
  closeTimedOutSessions,
  getDashboardMetrics,
  getRecentRetentionRuns,
  getRetentionPolicies,
  getSessionDetail,
  getSystemSettings,
  listSessions,
  logSessionAuditAccess,
  runSessionRetention,
  updateRetentionPolicy,
  updateRiskStatus,
  updateSystemSetting,
} from "@/lib/session-audit/server";
import { resolveSessionAuditAccess } from "@/lib/session-audit/request-access";
import {
  canExportSessionAudit,
  canInvestigateSession,
  canManageRetention,
  canViewSessionAudit,
  canViewSensitiveSessionFields,
} from "@/lib/session-audit/access";
import { clientIpFromRequest } from "@/lib/session-audit/parse-user-agent";
import { parseAuditListParams } from "@/lib/audit-monitoring/list-params";
import type { SessionAuditFilters, SessionStatus, RiskStatus } from "@/lib/session-audit/types";

function maskSession<T extends { ipAddress?: string; userAgent?: string; deviceInfo?: string }>(
  row: T,
  showSensitive: boolean
): T {
  if (showSensitive) return row;
  return {
    ...row,
    ipAddress: row.ipAddress ? "***.***.***.***" : "",
    userAgent: row.userAgent ? "[Restricted]" : "",
    deviceInfo: row.deviceInfo ? "[Restricted]" : "",
  };
}

export async function GET(request: Request) {
  const { level, actorUserId, actorName } = await resolveSessionAuditAccess();
  if (!canViewSessionAudit(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get("mode");

  if (mode === "dashboard") {
    const range = url.searchParams.get("range") ?? "7d";
    const now = new Date();
    let dateFrom: string;
    const dateTo = now.toISOString();
    if (range === "today") {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    } else if (range === "30d") {
      dateFrom = new Date(now.getTime() - 30 * 86400000).toISOString();
    } else if (range === "custom") {
      dateFrom = url.searchParams.get("from") ?? dateTo;
    } else {
      dateFrom = new Date(now.getTime() - 7 * 86400000).toISOString();
    }
    const customTo = url.searchParams.get("to");
    const metrics = await getDashboardMetrics(dateFrom, customTo ?? dateTo);
    await logSessionAuditAccess({
      actorUserId,
      actorName,
      action: "view_dashboard",
      detail: range,
      ipAddress: clientIpFromRequest(request),
    });
    return NextResponse.json({ metrics, dateFrom, dateTo: customTo ?? dateTo });
  }

  const listParams = parseAuditListParams(url);
  const filters: SessionAuditFilters = {
    userId: url.searchParams.get("userId") ?? undefined,
    roleId: url.searchParams.get("roleId") ?? undefined,
    dateFrom: listParams.dateFrom,
    dateTo: listParams.dateTo,
    ipAddress: url.searchParams.get("ipAddress") ?? undefined,
    status: (url.searchParams.get("status") as SessionStatus) ?? undefined,
    loginResult: (url.searchParams.get("loginResult") as "success" | "failed") ?? undefined,
    riskLevel: url.searchParams.get("riskLevel") ?? undefined,
    authMethod: url.searchParams.get("authMethod") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    cursor: listParams.cursor,
    limit: listParams.limit,
  };

  const { sessions, total, nextCursor } = await listSessions(filters);
  const showSensitive = canViewSensitiveSessionFields(level);
  await logSessionAuditAccess({
    actorUserId,
    actorName,
    action: "list_sessions",
    detail: `${sessions.length} rows`,
    ipAddress: clientIpFromRequest(request),
  });
  return NextResponse.json({
    sessions: sessions.map((s) => maskSession(s, showSensitive)),
    total,
    nextCursor,
    showSensitive,
  });
}

export async function POST(request: Request) {
  const { level, actorUserId, actorName } = await resolveSessionAuditAccess();
  if (!canManageRetention(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = (await request.json()) as { action?: string };
  if (body.action === "close_timeouts") {
    const result = await closeTimedOutSessions();
    return NextResponse.json(result);
  }
  if (body.action === "run_retention") {
    const run = await runSessionRetention();
    return NextResponse.json({ run });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
