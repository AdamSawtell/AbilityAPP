import { NextResponse } from "next/server";
import { getAuthSessionFromRequest } from "@/lib/auth/session.server";
import { priorHandoverNotes } from "@/lib/mobile/handover";
import { requireMyWorkplace } from "@/lib/my-workplace/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";
import {
  rosterShiftFromRow,
  type RosterShiftRow,
} from "@/lib/supabase/mappers";
import {
  rosterShiftClientLineFromRow,
  rosterShiftWorkerLineFromRow,
  type RosterShiftClientLineRow,
  type RosterShiftWorkerLineRow,
} from "@/lib/supabase/roster-session-mappers";
import { normalizeRosterShift } from "@/lib/roster-shift";
import { addDaysIso } from "@/lib/roster-shift";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSessionFromRequest();
  const ctx = await requireMyWorkplace(session, "my-shifts");
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: shiftId } = await context.params;
  if (!shiftId?.trim()) return NextResponse.json({ error: "Shift id required" }, { status: 400 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ notes: "" });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: row, error } = await supabase.from("roster_shift").select("*").eq("id", shiftId).maybeSingle();
  if (error || !row) return NextResponse.json({ error: "Shift not found" }, { status: 404 });

  const shift = normalizeRosterShift(rosterShiftFromRow(row as RosterShiftRow));
  const from = addDaysIso(shift.shiftDate, -14);

  const { data: relatedRows, error: listError } = await supabase
    .from("roster_shift")
    .select("*")
    .gte("shift_date", from)
    .lte("shift_date", shift.shiftDate);
  if (listError) return NextResponse.json({ error: listError.message }, { status: 500 });

  const ids = (relatedRows ?? []).map((r) => r.id as string);
  const [clientLinesRes, workerLinesRes] = await Promise.all([
    supabase.from("roster_shift_client_line").select("*").in("roster_shift_id", ids),
    supabase.from("roster_shift_worker_line").select("*").in("roster_shift_id", ids),
  ]);

  const clientLinesByShift = new Map<string, ReturnType<typeof rosterShiftClientLineFromRow>[]>();
  for (const line of (clientLinesRes.data ?? []) as RosterShiftClientLineRow[]) {
    const list = clientLinesByShift.get(line.roster_shift_id) ?? [];
    list.push(rosterShiftClientLineFromRow(line));
    clientLinesByShift.set(line.roster_shift_id, list);
  }
  const workerLinesByShift = new Map<string, ReturnType<typeof rosterShiftWorkerLineFromRow>[]>();
  for (const line of (workerLinesRes.data ?? []) as RosterShiftWorkerLineRow[]) {
    const list = workerLinesByShift.get(line.roster_shift_id) ?? [];
    list.push(rosterShiftWorkerLineFromRow(line));
    workerLinesByShift.set(line.roster_shift_id, list);
  }

  const allShifts = (relatedRows ?? []).map((r) =>
    normalizeRosterShift({
      ...rosterShiftFromRow(r as RosterShiftRow),
      clientLines: clientLinesByShift.get(r.id as string) ?? [],
      workerLines: workerLinesByShift.get(r.id as string) ?? [],
    })
  );

  const notes = priorHandoverNotes(shift, allShifts, ctx.employeeId);
  return NextResponse.json({ notes });
}
