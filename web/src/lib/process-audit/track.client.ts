import type { ProcessOutcome } from "@/lib/process-audit/types";

export type TrackProcessInput = {
  processId: string;
  outcome?: ProcessOutcome;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  detail?: string;
  failureReason?: string;
  durationMs?: number;
};

/** Fire-and-forget process audit from the browser (session from cookie). */
export function trackProcessExecution(input: TrackProcessInput) {
  void fetch("/api/system/process-audit/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ ...input, outcome: input.outcome ?? "success" }),
  }).catch(() => {
    /* non-blocking */
  });
}
