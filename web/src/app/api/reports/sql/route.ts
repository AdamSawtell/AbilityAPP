import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest, sessionHasWindow } from "@/lib/auth/session.server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { rowsJsonToReportResult } from "@/lib/reports/sql-results";
import { validateReadonlySql } from "@/lib/reports/sql-validate";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error("Supabase is not configured");
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  if (!sessionHasWindow(session, "reports") || !sessionHasWindow(session, "reports-advance")) {
    return NextResponse.json({ error: "Your role does not have access to Reports Advance" }, { status: 403 });
  }

  let body: { sql?: string };
  try {
    body = (await request.json()) as { sql?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const validation = validateReadonlySql(body.sql ?? "");
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
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
