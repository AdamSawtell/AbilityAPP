import { NextResponse } from "next/server";
import { getAgencyPortalSessionFromRequest } from "@/lib/agency-portal/session.server";
import { loadAgencyPortalVendorSummary, resolveValidAgencyPortalSession } from "@/lib/agency-portal/server";

export async function GET(request: Request) {
  const raw = await getAgencyPortalSessionFromRequest(request);
  const session = await resolveValidAgencyPortalSession(raw);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const vendor = await loadAgencyPortalVendorSummary(session.vendorBpId);
  if (!vendor) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  return NextResponse.json({
    session: {
      vendorBpId: session.vendorBpId,
      email: session.email,
      displayName: session.displayName,
    },
  });
}
