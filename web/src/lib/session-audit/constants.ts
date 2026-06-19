import type {
  ConcurrentSessionsMode,
  RiskSeverity,
  SessionEventType,
  SessionStatus,
} from "@/lib/session-audit/types";

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  active: "Active",
  logged_out: "Logged out",
  timed_out: "Timed out",
  expired: "Expired",
  failed_login: "Failed login",
  system_terminated: "System terminated",
};

export const SESSION_EVENT_LABELS: Record<SessionEventType, string> = {
  successful_login: "Successful login",
  failed_login: "Failed login",
  logout: "Logout",
  session_timeout: "Session timeout",
  session_expiry: "Session expiry",
  password_reset_login: "Password reset login",
  sso_login: "SSO login",
  account_locked: "Account locked",
  account_disabled: "Account disabled",
  role_change_during_session: "Role change during session",
  concurrent_session_detected: "Concurrent session detected",
  risk_flagged: "Risk flagged",
};

export const RISK_SEVERITY_LABELS: Record<RiskSeverity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const RISK_STATUS_LABELS = {
  new: "New",
  under_review: "Under review",
  accepted: "Accepted",
  resolved: "Resolved",
} as const;

export const CONCURRENT_SESSION_MODES: ConcurrentSessionsMode[] = ["allow", "warn", "prevent"];

export const HIGH_PRIVILEGE_ROLE_IDS = new Set(["role-admin", "role-security-admin"]);

export const DEFAULT_TIMEZONE = "Australia/Sydney";

export const SESSION_AUDIT_PAGE_SIZE = 50;
