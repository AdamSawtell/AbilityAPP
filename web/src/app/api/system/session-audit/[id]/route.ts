import { NextResponse } from "next/server";
import {
  addRiskNote,
  getSessionDetail,
  logSessionAuditAccess,
  updateRiskStatus,
} from "@/lib/session-audit/server";
import { resolveSessionAuditAccess } from "@/lib/session-audit/request-access";
import {
  canInvestigateSession,
  canViewSensitiveSessionFields,
  canViewSessionAudit,
} from "@/lib/session-audit/access";
import { clientIpFromRequest } from "@/lib/session-audit/parse-user-agent";
import type { RiskStatus } from "@/lib/session-audit/types";

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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { level, actorUserId, actorName } = await resolveSessionAuditAccess();
  if (!canViewSessionAudit(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const detail = await getSessionDetail(id);
  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const showSensitive = canViewSensitiveSessionFields(level);
  await logSessionAuditAccess({
    actorUserId,
    actorName,
    action: "view_session",
    targetSessionId: id,
    ipAddress: clientIpFromRequest(_request),
  });

  return NextResponse.json({
    ...detail,
    session: maskSession(detail.session, showSensitive),
    showSensitive,
  });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { level, actorUserId, actorName } = await resolveSessionAuditAccess();
  if (!canInvestigateSession(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await context.params;
  const body = (await request.json()) as { riskStatus?: RiskStatus; note?: string };
  if (body.riskStatus) {
    await updateRiskStatus(id, body.riskStatus);
    await logSessionAuditAccess({
      actorUserId,
      actorName,
      action: "update_risk_status",
      targetSessionId: id,
      detail: body.riskStatus,
      ipAddress: clientIpFromRequest(request),
    });
  }
  if (body.note?.trim()) {
    await addRiskNote(id, body.note.trim(), actorUserId, actorName);
    await logSessionAuditAccess({
      actorUserId,
      actorName,
      action: "add_risk_note",
      targetSessionId: id,
      ipAddress: clientIpFromRequest(request),
    });
  }
  const detail = await getSessionDetail(id);
  return NextResponse.json({ detail });
}
