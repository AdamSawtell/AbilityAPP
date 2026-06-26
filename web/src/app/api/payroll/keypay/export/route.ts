import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getAuthSessionFromRequest, sessionCanWriteWindow } from "@/lib/auth/session.server";
import {
  exportPayloadToKeypay,
  payrollRowsToKeypayPayload,
} from "@/lib/integrations/keypay-payroll";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { fetchPayrollExportData, saveTimesheets } from "@/lib/supabase/data-api";
import { preparePayrollExport } from "@/lib/timesheet-payroll-export";

function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) {
    throw new Error("Supabase is not configured");
  }
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

type ExportBody = {
  timesheetIds?: string[];
};

export async function POST(request: Request) {
  const session = await getAuthSessionFromRequest();
  if (!session || !sessionCanWriteWindow(session, "timesheets")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Keypay API export requires a linked Supabase database. Use CSV export for local-only data." },
      { status: 503 }
    );
  }

  let body: ExportBody;
  try {
    body = (await request.json()) as ExportBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const timesheetIds = [...new Set((body.timesheetIds ?? []).map((id) => id.trim()).filter(Boolean))];
  if (!timesheetIds.length) {
    return NextResponse.json({ error: "Select at least one timesheet to export." }, { status: 400 });
  }

  try {
    const supabase = createServiceClient();
    const data = await fetchPayrollExportData(supabase, timesheetIds);
    if (data.timesheets.length !== timesheetIds.length) {
      return NextResponse.json({ error: "One or more timesheets were not found." }, { status: 400 });
    }

    const prepared = preparePayrollExport(
      data.timesheets,
      data.employees,
      data.clients,
      data.locations,
      session.displayName,
      data.rosterShifts
    );
    if (!prepared.ok) {
      return NextResponse.json({ error: prepared.message }, { status: 400 });
    }

    const payload = payrollRowsToKeypayPayload(prepared.rows, prepared.batchRef);
    const keypay = await exportPayloadToKeypay(payload);
    if (!keypay.ok) {
      return NextResponse.json({ error: keypay.message }, { status: 400 });
    }

    await saveTimesheets(supabase, prepared.updatedTimesheets);

    return NextResponse.json({
      batchRef: keypay.batchRef,
      payRunRef: keypay.payRunRef,
      lineCount: keypay.lineCount,
      dryRun: keypay.dryRun,
      exportedBy: session.displayName,
      updatedTimesheets: prepared.updatedTimesheets,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Keypay export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
