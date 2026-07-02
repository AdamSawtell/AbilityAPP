import type { SupabaseClient } from "@supabase/supabase-js";
import { canAccessWindow } from "@/lib/access/catalog";
import type { AuthSession } from "@/lib/access/types";
import { isVacantShift } from "@/lib/roster-gap-analysis";
import { normalizeRosterShift, type RosterShiftRecord } from "@/lib/roster-shift";
import { sendPushToUser } from "@/lib/mobile/push-server";
import {
  rosterShiftChangeSummary,
  rosterShiftChangedNotifiable,
  type PushEmitKind,
} from "@/lib/mobile/push-events.shared";
import { ROSTERING_COMMUNICATION_TASK_TYPE_ID } from "@/lib/task-type";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type { PushEmitKind };

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createSupabaseClient(url, key, { auth: { persistSession: false } });
}

function formatShiftTime(time: string): string {
  return String(time ?? "").trim().slice(0, 5);
}

async function userIdForEmployee(supabase: SupabaseClient, employeeId: string): Promise<string | null> {
  const { data } = await supabase
    .from("app_user")
    .select("id")
    .eq("employee_bp_id", employeeId)
    .eq("active", true)
    .maybeSingle();
  return (data?.id as string | null) ?? null;
}

async function userIdsAtLocation(supabase: SupabaseClient, locationId: string): Promise<string[]> {
  if (!locationId.trim()) return [];
  const { data: links } = await supabase.from("employee_location").select("employee_id").eq("location_id", locationId);
  const employeeIds = [...new Set((links ?? []).map((row) => String(row.employee_id ?? "").trim()).filter(Boolean))];
  if (!employeeIds.length) return [];

  const { data: users } = await supabase
    .from("app_user")
    .select("id")
    .eq("active", true)
    .in("employee_bp_id", employeeIds);
  return [...new Set((users ?? []).map((row) => String(row.id)).filter(Boolean))];
}

export async function emitCriticalShiftAvailablePush(
  supabase: SupabaseClient,
  shift: RosterShiftRecord
): Promise<number> {
  const normalized = normalizeRosterShift(shift);
  if (!normalized.criticalFill || !isVacantShift(normalized) || normalized.status !== "Published") return 0;

  const locationName =
    (
      await supabase.from("location").select("name").eq("id", normalized.locationId).maybeSingle()
    ).data?.name?.trim() || "your site";

  const userIds = await userIdsAtLocation(supabase, normalized.locationId ?? "");
  let sent = 0;
  for (const userId of userIds) {
    const count = await sendPushToUser(
      supabase,
      userId,
      {
        title: "Critical shift available",
        body: `${formatShiftTime(normalized.startTime)} on ${normalized.shiftDate} at ${locationName}. Open Open shifts to respond.`,
        url: "/m/open-shifts",
      },
      {
        preference: "critical",
        pushType: "critical_shift",
        dedupeKey: `${normalized.id}:${userId}`,
      }
    );
    sent += count;
  }
  return sent;
}

export async function emitShiftChangedPush(
  supabase: SupabaseClient,
  before: RosterShiftRecord,
  after: RosterShiftRecord
): Promise<number> {
  if (!rosterShiftChangedNotifiable(before, after)) return 0;
  const summary = rosterShiftChangeSummary(before, after);
  const afterNormalized = normalizeRosterShift(after);
  const employeeIds = [
    ...new Set([
      ...(afterNormalized.workerLines ?? [])
        .map((line) => line.employeeId?.trim())
        .filter(Boolean) as string[],
      ...(afterNormalized.employeeId?.trim() ? [afterNormalized.employeeId.trim()] : []),
    ]),
  ];

  let sent = 0;
  for (const employeeId of employeeIds) {
    const userId = await userIdForEmployee(supabase, employeeId);
    if (!userId) continue;
    const count = await sendPushToUser(
      supabase,
      userId,
      {
        title: "Shift updated",
        body: summary,
        url: "/m/today",
      },
      {
        preference: "shift",
        pushType: "shift_changed",
        dedupeKey: `${afterNormalized.id}:${employeeId}:${afterNormalized.shiftDate}:${afterNormalized.startTime}:${afterNormalized.endTime}:${afterNormalized.locationId}:${afterNormalized.status}`,
      }
    );
    sent += count;
  }
  return sent;
}

