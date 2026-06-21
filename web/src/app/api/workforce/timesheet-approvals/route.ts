import { NextResponse } from "next/server";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import {
  applyTimesheetApprovals,
  loadTimesheetApprovalQueue,
  type TimesheetApprovalAction,
} from "@/lib/workforce/timesheet-approval-server";
import { canApproveTimesheet, type TimesheetApprovalScopeKind } from "@/lib/workforce/timesheet-approval-queue";
import { recordProcessExecution } from "@/lib/process-audit/server";

function parseScope(value: string | null): TimesheetApprovalScopeKind {
  if (
    value === "management-line" ||
    value === "direct-reports" ||
    value === "my-locations" ||
    value === "location" ||
    value === "organisation"
  ) {
    return value;
  }
  return "management-line";
}

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "timesheet-approval")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canApproveTimesheet(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const scope = parseScope(url.searchParams.get("scope"));
  const locationId = url.searchParams.get("locationId") ?? "";

  try {
    const queue = await loadTimesheetApprovalQueue(session, scope, locationId);
    return NextResponse.json(queue);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load timesheet approval queue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "timesheet-approval")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!canApproveTimesheet(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: TimesheetApprovalAction;
  try {
    body = (await request.json()) as TimesheetApprovalAction;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(body.timesheetIds) || !body.timesheetIds.length) {
    return NextResponse.json({ error: "timesheetIds is required" }, { status: 400 });
  }

  const scope = parseScope(body.scope ?? null);
  const locationId = body.locationId ?? "";

  try {
    const approved = await applyTimesheetApprovals(session, { ...body, scope, locationId }, session.displayName);
    for (const sheet of approved) {
      await recordProcessExecution({
        session,
        processId: "approve-timesheet",
        outcome: "success",
        request,
        entityType: "timesheet",
        entityId: sheet.id,
        entityLabel: sheet.documentNo,
        detail: `Approved ${sheet.documentNo}`,
      });
    }
    return NextResponse.json({ approved });
  } catch (err) {
    await recordProcessExecution({
      session,
      processId: "approve-timesheet",
      outcome: "failed",
      request,
      entityType: "timesheet",
      entityId: body.timesheetIds[0] ?? "",
      failureReason: err instanceof Error ? err.message : "Timesheet approval failed",
    });
    const message = err instanceof Error ? err.message : "Timesheet approval failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
