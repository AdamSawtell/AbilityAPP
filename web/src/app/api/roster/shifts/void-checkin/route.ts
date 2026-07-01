import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionHasWindow } from "@/lib/auth/session.server";
import { performVoidShiftCheckIn } from "@/lib/my-workplace/server";

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "rostering") && !sessionHasWindow(session, "timesheet-approval")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { shiftId?: string; employeeId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shiftId = body.shiftId?.trim() ?? "";
  const employeeId = body.employeeId?.trim() ?? "";
  if (!shiftId || !employeeId) {
    return NextResponse.json({ error: "shiftId and employeeId are required" }, { status: 400 });
  }

  try {
    const shift = await performVoidShiftCheckIn(shiftId, employeeId, session.displayName);
    return NextResponse.json({ shift });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not void check-in";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
