import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest, sessionCanWriteWindow, sessionHasWindow } from "@/lib/auth/session.server";
import { readSystemSessionFromCookies } from "@/lib/system/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  buildMessageSummary,
  buildRecipientRegister,
  composeToRecord,
  messageRecordToRow,
  messageRowToRecord,
  validateComposePayload,
} from "@/lib/admin-communications/engine";
import type { AdminMessageComposePayload } from "@/lib/admin-communications/types";
import { newAdminMessageId } from "@/lib/admin-communications/types";

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

async function canWriteComms() {
  if (await readSystemSessionFromCookies()) return true;
  const session = await getAuthSessionFromRequest();
  return session ? sessionCanWriteWindow(session, "admin-communications") : false;
}

async function actorContext() {
  const session = await getAuthSessionFromRequest();
  const systemSession = await readSystemSessionFromCookies();
  return {
    session,
    actorName: session?.displayName || systemSession?.displayName || "System",
    senderUserId: session?.userId ?? "",
    senderName: session?.displayName || systemSession?.displayName || "System",
  };
}

async function loadSupportData(supabase: ReturnType<typeof serviceClient>) {
  const [usersRes, rolesRes, userRolesRes] = await Promise.all([
    supabase.from("app_user").select("id, username, first_name, last_name, active"),
    supabase.from("app_role").select("id, name"),
    supabase.from("app_user_role").select("user_id, role_id"),
  ]);
  if (usersRes.error) throw usersRes.error;
  if (rolesRes.error) throw rolesRes.error;
  if (userRolesRes.error) throw userRolesRes.error;
  return {
    users: usersRes.data ?? [],
    roles: rolesRes.data ?? [],
    userRoles: userRolesRes.data ?? [],
  };
}

export async function GET() {
  if (!(await canReadComms())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ messages: [] });
  }

  const supabase = serviceClient();
  const [messagesRes, acksRes, support] = await Promise.all([
    supabase.from("admin_message").select("*").order("publish_at", { ascending: false }),
    supabase.from("admin_message_acknowledgment").select("*"),
    loadSupportData(supabase),
  ]);
  if (messagesRes.error) return NextResponse.json({ error: messagesRes.error.message }, { status: 500 });
  if (acksRes.error) return NextResponse.json({ error: acksRes.error.message }, { status: 500 });

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

  const messages = (messagesRes.data ?? []).map((row) =>
    buildMessageSummary(messageRowToRecord(row as Record<string, unknown>), support.users, support.userRoles, acks)
  );

  return NextResponse.json({ messages, roles: support.roles });
}

export async function POST(request: Request) {
  if (!(await canWriteComms())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { action?: string; payload?: AdminMessageComposePayload; messageId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { session, actorName, senderUserId, senderName } = await actorContext();
  const now = new Date().toISOString();

  if (body.action === "publish") {
    const validation = body.payload ? validateComposePayload(body.payload) : "Payload is required.";
    if (validation) return NextResponse.json({ error: validation }, { status: 400 });
    if (!body.payload) return NextResponse.json({ error: "Payload is required." }, { status: 400 });

    const record = composeToRecord(body.payload, {
      id: newAdminMessageId(),
      senderUserId,
      senderName,
      actorName,
      now,
    });

    if (isSupabaseConfigured()) {
      const supabase = serviceClient();
      const { error } = await supabase.from("admin_message").insert(messageRecordToRow(record));
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: record });
  }

  if (body.action === "close" || body.action === "reopen") {
    if (!body.messageId?.trim()) return NextResponse.json({ error: "messageId is required." }, { status: 400 });
    if (!isSupabaseConfigured()) return NextResponse.json({ ok: true });

    const supabase = serviceClient();
    const { data, error: fetchErr } = await supabase.from("admin_message").select("*").eq("id", body.messageId).maybeSingle();
    if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    const message = messageRowToRecord(data as Record<string, unknown>);
    const after =
      body.action === "close"
        ? {
            ...message,
            status: "closed" as const,
            closedAt: now,
            closedBy: actorName,
            updatedAt: now,
            updatedBy: actorName,
          }
        : {
            ...message,
            status: "active" as const,
            closedAt: null,
            closedBy: "",
            updatedAt: now,
            updatedBy: actorName,
          };

    const { error } = await supabase.from("admin_message").update(messageRecordToRow(after)).eq("id", body.messageId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, message: after });
  }

  if (body.action === "remind") {
    if (!body.messageId?.trim()) return NextResponse.json({ error: "messageId is required." }, { status: 400 });
    if (!isSupabaseConfigured()) return NextResponse.json({ ok: true, reminded: 0 });

    const supabase = serviceClient();
    const [msgRes, support] = await Promise.all([
      supabase.from("admin_message").select("*").eq("id", body.messageId).maybeSingle(),
      loadSupportData(supabase),
    ]);
    if (msgRes.error) return NextResponse.json({ error: msgRes.error.message }, { status: 500 });
    if (!msgRes.data) return NextResponse.json({ error: "Message not found." }, { status: 404 });

    const message = messageRowToRecord(msgRes.data as Record<string, unknown>);
    const { data: ackRows } = await supabase
      .from("admin_message_acknowledgment")
      .select("*")
      .eq("message_id", body.messageId);

    const acks = (ackRows ?? []).map((row) => ({
      id: String(row.id),
      messageId: String(row.message_id),
      userId: String(row.user_id),
      recurrencePeriod: String(row.recurrence_period ?? ""),
      seenAt: row.seen_at ? String(row.seen_at) : null,
      acknowledgedAt: row.acknowledged_at ? String(row.acknowledged_at) : null,
      bannerDismissedAt: row.banner_dismissed_at ? String(row.banner_dismissed_at) : null,
      createdAt: String(row.created_at ?? ""),
    }));

    const register = buildRecipientRegister(message, support.users, support.userRoles, support.roles, acks);
    const pending = register.filter((r) => r.status !== "acknowledged");
    // Clear seen/dismissed flags so modal/banner re-surfaces for pending users.
    for (const row of pending) {
      await supabase
        .from("admin_message_acknowledgment")
        .delete()
        .eq("message_id", body.messageId)
        .eq("user_id", row.userId);
    }

    return NextResponse.json({ ok: true, reminded: pending.length });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
