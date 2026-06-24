import { NextResponse } from "next/server";
import { getAgencyPortalSessionFromRequest } from "@/lib/agency-portal/session.server";
import { loadAgencyPortalInvoiceDocument, resolveValidAgencyPortalSession } from "@/lib/agency-portal/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const raw = await getAgencyPortalSessionFromRequest(request);
  const session = await resolveValidAgencyPortalSession(raw);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const doc = await loadAgencyPortalInvoiceDocument(session.vendorBpId, id);
  if (!doc) return NextResponse.json({ error: "Invoice document not found" }, { status: 404 });

  return NextResponse.json(doc);
}
