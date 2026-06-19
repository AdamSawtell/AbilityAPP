import { NextResponse } from "next/server";
import {
  canInvestigateMonitoring,
  canViewMonitoring,
  canViewSensitiveMonitoring,
} from "@/lib/audit-monitoring/access";
import { resolveProcessAuditAccess } from "@/lib/audit-monitoring/request-access";
import { clientIpFromRequest } from "@/lib/session-audit/parse-user-agent";
import {
  addProcessRiskNote,
  getProcessAuditDetail,
  logProcessAuditAccess,
  updateProcessRiskStatus,
} from "@/lib/process-audit/server";
import type { RiskStatus } from "@/lib/session-audit/types";
import { maskSensitive } from "@/components/admin/audit-monitoring-shared";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { level, actorUserId, actorName } = await resolveProcessAuditAccess();
  if (!canViewMonitoring(level)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const detail = await getProcessAuditDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const showSensitive = canViewSensitiveMonitoring(level);
  await logProcessAuditAccess({
    actorUserId,
    actorName,
    action: "view_record",
    targetProcessAuditId: id,
    ipAddress: clientIpFromRequest(_request),
  });
  return NextResponse.json({
    ...detail,
    record: maskSensitive(detail.record, showSensitive),
    showSensitive,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { level, actorUserId, actorName } = await resolveProcessAuditAccess();
  if (!canInvestigateMonitoring(level)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await context.params;
  const body = (await request.json()) as { riskStatus?: RiskStatus; note?: string };
  if (body.riskStatus) {
    await updateProcessRiskStatus(id, body.riskStatus);
    await logProcessAuditAccess({
      actorUserId,
      actorName,
      action: "update_risk_status",
      targetProcessAuditId: id,
      detail: body.riskStatus,
      ipAddress: clientIpFromRequest(request),
    });
  }
  if (body.note?.trim()) {
    await addProcessRiskNote(id, body.note.trim(), actorUserId, actorName);
    await logProcessAuditAccess({
      actorUserId,
      actorName,
      action: "add_risk_note",
      targetProcessAuditId: id,
      ipAddress: clientIpFromRequest(request),
    });
  }
  const detail = await getProcessAuditDetail(id);
  return NextResponse.json({ detail });
}
