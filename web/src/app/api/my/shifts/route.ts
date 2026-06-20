import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { performMyShiftCheckIn, performMyShiftCheckOut, requireMyWorkplace } from "@/lib/my-workplace/server";

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-shifts");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { shiftId?: string; action?: string; notes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const shiftId = body.shiftId?.trim() ?? "";
  if (!shiftId) return NextResponse.json({ error: "Shift id is required" }, { status: 400 });

  try {
    if (body.action === "check-in") {
      const shift = await performMyShiftCheckIn(ctx, shiftId);
      return NextResponse.json({ shift });
    }
    if (body.action === "check-out") {
      const shift = await performMyShiftCheckOut(ctx, shiftId, body.notes ?? "");
      return NextResponse.json({ shift });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update shift";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
