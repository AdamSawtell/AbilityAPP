import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionCanReviewPortalServiceRequests } from "@/lib/portal/service-request-auth";
import { declinePortalServiceRequest, loadPortalServiceRequestForStaff } from "@/lib/portal/service-request.server";
import { assertClientAccessibleInSession } from "@/lib/location-scope.server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function scopeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanReviewPortalServiceRequests(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const existing = await loadPortalServiceRequestForStaff(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = isSupabaseConfigured() ? scopeClient() : null;
  const access = await assertClientAccessibleInSession(supabase, session, existing.clientId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

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
