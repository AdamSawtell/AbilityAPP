import type { RiskSeverity, RiskStatus } from "@/lib/session-audit/types";

export type AiQueryOutcome = "success" | "error" | "blocked";
export type AiQueryType = "chat" | "tool_call";

export type AiQueryAuditRecord = {
  id: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  sessionId: string;
  agentId: string;
  agentName: string;
  queryType: AiQueryType;
  userMessage: string;
  assistantMessage: string;
  toolCallCount: number;
  outcome: AiQueryOutcome;
  ipAddress: string;
  browser: string;
  deviceInfo: string;
  userAgent: string;
  durationMs: number | null;
  riskLevel: RiskSeverity | "none";
  riskStatus: RiskStatus;
  createdAt: string;
};

export type AiQueryAuditFilters = {
  userId?: string;
  roleId?: string;
  agentId?: string;
  dateFrom?: string;
  dateTo?: string;
  outcome?: AiQueryOutcome;
  queryType?: AiQueryType;
  riskLevel?: string;
  search?: string;
  offset?: number;
  limit?: number;
};

export type AiQueryDashboardMetrics = {
  totalQueries: number;
  successfulQueries: number;
  errorQueries: number;
  blockedQueries: number;
  uniqueUsers: number;
  toolCalls: number;
  riskEvents: number;
  highRiskEvents: number;
  mostActiveAgent: { agentId: string; agentName: string; count: number } | null;
  mostActiveUser: { userId: string; userName: string; count: number } | null;
};

export type AiQueryInvestigationDetail = {
  record: AiQueryAuditRecord;
  dbAccessLog: Array<{ toolName: string; action: string; target: string; createdAt: string }>;
  risks: Array<{ id: string; indicatorLabel: string; severity: RiskSeverity; detail: string; createdAt: string }>;
  notes: Array<{ id: string; note: string; authorName: string; createdAt: string }>;
};
