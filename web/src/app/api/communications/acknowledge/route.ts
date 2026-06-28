import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { recurrencePeriodKey } from "@/lib/admin-communications/engine";
import { normalizeRecurrence } from "@/lib/admin-communications/types";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    messageId?: string;
    action?: "seen" | "acknowledge" | "dismiss_banner";
    recurrencePeriod?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.messageId?.trim() || !body.action) {
    return NextResponse.json({ error: "messageId and action are required." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const supabase = serviceClient();
  const { data: msgRow, error: msgErr } = await supabase
    .from("admin_message")
    .select("recurrence_config")
    .eq("id", body.messageId)
    .maybeSingle();
  if (msgErr) return NextResponse.json({ error: msgErr.message }, { status: 500 });
  if (!msgRow) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const recurrence = normalizeRecurrence(msgRow.recurrence_config);
  const period = body.recurrencePeriod ?? recurrencePeriodKey(recurrence, new Date());
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("admin_message_acknowledgment")
    .select("*")
    .eq("message_id", body.messageId)
    .eq("user_id", session.userId)
    .eq("recurrence_period", period)
    .maybeSingle();

  if (body.action === "acknowledge") {
    if (existing?.acknowledged_at) {
      return NextResponse.json({ ok: true, already: true });
    }
    const row = {
      message_id: body.messageId,
      user_id: session.userId,
      recurrence_period: period,
      seen_at: existing?.seen_at ?? now,
      acknowledged_at: now,
    };
    const { error } = existing
      ? await supabase
          .from("admin_message_acknowledgment")
          .update({ seen_at: row.seen_at, acknowledged_at: now })
          .eq("id", existing.id)
      : await supabase.from("admin_message_acknowledgment").insert(row);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "seen") {
    if (existing?.seen_at) return NextResponse.json({ ok: true });
    const { error } = existing
      ? await supabase.from("admin_message_acknowledgment").update({ seen_at: now }).eq("id", existing.id)
      : await supabase.from("admin_message_acknowledgment").insert({
          message_id: body.messageId,
          user_id: session.userId,
          recurrence_period: period,
          seen_at: now,
        });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "dismiss_banner") {
    const { error } = existing
      ? await supabase
          .from("admin_message_acknowledgment")
          .update({ banner_dismissed_at: now, seen_at: existing.seen_at ?? now })
          .eq("id", existing.id)
      : await supabase.from("admin_message_acknowledgment").insert({
          message_id: body.messageId,
          user_id: session.userId,
          recurrence_period: period,
          seen_at: now,
          banner_dismissed_at: now,
        });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
