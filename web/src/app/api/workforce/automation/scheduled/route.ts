import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionHasWindow } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { runServerScheduledAutomations } from "@/lib/task-automation/run-server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

/**
 * Run scheduled task automations (credential expiry, incident SLA).
 * Intended for cron or manual trigger by workforce/HR users.
 */
export async function POST() {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!sessionHasWindow(session, "workforce-planning")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  try {
    const created = await runServerScheduledAutomations(serviceClient());
    return NextResponse.json({ created });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scheduled automation run failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
