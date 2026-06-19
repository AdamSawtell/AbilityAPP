import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { recordProcessExecution } from "@/lib/process-audit/server";
import type { ProcessOutcome } from "@/lib/process-audit/types";

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    processId?: string;
    outcome?: ProcessOutcome;
    entityType?: string;
    entityId?: string;
    entityLabel?: string;
    detail?: string;
    failureReason?: string;
    durationMs?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.processId?.trim()) {
    return NextResponse.json({ error: "processId is required" }, { status: 400 });
  }

  if (!session.processIds.includes(body.processId)) {
    return NextResponse.json({ error: "Process not permitted for this role" }, { status: 403 });
  }

  const id = await recordProcessExecution({
    session,
    processId: body.processId,
    outcome: body.outcome ?? "success",
    request,
    entityType: body.entityType,
    entityId: body.entityId,
    failureReason: body.failureReason,
    entityLabel: body.entityLabel,
    detail: body.detail,
    durationMs: body.durationMs,
  });

  return NextResponse.json({ id });
}
