import { NextResponse } from "next/server";
import {
  canInvestigateMonitoring,
  canViewMonitoring,
  canViewSensitiveMonitoring,
} from "@/lib/audit-monitoring/access";
import { resolveAiQueryAuditAccess } from "@/lib/audit-monitoring/request-access";
import { clientIpFromRequest } from "@/lib/session-audit/parse-user-agent";
import {
  addAiQueryRiskNote,
  getAiQueryAuditDetail,
  logAiQueryAuditAccess,
  updateAiQueryRiskStatus,
} from "@/lib/ai-query-audit/server";
import type { RiskStatus } from "@/lib/session-audit/types";
import { maskSensitive } from "@/components/admin/audit-monitoring-shared";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { level, actorUserId, actorName } = await resolveAiQueryAuditAccess();
  if (!canViewMonitoring(level)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const detail = await getAiQueryAuditDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const showSensitive = canViewSensitiveMonitoring(level);
  await logAiQueryAuditAccess({
    actorUserId,
    actorName,
    action: "view_record",
    targetChatLogId: id,
    ipAddress: clientIpFromRequest(_request),
  });
  return NextResponse.json({
    ...detail,
    record: maskSensitive(detail.record, showSensitive),
    showSensitive,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { level, actorUserId, actorName } = await resolveAiQueryAuditAccess();
  if (!canInvestigateMonitoring(level)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const body = (await request.json()) as { riskStatus?: RiskStatus; note?: string };
  if (body.riskStatus) {
    await updateAiQueryRiskStatus(id, body.riskStatus);
    await logAiQueryAuditAccess({
      actorUserId,
      actorName,
      action: "update_risk_status",
      targetChatLogId: id,
      detail: body.riskStatus,
      ipAddress: clientIpFromRequest(request),
    });
  }
  if (body.note?.trim()) {
    await addAiQueryRiskNote(id, body.note.trim(), actorUserId, actorName);
    await logAiQueryAuditAccess({
      actorUserId,
      actorName,
      action: "add_risk_note",
      targetChatLogId: id,
      ipAddress: clientIpFromRequest(request),
    });
  }
  const detail = await getAiQueryAuditDetail(id);
  return NextResponse.json({ detail });
}
