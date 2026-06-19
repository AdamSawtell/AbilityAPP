import type { RiskSeverity, RiskStatus } from "@/lib/session-audit/types";

export type ProcessOutcome = "success" | "failed" | "denied";
export type ProcessStatus = "completed" | "failed" | "denied";

export type ProcessAuditRecord = {
  id: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  sessionId: string;
  processId: string;
  processLabel: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  outcome: ProcessOutcome;
  status: ProcessStatus;
  ipAddress: string;
  browser: string;
  deviceInfo: string;
  userAgent: string;
  detail: string;
  failureReason: string;
  durationMs: number | null;
  riskLevel: RiskSeverity | "none";
  riskStatus: RiskStatus;
  startedAt: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type ProcessAuditFilters = {
  userId?: string;
  roleId?: string;
  processId?: string;
  dateFrom?: string;
  dateTo?: string;
  outcome?: ProcessOutcome;
  status?: ProcessStatus;
  riskLevel?: string;
  entityType?: string;
  search?: string;
  cursor?: string;
  offset?: number;
  limit?: number;
};

export type ProcessDashboardMetrics = {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  deniedExecutions: number;
  uniqueUsers: number;
  riskEvents: number;
  highRiskEvents: number;
  mostActiveProcess: { processId: string; processLabel: string; count: number } | null;
  mostActiveUser: { userId: string; userName: string; count: number } | null;
};

export type ProcessInvestigationDetail = {
  record: ProcessAuditRecord;
  events: Array<{ id: string; eventType: string; detail: string; createdAt: string }>;
  risks: Array<{ id: string; indicatorLabel: string; severity: RiskSeverity; detail: string; createdAt: string }>;
  notes: Array<{ id: string; note: string; authorName: string; createdAt: string }>;
};
