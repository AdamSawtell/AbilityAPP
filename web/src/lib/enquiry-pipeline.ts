import type { EnquiryRecord } from "@/lib/enquiry";
import { localDateIso } from "@/lib/booking-cancellation";

/** Scope-aligned intake pipeline (Chunk 0 — stage 0). */
export const ENQUIRY_PIPELINE_STATUSES = [
  "1_Enquiry received",
  "2_Qualification",
  "3_Proposal",
  "4_Converted",
  "5_Lost",
] as const;

export type EnquiryPipelineStatus = (typeof ENQUIRY_PIPELINE_STATUSES)[number];

const LEGACY_STATUS_MAP: Record<string, EnquiryPipelineStatus> = {
  "1_Initial Enquiry": "1_Enquiry received",
  "2_To be processed": "2_Qualification",
  "3_In progress": "3_Proposal",
  "4_Converted": "4_Converted",
  "5_Closed": "5_Lost",
};

export const ENQUIRY_PIPELINE_LABELS: Record<EnquiryPipelineStatus, string> = {
  "1_Enquiry received": "Enquiry received",
  "2_Qualification": "Qualification",
  "3_Proposal": "Proposal",
  "4_Converted": "Converted (won)",
  "5_Lost": "Lost",
};

export const ENQUIRY_PIPELINE_BADGE_CLASS: Record<EnquiryPipelineStatus, string> = {
  "1_Enquiry received": "bg-sky-50 text-sky-900 ring-sky-200",
  "2_Qualification": "bg-violet-50 text-violet-900 ring-violet-200",
  "3_Proposal": "bg-amber-50 text-amber-900 ring-amber-200",
  "4_Converted": "bg-emerald-50 text-emerald-800 ring-emerald-200",
  "5_Lost": "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

export const ENQUIRY_STATUS_TRANSITIONS: Record<string, readonly string[]> = {
  "1_Enquiry received": ["2_Qualification", "5_Lost"],
  "2_Qualification": ["1_Enquiry received", "3_Proposal", "5_Lost"],
  "3_Proposal": ["2_Qualification", "5_Lost"],
  "4_Converted": [],
  "5_Lost": [],
};

export type EnquiryPipelineIssue = {
  code: string;
  message: string;
  severity: "error" | "warning";
};

export function isEnquiryPipelineStatus(value: string): value is EnquiryPipelineStatus {
  return (ENQUIRY_PIPELINE_STATUSES as readonly string[]).includes(value);
}

export function normalizeEnquiryStatus(value: string | undefined | null): EnquiryPipelineStatus {
  const trimmed = (value ?? "").trim();
  if (isEnquiryPipelineStatus(trimmed)) return trimmed;
  return LEGACY_STATUS_MAP[trimmed] ?? "1_Enquiry received";
}

export function enquiryPipelineLabel(status: string): string {
  return ENQUIRY_PIPELINE_LABELS[normalizeEnquiryStatus(status)];
}

export function enquiryPipelineTone(status: string): "sky" | "violet" | "amber" | "emerald" | "zinc" {
  const key = normalizeEnquiryStatus(status);
  if (key.startsWith("1_")) return "sky";
  if (key.startsWith("2_")) return "violet";
  if (key.startsWith("3_")) return "amber";
  if (key.startsWith("4_")) return "emerald";
  return "zinc";
}

export function isEnquiryConverted(status: string): boolean {
  return normalizeEnquiryStatus(status) === "4_Converted";
}

export function isEnquiryLost(status: string): boolean {
  return normalizeEnquiryStatus(status) === "5_Lost";
}

export function isEnquiryClosed(status: string): boolean {
  const key = normalizeEnquiryStatus(status);
  return key === "4_Converted" || key === "5_Lost";
}

export function isValidEnquiryTransition(from: string, to: string): boolean {
  const fromKey = normalizeEnquiryStatus(from);
  const toKey = normalizeEnquiryStatus(to);
  if (fromKey === toKey) return true;
  const allowed = ENQUIRY_STATUS_TRANSITIONS[fromKey] ?? ENQUIRY_PIPELINE_STATUSES;
  return allowed.includes(toKey);
}

export function isEnquiryFollowUpOverdue(dateNextAction: string, status: string): boolean {
  if (!dateNextAction?.trim() || isEnquiryClosed(status)) return false;
  return dateNextAction < localDateIso();
}

export type EnquiryPipelineValidateOptions = {
  /** Set when enquiry-to-client process sets status to converted. */
  allowConverted?: boolean;
};

export function validateEnquiryPipeline(
  record: EnquiryRecord,
  previousStatus?: string,
  options: EnquiryPipelineValidateOptions = {}
): EnquiryPipelineIssue[] {
  const issues: EnquiryPipelineIssue[] = [];
  const status = normalizeEnquiryStatus(record.status);
  const prev = previousStatus ? normalizeEnquiryStatus(previousStatus) : status;

  if (status === "4_Converted" && prev !== "4_Converted" && !options.allowConverted) {
    issues.push({
      code: "CONVERT_USE_PROCESS",
      message: "Use Convert to client to mark an enquiry as won — do not set converted status manually.",
      severity: "error",
    });
  }

  if (prev !== status && !isValidEnquiryTransition(prev, status) && !(status === "4_Converted" && options.allowConverted)) {
    issues.push({
      code: "STATUS_TRANSITION_INVALID",
      message: `Cannot change status from "${ENQUIRY_PIPELINE_LABELS[prev]}" to "${ENQUIRY_PIPELINE_LABELS[status]}". Follow the pipeline: received → qualification → proposal → converted or lost.`,
      severity: "error",
    });
  }

  if (status === "5_Lost" && !record.lossReason?.trim()) {
    issues.push({
      code: "LOSS_REASON_REQUIRED",
      message: "Select a loss reason when marking an enquiry as lost.",
      severity: "error",
    });
  }

  if (status === "5_Lost" && !record.dateNextAction?.trim()) {
    issues.push({
      code: "NURTURE_DATE_RECOMMENDED",
      message: "Set a next action date for nurture follow-up (for example plan review timing).",
      severity: "warning",
    });
  }

  if (!isEnquiryClosed(status) && !record.dateNextAction?.trim()) {
    issues.push({
      code: "NEXT_ACTION_MISSING",
      message: "Set a next action date so intake follow-ups stay on track.",
      severity: "warning",
    });
  }

  if (isEnquiryFollowUpOverdue(record.dateNextAction, status)) {
    issues.push({
      code: "NEXT_ACTION_OVERDUE",
      message: "Next action date is in the past — update the date or close the enquiry.",
      severity: "warning",
    });
  }

  return issues;
}

export function enquiryPipelineBlocked(issues: EnquiryPipelineIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

export function applyEnquiryStatusChange(record: EnquiryRecord, nextStatus: string): EnquiryRecord {
  const status = normalizeEnquiryStatus(nextStatus);
  const next: EnquiryRecord = { ...record, status };
  if (status !== "5_Lost") {
    next.lossReason = "";
  }
  return next;
}

export function normalizeEnquiryPipeline(record: EnquiryRecord): EnquiryRecord {
  return {
    ...record,
    status: normalizeEnquiryStatus(record.status),
    lossReason: record.lossReason ?? "",
  };
}
