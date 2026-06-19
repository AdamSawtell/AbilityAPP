import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { createAiDatabase } from "@/lib/ai/db";
import { saveClientActivityDraft } from "@/lib/ai/save-client-activity-draft";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = createAiDatabase(session);
  if (!db?.client) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const result = await saveClientActivityDraft(db.client, session, id);
  if (!result.ok) {
    const status = result.error.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: result.error }, { status });
  }

  return NextResponse.json(result);
}
