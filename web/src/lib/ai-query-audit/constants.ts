export const AI_QUERY_OUTCOME_LABELS = {
  success: "Success",
  error: "Error",
  blocked: "Blocked",
} as const;

export const SENSITIVE_QUERY_PATTERNS = [
  /password/i,
  /medicare/i,
  /ndis number/i,
  /bank account/i,
  /credit card/i,
];

export const AI_QUERY_AUDIT_PAGE_SIZE = 50;
