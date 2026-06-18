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
    const employee = await applyWorkforceReview(session, body);
    return NextResponse.json({ employee });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
