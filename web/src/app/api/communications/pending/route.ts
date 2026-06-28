import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { buildPendingQueue, messageRowToRecord, messageStatusNeedsSync } from "@/lib/admin-communications/engine";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function GET() {
  const session = await getAuthSessionFromRequest();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ pending: [], blocking: null, banners: [] });
  }

  try {
    const supabase = serviceClient();
    const now = new Date();

    const [messagesRes, acksRes, userRolesRes] = await Promise.all([
      supabase.from("admin_message").select("*").in("status", ["active", "scheduled"]),
      supabase.from("admin_message_acknowledgment").select("*").eq("user_id", session.userId),
      supabase.from("app_user_role").select("role_id").eq("user_id", session.userId),
    ]);
    if (messagesRes.error) throw messagesRes.error;
    if (acksRes.error) throw acksRes.error;
    if (userRolesRes.error) throw userRolesRes.error;

    const messages = (messagesRes.data ?? []).map((row) => messageRowToRecord(row as Record<string, unknown>));

    for (const message of messages) {
      const nextStatus = messageStatusNeedsSync(message, now);
      if (nextStatus) {
        await supabase.from("admin_message").update({ status: nextStatus, updated_at: now.toISOString() }).eq("id", message.id);
        message.status = nextStatus;
      }
    }

    const activeMessages = messages.filter((m) => m.status === "active" || m.status === "scheduled");
    const acks = (acksRes.data ?? []).map((row) => ({
      id: String(row.id),
      messageId: String(row.message_id),
      userId: String(row.user_id),
      recurrencePeriod: String(row.recurrence_period ?? ""),
      seenAt: row.seen_at ? String(row.seen_at) : null,
      acknowledgedAt: row.acknowledged_at ? String(row.acknowledged_at) : null,
      bannerDismissedAt: row.banner_dismissed_at ? String(row.banner_dismissed_at) : null,
      createdAt: String(row.created_at ?? ""),
    }));

    const userRoleIds = (userRolesRes.data ?? []).map((r) => String(r.role_id));
    const pending = buildPendingQueue(activeMessages, session.userId, userRoleIds, acks, now);
    const blocking = pending.find((p) => p.displayMethod === "modal" && p.requiresAcknowledgment) ?? null;
    const banners = pending.filter((p) => p.displayMethod === "banner");

    return NextResponse.json({ pending, blocking, banners });
  } catch {
    // Graceful degradation — never lock users out if comms fetch fails (AB-0034 EC mitigation).
    return NextResponse.json({ pending: [], blocking: null, banners: [] });
  }
}
