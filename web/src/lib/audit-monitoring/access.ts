import type { AuthSession } from "@/lib/access/types";
import { isSystemOperatorUsername } from "@/lib/system/constants";
import type { SystemSession } from "@/lib/system/types";
import type { SessionAuditAccessLevel } from "@/lib/session-audit/access";
import {
  sessionAuditAccessFromSystem,
  sessionAuditAccessFromWorkspace,
} from "@/lib/session-audit/access";

export type MonitoringAccessLevel = SessionAuditAccessLevel;

export function processAuditAccessFromWorkspace(session: AuthSession | null): MonitoringAccessLevel {
  if (!session) return "none";
  if (session.processIds.includes("manage-retention-settings")) return "admin";
  if (
    session.processIds.includes("manage-process-audit-risk") ||
    session.processIds.includes("view-process-audit-sensitive")
  ) {
    return "investigate";
  }
  if (session.windowKeys.includes("admin-process-audit")) return "read";
  return "none";
}

export function aiQueryAuditAccessFromWorkspace(session: AuthSession | null): MonitoringAccessLevel {
  if (!session) return "none";
  if (session.processIds.includes("manage-retention-settings")) return "admin";
  if (
    session.processIds.includes("manage-ai-query-audit-risk") ||
    session.processIds.includes("view-ai-query-audit-sensitive")
  ) {
    return "investigate";
  }
  if (session.windowKeys.includes("admin-ai-query-audit")) return "read";
  return "none";
}

export function processAuditAccessFromSystem(
  systemSession: SystemSession | null,
  workspaceSession: AuthSession | null
): MonitoringAccessLevel {
  if (systemSession && isSystemOperatorUsername(systemSession.username)) return "admin";
  return processAuditAccessFromWorkspace(workspaceSession);
}

export function aiQueryAuditAccessFromSystem(
  systemSession: SystemSession | null,
  workspaceSession: AuthSession | null
): MonitoringAccessLevel {
  if (systemSession && isSystemOperatorUsername(systemSession.username)) return "admin";
  return aiQueryAuditAccessFromWorkspace(workspaceSession);
}

export function canViewMonitoring(level: MonitoringAccessLevel) {
  return level !== "none";
}

export function canInvestigateMonitoring(level: MonitoringAccessLevel) {
  return level === "investigate" || level === "admin";
}

export function canViewSensitiveMonitoring(level: MonitoringAccessLevel) {
  return level === "investigate" || level === "admin";
}

export function canExportMonitoring(level: MonitoringAccessLevel) {
  return level !== "none";
}
