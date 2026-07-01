import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { requireMyWorkplace } from "@/lib/my-workplace/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { listActiveSubscriptions, updatePushPreferences } from "@/lib/mobile/push-server";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function prefsFromSubs(subs: { notify_shift_changes: boolean; notify_credentials: boolean }[]) {
  if (!subs.length) {
    return { notifyShiftChanges: true, notifyCredentials: true, subscribed: false };
  }
  return {
    notifyShiftChanges: subs.every((s) => s.notify_shift_changes),
    notifyCredentials: subs.every((s) => s.notify_credentials),
    subscribed: true,
  };
}

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-workplace");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  try {
    const subs = await listActiveSubscriptions(serviceClient(), ctx.session.userId);
    return NextResponse.json(prefsFromSubs(subs));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-workplace");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let body: { notifyShiftChanges?: boolean; notifyCredentials?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await updatePushPreferences(serviceClient(), ctx.session.userId, body);
    const subs = await listActiveSubscriptions(serviceClient(), ctx.session.userId);
    return NextResponse.json(prefsFromSubs(subs));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
