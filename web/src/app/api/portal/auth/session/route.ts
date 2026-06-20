import { NextResponse } from "next/server";
import { getPortalSessionFromRequest } from "@/lib/portal/session.server";
import { loadPortalClientSummary, resolveValidPortalSession } from "@/lib/portal/server";

export async function GET(request: Request) {
  const session = await resolveValidPortalSession(await getPortalSessionFromRequest(request));
  if (!session) return NextResponse.json({ session: null }, { status: 401 });

  const client = await loadPortalClientSummary(session.clientId);
  if (!client) return NextResponse.json({ session: null }, { status: 401 });

  return NextResponse.json({
    session: {
      clientId: session.clientId,
      email: session.email,
      displayName: session.displayName,
      planReviewDueDate: client.planReviewDueDate,
    },
  });
}
