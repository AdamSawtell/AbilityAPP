import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionCanReviewPortalServiceRequests } from "@/lib/portal/service-request-auth";
import { loadPortalServiceRequestForStaff } from "@/lib/portal/service-request.server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanReviewPortalServiceRequests(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const record = await loadPortalServiceRequestForStaff(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ request: record });
}
