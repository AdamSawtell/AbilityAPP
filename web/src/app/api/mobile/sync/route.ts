import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { processMobileSyncBatch, type MobileSyncWriteInput } from "@/lib/mobile/mobile-sync-server";
import { requireMyWorkplace } from "@/lib/my-workplace/server";

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-shifts");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { writes?: MobileSyncWriteInput[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const writes = Array.isArray(body.writes) ? body.writes : [];
  if (!writes.length) return NextResponse.json({ accepted: [], rejected: [] });

  try {
    const result = await processMobileSyncBatch(ctx, writes);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
