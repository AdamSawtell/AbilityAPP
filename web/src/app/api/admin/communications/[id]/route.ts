import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import { readSystemSessionFromCookies } from "@/lib/system/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  acknowledgmentCsvRows,
  buildMessageSummary,
  buildRecipientRegister,
  messageRowToRecord,
  toCsv,
} from "@/lib/admin-communications/engine";

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

async function canReadComms() {
  if (await readSystemSessionFromCookies()) return true;
  const session = await getAuthSessionFromRequest();
  return session ? sessionHasWindow(session, "admin-communications") : false;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await canReadComms())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const url = new URL(_request.url);
  const format = url.searchParams.get("format");

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const supabase = serviceClient();
  const [msgRes, acksRes, usersRes, rolesRes, userRolesRes] = await Promise.all([
    supabase.from("admin_message").select("*").eq("id", id).maybeSingle(),
    supabase.from("admin_message_acknowledgment").select("*").eq("message_id", id),
    supabase.from("app_user").select("id, username, first_name, last_name, active"),
    supabase.from("app_role").select("id, name"),
    supabase.from("app_user_role").select("user_id, role_id"),
  ]);

  if (msgRes.error) return NextResponse.json({ error: msgRes.error.message }, { status: 500 });
  if (!msgRes.data) return NextResponse.json({ error: "Message not found." }, { status: 404 });

  const message = messageRowToRecord(msgRes.data as Record<string, unknown>);
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

  const users = usersRes.data ?? [];
  const roles = rolesRes.data ?? [];
  const userRoles = userRolesRes.data ?? [];
  const summary = buildMessageSummary(message, users, userRoles, acks);
  const register = buildRecipientRegister(message, users, userRoles, roles, acks);

  if (format === "csv") {
    const csv = toCsv(acknowledgmentCsvRows(register));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="message-${id}-acknowledgments.csv"`,
      },
    });
  }

  return NextResponse.json({ message: summary, register });
}
