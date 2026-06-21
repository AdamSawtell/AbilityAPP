import type { AuthSession } from "@/lib/access/types";

export function sessionCanReviewPortalServiceRequests(session: AuthSession): boolean {
  return session.processIds.includes("assign-task") || session.processIds.includes("action-task");
}
