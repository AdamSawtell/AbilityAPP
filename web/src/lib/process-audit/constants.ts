export const PROCESS_OUTCOME_LABELS = {
  success: "Success",
  failed: "Failed",
  denied: "Denied",
} as const;

export const PROCESS_STATUS_LABELS = {
  completed: "Completed",
  failed: "Failed",
  denied: "Denied",
} as const;

export const HIGH_PRIVILEGE_PROCESS_IDS = new Set([
  "approve-leave-request",
  "review-employee-credential",
  "enquiry-to-client",
  "notify-ndis-reportable",
  "submit-leave-on-behalf",
  "manage-retention-settings",
  "manage-session-audit-risk",
]);

export const PROCESS_AUDIT_PAGE_SIZE = 50;
