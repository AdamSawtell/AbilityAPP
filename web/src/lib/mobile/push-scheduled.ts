import type { SupabaseClient } from "@supabase/supabase-js";
import { sendPushToUser } from "@/lib/mobile/push-server";

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysUntil(expiryDate: string): number {
  const end = new Date(`${expiryDate.slice(0, 10)}T12:00:00`);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
}

type ShiftReminder = {
  shiftId: string;
  employeeId: string;
  startTime: string;
  locationLabel: string;
};

/** Credential expiry reminders (within 30 days) and shift-start reminders (next 2 hours). */
export async function runScheduledMobilePushNotifications(supabase: SupabaseClient): Promise<number> {
  let sent = 0;

  const { data: users } = await supabase.from("app_user").select("id, employee_bp_id").not("employee_bp_id", "is", null);
  const userByEmployee = new Map<string, string>();
  for (const user of users ?? []) {
    const empId = (user.employee_bp_id as string | null)?.trim();
    if (empId) userByEmployee.set(empId, user.id as string);
  }

  const { data: credentials } = await supabase
    .from("employee_credential")
    .select("id, employee_id, credential_type, expiry_date");
  for (const cred of credentials ?? []) {
    const employeeId = (cred.employee_id as string | null)?.trim();
    const expiryDate = (cred.expiry_date as string | null)?.trim();
    if (!employeeId || !expiryDate) continue;
    const userId = userByEmployee.get(employeeId);
    if (!userId) continue;
    const days = daysUntil(expiryDate);
    if (days < 0 || days > 30) continue;
    const dedupeKey = `${employeeId}:${cred.id}:${isoDate(new Date())}`;
    const credType = (cred.credential_type as string | null)?.trim() || "Credential";
    const label = days === 0 ? "expires today" : days === 1 ? "expires tomorrow" : `expires in ${days} days`;
    const count = await sendPushToUser(
      supabase,
      userId,
      {
        title: "Credential reminder",
        body: `${credType} ${label}. Open AbilityVua to review.`,
        url: "/m/more",
      },
      { preference: "credential", pushType: "credential_expiry", dedupeKey }
    );
    sent += count;
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const today = isoDate(now);
  const reminders = new Map<string, ShiftReminder>();

  const { data: primaryShifts } = await supabase
    .from("roster_shift")
    .select("id, shift_date, start_time, employee_id, status")
    .eq("shift_date", today)
    .in("status", ["Published", "In progress"]);

  const { data: workerLines } = await supabase
    .from("roster_shift_worker_line")
    .select("employee_id, roster_shift_id, roster_shift:roster_shift_id (id, shift_date, start_time, location_id, status)")
    .not("employee_id", "is", null);

  for (const line of workerLines ?? []) {
    const shift = line.roster_shift as {
      id?: string;
      shift_date?: string;
      start_time?: string;
      location_id?: string | null;
      status?: string;
    } | null;
    if (!shift?.id || shift.shift_date !== today) continue;
    if (!["Published", "In progress"].includes(shift.status ?? "")) continue;
    const employeeId = (line.employee_id as string | null)?.trim();
    if (!employeeId) continue;
    reminders.set(`${shift.id}:${employeeId}`, {
      shiftId: shift.id,
      employeeId,
      startTime: String(shift.start_time ?? "").slice(0, 5),
      locationLabel: "",
    });
  }

  for (const shift of primaryShifts ?? []) {
    const employeeId = (shift.employee_id as string | null)?.trim();
    if (!employeeId) continue;
    reminders.set(`${shift.id}:${employeeId}`, {
      shiftId: shift.id as string,
      employeeId,
      startTime: String(shift.start_time ?? "").slice(0, 5),
      locationLabel: "",
    });
  }

  for (const reminder of reminders.values()) {
    const userId = userByEmployee.get(reminder.employeeId);
    if (!userId || !reminder.startTime) continue;
    const start = new Date(`${today}T${reminder.startTime.length === 5 ? `${reminder.startTime}:00` : reminder.startTime}`);
    if (start < now || start > horizon) continue;
    const dedupeKey = `${reminder.shiftId}:${reminder.employeeId}:${today}`;
    const count = await sendPushToUser(
      supabase,
      userId,
      {
        title: "Shift starting soon",
        body: `Your shift starts at ${reminder.startTime}. Open Today to check in.`,
        url: "/m/today",
      },
      { preference: "shift", pushType: "shift_reminder", dedupeKey }
    );
    sent += count;
  }

  return sent;
}
