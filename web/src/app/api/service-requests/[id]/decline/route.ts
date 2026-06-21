import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionCanReviewPortalServiceRequests } from "@/lib/portal/service-request-auth";
import { declinePortalServiceRequest } from "@/lib/portal/service-request.server";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanReviewPortalServiceRequests(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  let body: { reason?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const record = await declinePortalServiceRequest(
      id,
      { userId: session.userId, displayName: session.displayName },
      body.reason ?? ""
    );
    return NextResponse.json({ request: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not decline request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
