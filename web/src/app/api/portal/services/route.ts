import { NextResponse } from "next/server";
import { getPortalSessionFromRequest } from "@/lib/portal/session.server";
import { loadPortalServices, resolveValidPortalSession } from "@/lib/portal/server";

export async function GET(request: Request) {
  const session = await resolveValidPortalSession(await getPortalSessionFromRequest(request));
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const services = await loadPortalServices(session.clientId);
  return NextResponse.json({ services });
}
