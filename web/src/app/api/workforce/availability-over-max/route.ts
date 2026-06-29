import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import {
  getAvailabilityHoursPolicy,
  listPendingOverMaxRequests,
  reviewOverMaxRequest,
} from "@/lib/availability-hours-policy.server";
import { loadMyEmployee } from "@/lib/my-workplace/server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const policy = await getAvailabilityHoursPolicy();
  const canReview =
    sessionHasWindow(session, "workforce-planning") ||
    sessionHasWindow(session, "rostering") ||
    session.activeRoleId === policy.overMaxApprovalRoleId;
  if (!canReview) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const pending = await listPendingOverMaxRequests();
  const enriched = await Promise.all(
    pending.map(async (request) => {
      const employee = await loadMyEmployee(request.employeeId);
      return {
        ...request,
        employeeName: employee?.name ?? request.employeeId,
      };
    })
  );

  return NextResponse.json({ requests: enriched, approvalRoleId: policy.overMaxApprovalRoleId });
}

export async function PATCH(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const policy = await getAvailabilityHoursPolicy();
  const canReview =
    sessionHasWindow(session, "workforce-planning") ||
    sessionHasWindow(session, "rostering") ||
    session.activeRoleId === policy.overMaxApprovalRoleId;
  if (!canReview) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { requestId?: string; decision?: "approved" | "declined"; reviewNotes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const requestId = body.requestId?.trim();
  const decision = body.decision;
  if (!requestId || (decision !== "approved" && decision !== "declined")) {
    return NextResponse.json({ error: "requestId and decision (approved|declined) are required." }, { status: 400 });
  }

  const updated = await reviewOverMaxRequest({
    requestId,
    decision,
    reviewedByUserId: session.userId,
    reviewNotes: body.reviewNotes,
  });
  return NextResponse.json({ request: updated });
}
