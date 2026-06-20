import { NextResponse } from "next/server";
import { getPortalSessionFromRequest } from "@/lib/portal/session.server";
import { loadPortalBudget, resolveValidPortalSession } from "@/lib/portal/server";

export async function GET(request: Request) {
  const session = await resolveValidPortalSession(await getPortalSessionFromRequest(request));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const budget = await loadPortalBudget(session.clientId);
  if (!budget) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ budget });
}
