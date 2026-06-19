export type SessionStatus =
  | "active"
  | "logged_out"
  | "timed_out"
  | "expired"
  | "failed_login"
  | "system_terminated";

export type SessionEventType =
  | "successful_login"
  | "failed_login"
  | "logout"
  | "session_timeout"
  | "session_expiry"
  | "password_reset_login"
  | "sso_login"
  | "account_locked"
  | "account_disabled"
  | "role_change_during_session"
  | "concurrent_session_detected"
  | "risk_flagged";

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskStatus = "new" | "under_review" | "accepted" | "resolved";
export type LoginResult = "success" | "failed";
export type ConcurrentSessionsMode = "allow" | "warn" | "prevent";
export type AuthMethod = "password" | "sso" | "password_reset";

export type UserSessionRecord = {
  id: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  loginAt: string;
  logoutAt: string;
  durationSeconds: number | null;
  status: SessionStatus;
  ipAddress: string;
  browser: string;
  deviceInfo: string;
  userAgent: string;
  authMethod: AuthMethod;
  mfaStatus: string;
  loginResult: LoginResult;
  failureReason: string;
  riskLevel: RiskSeverity | "none";
  riskStatus: RiskStatus;
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UserSessionEvent = {
  id: string;
  sessionId: string;
  eventType: SessionEventType;
  detail: string;
  createdAt: string;
};

export type UserSessionRisk = {
  id: string;
  sessionId: string;
  indicatorCode: string;
  indicatorLabel: string;
  severity: RiskSeverity;
  detail: string;
  createdAt: string;
};

export type UserSessionRiskNote = {
  id: string;
  sessionId: string;
  note: string;
  authorUserId: string;
  authorName: string;
  createdAt: string;
};

export type SessionDashboardMetrics = {
  totalLogins: number;
  failedLogins: number;
  uniqueUsers: number;
  mostActiveUser: { userId: string; userName: string; count: number } | null;
  mostActiveRole: { roleId: string; roleName: string; count: number } | null;
  activeSessions: number;
  averageSessionDurationSeconds: number;
  longestSessionSeconds: number;
  riskEvents: number;
  highRiskEvents: number;
};

export type SessionAuditFilters = {
  userId?: string;
  roleId?: string;
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
  status?: SessionStatus;
  loginResult?: LoginResult;
  riskLevel?: string;
  authMethod?: string;
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
  minTransactionCount?: number;
  search?: string;
  cursor?: string;
  offset?: number;
  limit?: number;
};

export type RetentionPolicyRecord = {
  recordType: string;
  label: string;
  retentionDays: number;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
};

export type RetentionJobRun = {
  id: string;
  recordType: string;
  startedAt: string;
  completedAt: string;
  recordsDeleted: number;
  durationMs: number | null;
  errors: string;
  status: "running" | "completed" | "failed";
};

export type SessionRelatedAuditSummary = {
  totalEvents: number;
  recordsModified: number;
  tablesAffected: string[];
  actions: Record<string, number>;
  events: Array<{
    id: string;
    at: string;
    entityType: string;
    entityId: string;
    action: string;
    summary: string;
    detail: string;
  }>;
};

export type SessionInvestigationDetail = {
  session: UserSessionRecord;
  events: UserSessionEvent[];
  risks: UserSessionRisk[];
  notes: UserSessionRiskNote[];
  auditSummary: SessionRelatedAuditSummary;
};
