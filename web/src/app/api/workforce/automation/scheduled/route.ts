import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { sessionHasWindow } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { runServerScheduledAutomations } from "@/lib/task-automation/run-server";
import { runServerShiftCheckinEscalation } from "@/lib/shift-checkin-monitoring-server";
import { runScheduledMobilePushNotifications } from "@/lib/mobile/push-scheduled";
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

  const supabase = serviceClient();
  const errors: string[] = [];

  let created = 0;
  try {
    created = await runServerScheduledAutomations(supabase);
  } catch (err) {
    errors.push(`automations: ${err instanceof Error ? err.message : "failed"}`);
  }

  let shiftEscalations = 0;
  try {
    shiftEscalations = await runServerShiftCheckinEscalation(supabase);
  } catch (err) {
    const detail =
      err instanceof Error
        ? err.message
        : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err);
    console.error("shift-checkin escalation failed:", err);
    errors.push(`shift-checkin: ${detail}`);
  }

  let mobilePushes = 0;
  try {
    mobilePushes = await runScheduledMobilePushNotifications(supabase);
  } catch (err) {
    errors.push(`mobile-push: ${err instanceof Error ? err.message : "failed"}`);
  }

  if (errors.length === 3) {
    return NextResponse.json({ error: errors.join("; ") }, { status: 500 });
  }
  return NextResponse.json({
    created: created + shiftEscalations,
    shiftEscalations,
    mobilePushes,
    ...(errors.length ? { warnings: errors } : {}),
  });
}
