import { NextResponse } from "next/server";
import { resolveDetailWindowKey } from "@/lib/access/catalog";
import { canReadWindowSession } from "@/lib/access/window-access";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { loadPortalServiceRequests } from "@/lib/portal/service-request.server";
import { assertClientAccessibleInSession } from "@/lib/location-scope.server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function scopeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function GET(request: Request) {
  const session = await getAuthSessionFromRequest();
  const requestsWindowKey = resolveDetailWindowKey("clients", "Requests");
  if (
    !session ||
    !requestsWindowKey ||
    !canReadWindowSession(session, requestsWindowKey)
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const clientId = new URL(request.url).searchParams.get("clientId")?.trim();
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required." }, { status: 400 });
  }

  const supabase = isSupabaseConfigured() ? scopeClient() : null;
  const clientAccess = await assertClientAccessibleInSession(supabase, session, clientId);
  if (!clientAccess.ok) {
    return NextResponse.json({ error: clientAccess.error }, { status: clientAccess.status });
  }

  try {
    const requests = await loadPortalServiceRequests(clientId);
    return NextResponse.json({ requests });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load portal requests.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
