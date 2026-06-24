import { NextResponse } from "next/server";
import { getAgencyPortalSessionFromRequest } from "@/lib/agency-portal/session.server";
import { loadAgencyPortalTimesheets, resolveValidAgencyPortalSession } from "@/lib/agency-portal/server";

export async function GET(request: Request) {
  const raw = await getAgencyPortalSessionFromRequest(request);
  const session = await resolveValidAgencyPortalSession(raw);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const timesheets = await loadAgencyPortalTimesheets(session.vendorBpId);
  return NextResponse.json({ timesheets });
}
