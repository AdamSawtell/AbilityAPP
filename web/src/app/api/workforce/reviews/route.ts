import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionHasWindow } from "@/lib/auth/session.server";
import {
  applyWorkforceReview,
  canApproveLeave,
  canReviewCredentials,
  loadWorkforceReviewQueue,
  type WorkforceReviewAction,
} from "@/lib/workforce/review-server";
import { recordProcessExecution } from "@/lib/process-audit/server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "workforce-planning")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canReviewCredentials(session) && !canApproveLeave(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const queue = await loadWorkforceReviewQueue(session);
    return NextResponse.json(queue);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load review queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "workforce-planning")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: WorkforceReviewAction;
  try {
    body = (await request.json()) as WorkforceReviewAction;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.type === "credential") {
    if (!canReviewCredentials(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!body.employeeId?.trim() || !body.credentialId?.trim() || !body.decision) {
      return NextResponse.json({ error: "employeeId, credentialId, and decision are required" }, { status: 400 });
    }
  } else if (body.type === "leave") {
    if (!canApproveLeave(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!body.employeeId?.trim() || !body.requestId?.trim() || !body.decision) {
      return NextResponse.json({ error: "employeeId, requestId, and decision are required" }, { status: 400 });
    }
  } else {
    return NextResponse.json({ error: "Unknown action type" }, { status: 400 });
  }

  try {
    const result = await applyWorkforceReview(session, body);
    const processId = body.type === "leave" ? "approve-leave-request" : "review-employee-credential";
    await recordProcessExecution({
      session,
      processId,
      outcome: "success",
      request,
      entityType: "employee",
      entityId: body.employeeId,
      entityLabel: result.employee.name,
      detail: `${body.decision} ${body.type}`,
    });
    return NextResponse.json(result);
  } catch (err) {
    const processId = body.type === "leave" ? "approve-leave-request" : "review-employee-credential";
    await recordProcessExecution({
      session,
      processId,
      outcome: "failed",
      request,
      entityType: "employee",
      entityId: body.employeeId,
      failureReason: err instanceof Error ? err.message : "Review action failed",
    });
    const message = err instanceof Error ? err.message : "Review action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
