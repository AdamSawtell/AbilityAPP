import { NextResponse } from "next/server";
import type { AppUserRecord } from "@/lib/access/types";
import { saveUser } from "@/lib/supabase/access-api";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured" }, { status: 503 });
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

  try {
    const supabase = await createClient();
    await saveUser(supabase, user, body.password?.trim() || undefined);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("system-access save failed", err);
    return NextResponse.json({ error: "Could not save system access" }, { status: 500 });
  }
}
