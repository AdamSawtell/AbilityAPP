import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionCanReviewPortalServiceRequests } from "@/lib/portal/service-request-auth";
import { approvePortalServiceRequest, loadPortalServiceRequestForStaff } from "@/lib/portal/service-request.server";
import { assertClientAccessibleInSession } from "@/lib/location-scope.server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function scopeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanReviewPortalServiceRequests(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const record = await loadPortalServiceRequestForStaff(id);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const supabase = isSupabaseConfigured() ? scopeClient() : null;
  const access = await assertClientAccessibleInSession(supabase, session, record.clientId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

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
