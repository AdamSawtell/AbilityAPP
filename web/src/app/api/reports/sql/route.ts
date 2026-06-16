import { NextResponse } from "next/server";
import { SEED_ROLES, SEED_USERS } from "@/lib/access/seed";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { rowsJsonToReportResult } from "@/lib/reports/sql-results";
import { validateReadonlySql } from "@/lib/reports/sql-validate";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error("Supabase is not configured");
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

async function assertReportsAdvanceAccess(userId: string, roleId: string) {
  if (!isSupabaseConfigured()) {
    const seedUser = SEED_USERS.find((u) => u.id === userId);
    const seedRole = SEED_ROLES.find((r) => r.id === roleId);
    if (!seedUser?.roleIds.includes(roleId) || !seedRole?.windowKeys.includes("reports-advance")) {
      throw new Error("FORBIDDEN");
    }
    return;
  }

  const supabase = createServiceClient();
  const [{ data: userRole, error: urErr }, { data: windows, error: wErr }] = await Promise.all([
    supabase.from("app_user_role").select("user_id").eq("user_id", userId).eq("role_id", roleId).maybeSingle(),
    supabase.from("app_role_window").select("window_key").eq("role_id", roleId),
  ]);
  if (urErr) throw urErr;
  if (wErr) throw wErr;
  if (!userRole) throw new Error("FORBIDDEN");

  const keys = new Set((windows ?? []).map((w) => w.window_key));
  if (!keys.has("reports") || !keys.has("reports-advance")) {
    throw new Error("FORBIDDEN");
  }
}

export async function POST(request: Request) {
  let body: { sql?: string; userId?: string; roleId?: string };
  try {
    body = (await request.json()) as { sql?: string; userId?: string; roleId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const sql = body.sql ?? "";
  const userId = body.userId?.trim() ?? "";
  const roleId = body.roleId?.trim() ?? "";
  if (!userId || !roleId) {
    return NextResponse.json({ error: "Session required" }, { status: 401 });
  }

  const validation = validateReadonlySql(sql);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    await assertReportsAdvanceAccess(userId, roleId);
  } catch (err) {
    if (err instanceof Error && err.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Your role does not have access to Reports Advance" }, { status: 403 });
    }
    console.error("reports advance auth failed", err);
    return NextResponse.json({ error: "Access check failed" }, { status: 500 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Reports Advance requires a linked Supabase database." },
      { status: 503 }
    );
  }

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc("run_readonly_sql", { query_text: validation.query });
    if (error) throw error;

    const rawRows = Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
    const result = rowsJsonToReportResult(rawRows);
    return NextResponse.json({
      rowCount: result.rows.length,
      columns: result.columns,
      rows: result.rows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Query failed";
    console.error("reports advance sql failed", err);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
