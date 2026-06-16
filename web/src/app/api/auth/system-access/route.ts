import { NextResponse } from "next/server";
import type { AppUserRecord } from "@/lib/access/types";
import { hashPassword } from "@/lib/auth/password.server";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import { saveUser } from "@/lib/supabase/access-api";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
  }

  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!sessionHasWindow(session, "employee-system-access") && !sessionHasWindow(session, "admin-roles")) {
    return NextResponse.json({ error: "You do not have permission to manage system access" }, { status: 403 });
  }

  let body: { user?: AppUserRecord; password?: string };
  try {
    body = (await request.json()) as { user?: AppUserRecord; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const user = body.user;
  if (!user?.id?.trim() || !user.username?.trim()) {
    return NextResponse.json({ error: "User id and username are required" }, { status: 400 });
  }

  const plainPassword = body.password?.trim() || undefined;
  const hashedPassword = plainPassword ? hashPassword(plainPassword) : undefined;

  try {
    const supabase = await createClient();
    await saveUser(supabase, user, hashedPassword);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("system-access save failed", err);
    return NextResponse.json({ error: "Could not save system access" }, { status: 500 });
  }
}
