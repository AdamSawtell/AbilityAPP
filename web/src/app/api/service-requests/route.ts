import { NextResponse } from "next/server";
import { resolveDetailWindowKey } from "@/lib/access/catalog";
import { canReadWindowSession } from "@/lib/access/window-access";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { loadPortalServiceRequests } from "@/lib/portal/service-request.server";

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  const requestsWindowKey = resolveDetailWindowKey("clients", "Requests");
  if (
    !session ||
    !requestsWindowKey ||
    !canReadWindowSession(session, requestsWindowKey)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = new URL(request.url).searchParams.get("clientId")?.trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  try {
    const requests = await loadPortalServiceRequests(clientId);
    return NextResponse.json({ requests });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load portal requests.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
