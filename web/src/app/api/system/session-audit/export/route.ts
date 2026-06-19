import { NextResponse } from "next/server";
import { listSessions } from "@/lib/session-audit/server";
import { resolveSessionAuditAccess } from "@/lib/session-audit/request-access";
import { canExportSessionAudit, canViewSensitiveSessionFields } from "@/lib/session-audit/access";
import { SESSION_STATUS_LABELS, RISK_SEVERITY_LABELS } from "@/lib/session-audit/constants";
import { formatAuditDateTime } from "@/lib/audit";

export async function GET(request: Request) {
  const { level } = await resolveSessionAuditAccess();
  if (!canExportSessionAudit(level)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const { sessions } = await listSessions({
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
    limit: 5000,
    offset: 0,
  });
  const showSensitive = canViewSensitiveSessionFields(level);
  const header = [
    "Session ID",
    "User",
    "Role",
    "Login",
    "Logout",
    "Duration (min)",
    "Status",
    "Login result",
    "Risk level",
    "Risk status",
    "IP address",
    "Browser",
    "Auth method",
    "Transactions",
  ];
  const rows = sessions.map((s) => [
    s.id,
    s.userName,
    s.roleName,
    formatAuditDateTime(s.loginAt),
    s.logoutAt ? formatAuditDateTime(s.logoutAt) : "",
    s.durationSeconds != null ? String(Math.round(s.durationSeconds / 60)) : "",
    SESSION_STATUS_LABELS[s.status],
    s.loginResult,
    s.riskLevel === "none" ? "" : RISK_SEVERITY_LABELS[s.riskLevel as keyof typeof RISK_SEVERITY_LABELS] ?? s.riskLevel,
    s.riskStatus,
    showSensitive ? s.ipAddress : "[Restricted]",
    s.browser,
    s.authMethod,
    String(s.transactionCount),
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="user-session-audit-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
