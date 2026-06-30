import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    sessionId: session.sessionId,
    idleTimeoutMinutes: session.idleTimeoutMinutes,
  });
}
