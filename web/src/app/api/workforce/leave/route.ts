import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionHasWindow } from "@/lib/auth/session.server";
import { submitLeaveOnBehalf } from "@/lib/my-workplace/server";

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "workforce-planning")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!session.processIds.includes("submit-leave-on-behalf")) {
    return NextResponse.json({ error: "Submit leave on behalf not permitted for this role" }, { status: 403 });
  }

  let body: { employeeId?: string; leaveType?: string; startDate?: string; endDate?: string; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.employeeId?.trim() || !body.leaveType?.trim() || !body.startDate?.trim() || !body.endDate?.trim()) {
    return NextResponse.json({ error: "Employee, leave type, start date, and end date are required" }, { status: 400 });
  }

  try {
    const { request: requestRow, employee: updated } = await submitLeaveOnBehalf(session, body.employeeId.trim(), {
      leaveType: body.leaveType,
      startDate: body.startDate,
      endDate: body.endDate,
      notes: body.notes ?? "",
    });
    return NextResponse.json({ request: requestRow, employee: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not submit leave";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
