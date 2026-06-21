import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionCanReviewPortalServiceRequests } from "@/lib/portal/service-request-auth";
import { approvePortalServiceRequest } from "@/lib/portal/service-request.server";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanReviewPortalServiceRequests(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  try {
    const result = await approvePortalServiceRequest(id, {
      userId: session.userId,
      displayName: session.displayName,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not approve request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
