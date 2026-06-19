import type { AuthSession } from "@/lib/access/types";
import { isSystemOperatorUsername } from "@/lib/system/constants";
import type { SystemSession } from "@/lib/system/types";

export type SessionAuditAccessLevel = "none" | "read" | "investigate" | "admin";

const INVESTIGATE_PROCESS = "manage-session-audit-risk";
const SENSITIVE_PROCESS = "view-session-sensitive-session-data";
const RETENTION_PROCESS = "manage-retention-settings";

export function sessionAuditAccessFromWorkspace(session: AuthSession | null): SessionAuditAccessLevel {
  if (!session) return "none";
  if (session.processIds.includes(RETENTION_PROCESS)) return "admin";
  if (session.processIds.includes(INVESTIGATE_PROCESS) || session.processIds.includes(SENSITIVE_PROCESS)) {
    return "investigate";
  }
  if (session.windowKeys.includes("admin-user-session-audit")) return "read";
  return "none";
}

export function sessionAuditAccessFromSystem(
  systemSession: SystemSession | null,
  workspaceSession: AuthSession | null
): SessionAuditAccessLevel {
  if (systemSession && isSystemOperatorUsername(systemSession.username)) return "admin";
  return sessionAuditAccessFromWorkspace(workspaceSession);
}

export function canViewSessionAudit(level: SessionAuditAccessLevel): boolean {
  return level !== "none";
}

export function canInvestigateSession(level: SessionAuditAccessLevel): boolean {
  return level === "investigate" || level === "admin";
}

export function canViewSensitiveSessionFields(level: SessionAuditAccessLevel): boolean {
  if (level === "admin" || level === "investigate") return true;
  if (level === "read") {
    return false;
  }
  return false;
}

export function canManageRetention(level: SessionAuditAccessLevel): boolean {
  return level === "admin";
}

export function canExportSessionAudit(level: SessionAuditAccessLevel): boolean {
  return level !== "none";
}

/** Audit viewer read-only — investigate actions blocked. */
export function isReadOnlySessionAudit(level: SessionAuditAccessLevel): boolean {
  return level === "read";
}

export { SENSITIVE_PROCESS, INVESTIGATE_PROCESS, RETENTION_PROCESS };
