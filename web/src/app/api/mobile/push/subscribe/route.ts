import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { requireMyWorkplace } from "@/lib/my-workplace/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  deactivatePushSubscription,
  listActiveSubscriptions,
  upsertPushSubscription,
} from "@/lib/mobile/push-server";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-workplace");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string }; deviceLabel?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "endpoint and keys are required" }, { status: 400 });
  }

  try {
    const row = await upsertPushSubscription(serviceClient(), {
      userId: ctx.session.userId,
      employeeId: ctx.employeeId,
      endpoint,
      p256dh,
      auth,
      deviceLabel: body.deviceLabel,
    });
    return NextResponse.json({ id: row.id, active: row.active });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Subscribe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-workplace");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  let body: { endpoint?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const endpoint = body.endpoint?.trim();
  if (!endpoint) return NextResponse.json({ error: "endpoint required" }, { status: 400 });

  try {
    await deactivatePushSubscription(serviceClient(), ctx.session.userId, endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unsubscribe failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-workplace");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  try {
    const subs = await listActiveSubscriptions(serviceClient(), ctx.session.userId);
    return NextResponse.json({ count: subs.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Load failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
