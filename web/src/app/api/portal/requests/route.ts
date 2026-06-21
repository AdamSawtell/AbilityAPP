import { NextResponse } from "next/server";
import { PORTAL_SERVICE_CATALOG } from "@/lib/portal/service-request";
import {
  loadPortalServiceRequests,
  requirePortalSessionForApi,
  submitPortalServiceRequest,
} from "@/lib/portal/service-request.server";

export async function GET(request: Request) {
  const session = await requirePortalSessionForApi(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await loadPortalServiceRequests(session.clientId);
  return NextResponse.json({ requests, catalog: PORTAL_SERVICE_CATALOG });
}

export async function POST(request: Request) {
  const session = await requirePortalSessionForApi(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    serviceCategory?: string;
    supportBudget?: string;
    description?: string;
    preferredSchedule?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const record = await submitPortalServiceRequest(session, {
      serviceCategory: body.serviceCategory ?? "",
      supportBudget: body.supportBudget ?? "",
      description: body.description ?? "",
      preferredSchedule: body.preferredSchedule ?? "",
    });
    return NextResponse.json({ request: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not submit request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
