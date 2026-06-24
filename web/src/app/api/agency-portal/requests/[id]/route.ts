import { NextResponse } from "next/server";
import { getAgencyPortalSessionFromRequest } from "@/lib/agency-portal/session.server";
import {
  confirmAgencyPortalRequest,
  loadAgencyPortalRequest,
  loadAgencyPortalWorkers,
  resolveValidAgencyPortalSession,
} from "@/lib/agency-portal/server";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const raw = await getAgencyPortalSessionFromRequest(request);
  const session = await resolveValidAgencyPortalSession(raw);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const item = await loadAgencyPortalRequest(session.vendorBpId, id);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const workers = await loadAgencyPortalWorkers(session.vendorBpId);
  return NextResponse.json({ request: item, workers });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const raw = await getAgencyPortalSessionFromRequest(request);
  const session = await resolveValidAgencyPortalSession(raw);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { agencyWorkerId?: string; continuityNotes?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const agencyWorkerId = body.agencyWorkerId?.trim() ?? "";
  if (!agencyWorkerId) return NextResponse.json({ error: "Agency worker is required" }, { status: 400 });

  const { id } = await context.params;
  const result = await confirmAgencyPortalRequest({
    vendorBpId: session.vendorBpId,
    requestId: id,
    agencyWorkerId,
    continuityNotes: body.continuityNotes,
    actor: `Agency portal (${session.email})`,
  });

  if (!result.ok) return NextResponse.json({ error: result.error ?? "Could not confirm" }, { status: 400 });
  return NextResponse.json({ request: result.item });
}
