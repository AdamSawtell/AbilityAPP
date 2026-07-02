"use client";

import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { PushEmitKind } from "@/lib/mobile/push-events.shared";

export function emitMobilePushEvent(payload: {
  kind: PushEmitKind;
  before?: RosterShiftRecord;
  after?: RosterShiftRecord;
  taskId?: string;
  notePreview?: string;
  employeeUserId?: string;
  dedupeKey?: string;
  requestId?: string;
  employeeId?: string;
  status?: "approved" | "rejected";
}): void {
  void fetch("/api/mobile/push/emit", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}
