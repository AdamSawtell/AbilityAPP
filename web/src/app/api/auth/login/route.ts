import { NextResponse } from "next/server";
import { SEED_LOGIN_PASSWORDS } from "@/lib/auth/passwords.server";
import { SEED_USERS } from "@/lib/access/seed";
import type { AppUserRecord } from "@/lib/access/types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const USER_COLUMNS =
  "id, username, email, first_name, last_name, phone, active, employee_bp_id, notes";

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
  const { data, error } = await supabase.from("app_user_role").select("role_id").eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.role_id);
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
        .eq("password", password)
        .eq("active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
      }

      const roleIds = await roleIdsForUser(supabase, data.id);
      return NextResponse.json({ user: userFromRow(data as UserRow, roleIds) });
    }

    const seedUser = SEED_USERS.find((u) => u.username === username && u.active);
    const seedPassword = SEED_LOGIN_PASSWORDS[username];
    if (!seedUser || seedPassword !== password) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    return NextResponse.json({ user: seedUser });
  } catch (err) {
    console.error("login failed", err);
    return NextResponse.json({ error: "Sign-in failed" }, { status: 500 });
  }
}
