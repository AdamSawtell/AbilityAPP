import { NextResponse } from "next/server";
import type { AppUserRecord } from "@/lib/access/types";
import { hashPassword, isPasswordHashed, verifyPassword } from "@/lib/auth/password.server";
import { SEED_LOGIN_PASSWORDS } from "@/lib/auth/passwords.server";
import { SEED_USERS } from "@/lib/access/seed";
import { isSuperUser } from "@/lib/access/superuser";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { recordFailedLogin } from "@/lib/session-audit/server";
import { clientIpFromRequest } from "@/lib/session-audit/parse-user-agent";

const USER_COLUMNS =
  "id, username, email, first_name, last_name, phone, active, employee_bp_id, notes, password";

type UserRow = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  active: boolean;
  employee_bp_id: string | null;
  notes: string;
  password: string;
};

function userFromRow(row: UserRow, roleIds: string[]): AppUserRecord {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    active: row.active,
    employeeBpId: row.employee_bp_id ?? "",
    notes: row.notes,
    roleIds,
  };
}

async function roleIdsForUser(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  if (isSuperUser(userId)) {
    const { data, error } = await supabase.from("app_role").select("id").eq("active", true);
    if (error) throw error;
    return (data ?? []).map((r) => r.id);
  }
  const { data, error } = await supabase.from("app_user_role").select("role_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role_id);
}

async function upgradePlainPassword(userId: string, plain: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) return;
  const admin = createSupabaseClient(url, key, { auth: { persistSession: false } });
  await admin.from("app_user").update({ password: hashPassword(plain) }).eq("id", userId);
}

export async function POST(request: Request) {
  let body: { username?: string; password?: string };
  try {
    body = (await request.json()) as { username?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("app_user")
        .select(USER_COLUMNS)
        .eq("username", username)
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data || !verifyPassword(password, (data as UserRow).password)) {
        await recordFailedLogin({
          userId: data ? (data as UserRow).id : undefined,
          userName: username,
          ipAddress: clientIpFromRequest(request),
          userAgent: request.headers.get("user-agent") ?? "",
          failureReason: "Invalid username or password",
        });
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }

      const row = data as UserRow;
      if (!isPasswordHashed(row.password)) {
        await upgradePlainPassword(row.id, password);
      }

      const roleIds = await roleIdsForUser(supabase, row.id);
      return NextResponse.json({ user: userFromRow(row, roleIds) });
    }

    const seedUser = SEED_USERS.find((u) => u.username === username && u.active);
    const seedPassword = SEED_LOGIN_PASSWORDS[username];
    if (!seedUser || seedPassword !== password) {
      await recordFailedLogin({
        userId: seedUser?.id,
        userName: username,
        ipAddress: clientIpFromRequest(request),
        userAgent: request.headers.get("user-agent") ?? "",
        failureReason: "Invalid username or password",
      });
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    return NextResponse.json({ user: seedUser });
  } catch (err) {
    console.error("login failed", err);
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
