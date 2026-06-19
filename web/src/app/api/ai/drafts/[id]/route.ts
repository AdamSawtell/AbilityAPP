import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { fetchAiDraftForSession } from "@/lib/ai/draft-server";
import { createAiDatabase } from "@/lib/ai/db";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = createAiDatabase(session);
  if (!db?.client) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const draft = await fetchAiDraftForSession(db.client, session, id);
  if (!draft) {
    return NextResponse.json({ error: "Draft not found or expired" }, { status: 404 });
  }

  return NextResponse.json({
    id: draft.id,
    entityType: draft.entity_type,
    targetRoute: draft.target_route,
    payload: draft.payload,
    summary: draft.summary,
  });
}
