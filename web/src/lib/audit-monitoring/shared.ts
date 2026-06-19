import type { AuthSession } from "@/lib/access/types";
import { clientIpFromRequest, parseUserAgent } from "@/lib/session-audit/parse-user-agent";
import type { RiskSeverity } from "@/lib/session-audit/types";

export function auditNewId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function severityRank(s: RiskSeverity | "none"): number {
  if (s === "critical") return 4;
  if (s === "high") return 3;
  if (s === "medium") return 2;
  if (s === "low") return 1;
  return 0;
}

export function maxSeverity(a: RiskSeverity | "none", b: RiskSeverity): RiskSeverity | "none" {
  return severityRank(a) >= severityRank(b) ? a : b;
}

export type AuditActorContext = {
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  sessionId: string;
  ipAddress: string;
  browser: string;
  deviceInfo: string;
  userAgent: string;
};

export function auditContextFromSession(session: AuthSession, request?: Request): AuditActorContext {
  const userAgent = request?.headers.get("user-agent") ?? "";
  const { browser, deviceInfo } = parseUserAgent(userAgent);
  return {
    userId: session.userId,
    userName: session.displayName,
    roleId: session.activeRoleId,
    roleName: session.activeRoleName,
    sessionId: session.sessionId ?? "",
    ipAddress: request ? clientIpFromRequest(request) : "",
    browser,
    deviceInfo,
    userAgent,
  };
}

export function truncateText(text: string, max = 500) {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}
