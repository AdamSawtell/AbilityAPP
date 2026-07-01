import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { readSystemSessionFromCookies } from "@/lib/system/session.server";
import { listMobileSyncAudit } from "@/lib/mobile/mobile-sync-server";

export async function GET() {
  const systemSession = await readSystemSessionFromCookies();
  const workspaceSession = await getAuthSessionFromRequest();
  if (!systemSession && !workspaceSession) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const rows = await listMobileSyncAudit(500);
    return NextResponse.json({ rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load sync audit";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