export async function emitShiftRequestStatusPush(
  supabase: SupabaseClient,
  input: {
    employeeId: string;
    status: "approved" | "rejected";
    dedupeKey: string;
  }
): Promise<number> {
  const userId = await userIdForEmployee(supabase, input.employeeId);
  if (!userId) return 0;
  const body =
    input.status === "approved"
      ? "Your open shift application was approved. Open Schedule to view details."
      : "Your open shift application was updated. Open Open shifts for details.";
  return sendPushToUser(
    supabase,
    userId,
    {
      title: input.status === "approved" ? "Shift application approved" : "Shift application updated",
      body,
      url: input.status === "approved" ? "/m/schedule" : "/m/open-shifts",
    },
    {
      preference: "shift_request",
      pushType: "shift_request_status",
      dedupeKey: input.dedupeKey,
    }
  );
}

export async function emitRosteringReplyPush(
  supabase: SupabaseClient,
  input: {
    taskId: string;
    employeeUserId: string;
    replierName: string;
    notePreview: string;
    dedupeKey: string;
  }
): Promise<number> {
  const preview = input.notePreview.trim().slice(0, 120) || "Rostering replied to your message.";
  return sendPushToUser(
    supabase,
    input.employeeUserId,
    {
      title: "Rostering replied",
      body: `${input.replierName}: ${preview}`,
      url: "/m/messages",
    },
    {
      preference: "rostering",
      pushType: "rostering_reply",
      dedupeKey: input.dedupeKey,
    }
  );
}

export function canEmitRosterPush(session: AuthSession | null): boolean {
  if (!session) return false;
  return (
    canAccessWindow(session.windowKeys, "rostering") ||
    canAccessWindow(session.windowKeys, "workforce-planning")
  );
}

export async function handlePushEmit(
  session: AuthSession,
  body: {
    kind: PushEmitKind;
    before?: RosterShiftRecord;
    after?: RosterShiftRecord;
    taskId?: string;
    notePreview?: string;
    employeeUserId?: string;
    dedupeKey?: string;
    requestId?: string;
    employeeId?: string;
    status?: "approved" | "rejected";
  }
): Promise<{ sent: number }> {
  const supabase = serviceClient();

  if (body.kind === "shift_request_status") {
    if (!canEmitRosterPush(session)) throw new Error("Not allowed to send shift request alerts");
    if (!body.requestId || !body.employeeId || !body.status) {
      throw new Error("Request, employee, and status required");
    }
    if (body.status !== "approved" && body.status !== "rejected") {
      throw new Error("Invalid shift request status");
    }
    return {
      sent: await emitShiftRequestStatusPush(supabase, {
        employeeId: body.employeeId,
        status: body.status,
        dedupeKey: body.dedupeKey ?? `${body.requestId}:${body.status}`,
      }),
    };
  }

  if (body.kind === "critical_shift") {
    if (!canEmitRosterPush(session)) throw new Error("Not allowed to send critical shift alerts");
    if (!body.after) throw new Error("Shift payload required");
    return { sent: await emitCriticalShiftAvailablePush(supabase, body.after) };
  }

  if (body.kind === "shift_changed") {
    if (!canEmitRosterPush(session)) throw new Error("Not allowed to send shift change alerts");
    if (!body.before || !body.after) throw new Error("Shift before/after required");
    return { sent: await emitShiftChangedPush(supabase, body.before, body.after) };
  }

  if (body.kind === "rostering_reply") {
    if (!body.taskId || !body.employeeUserId) throw new Error("Task and employee user required");
    const { data: task } = await supabase
      .from("app_task")
      .select("id, task_type_id, created_by_user_id")
      .eq("id", body.taskId)
      .maybeSingle();
    if (!task || task.task_type_id !== ROSTERING_COMMUNICATION_TASK_TYPE_ID) {
      throw new Error("Not a rostering communication task");
    }
    if (!canEmitRosterPush(session)) throw new Error("Not allowed to send rostering reply alerts");
    if (task.created_by_user_id === session.userId) {
      return { sent: 0 };
    }
    const replierName = session.displayName?.trim() || "Rostering";
    return {
      sent: await emitRosteringReplyPush(supabase, {
        taskId: body.taskId,
        employeeUserId: body.employeeUserId,
        replierName,
        notePreview: body.notePreview ?? "",
        dedupeKey: body.dedupeKey ?? `${body.taskId}:${body.employeeUserId}:${Date.now()}`,
      }),
    };
  }

  throw new Error("Unknown push event");
}
