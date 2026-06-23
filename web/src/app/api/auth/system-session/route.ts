import { NextResponse } from "next/server";
import { isSystemOperatorUsername } from "@/lib/system/constants";
import {
  buildSystemSession,
  createSystemSessionToken,
  readSystemSessionFromCookies,
  systemSessionCookieOptions,
} from "@/lib/system/session.server";
import { SEED_USERS } from "@/lib/access/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchUsers } from "@/lib/supabase/access-api";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

async function loadUser(userId: string) {
  if (isSupabaseConfigured()) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url?.trim() || !key?.trim()) return null;
    const supabase = createSupabaseClient(url, key, { auth: { persistSession: false } });
    const users = await fetchUsers(supabase);
    return users.find((u) => u.id === userId) ?? null;
  }
  return SEED_USERS.find((u) => u.id === userId) ?? null;
}

export async function GET() {
  const session = await readSystemSessionFromCookies();
  if (!session) return NextResponse.json({ session: null }, { status: 401 });
  return NextResponse.json({ session });
}

export async function POST(request: Request) {
  let body: { userId?: string };
  try {
    body = (await request.json()) as { userId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const userId = body.userId?.trim() ?? "";
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const user = await loadUser(userId);
  if (!user?.active || !isSystemOperatorUsername(user.username)) {
    return NextResponse.json({ error: "This account cannot access System setup" }, { status: 403 });
  }

  const session = await buildSystemSession(userId);
  if (!session) {
    return NextResponse.json({ error: "Could not start system session" }, { status: 403 });
  }

  const token = createSystemSessionToken(userId);
  const res = NextResponse.json({ session });
  res.cookies.set(systemSessionCookieOptions(token));
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "abilityvua_system_session",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}
