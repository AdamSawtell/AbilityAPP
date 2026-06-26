import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionCanReviewPortalServiceRequests } from "@/lib/portal/service-request-auth";
import { loadPortalServiceRequestForStaff } from "@/lib/portal/service-request.server";
import { assertClientAccessibleInSession } from "@/lib/location-scope.server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured } from "@/lib/supabase/client";

function scopeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return null;
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

async function assertStaffRequestAccess(session: NonNullable<Awaited<ReturnType<typeof getAuthSessionFromRequest>>>, requestId: string) {
  const record = await loadPortalServiceRequestForStaff(requestId);
  if (!record) return { ok: false as const, status: 404 as const, error: "Not found" };
  const supabase = isSupabaseConfigured() ? scopeClient() : null;
  const access = await assertClientAccessibleInSession(supabase, session, record.clientId);
  if (!access.ok) return { ok: false as const, status: access.status, error: access.error };
  return { ok: true as const, record };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanReviewPortalServiceRequests(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const gate = await assertStaffRequestAccess(session, id);
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  return NextResponse.json({ request: gate.record });
}
