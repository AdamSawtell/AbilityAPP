import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PushSubscriptionRow = {
  id: string;
  user_id: string;
  employee_id: string | null;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_label: string;
  notify_shift_changes: boolean;
  notify_credentials: boolean;
  active: boolean;
};

export type MobilePushPayload = {
  title: string;
  body: string;
  url?: string;
};

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY?.trim() &&
      process.env.VAPID_PRIVATE_KEY?.trim() &&
      process.env.VAPID_SUBJECT?.trim()
  );
}

export function getVapidPublicKey(): string | null {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim();
  return key || null;
}

function ensureWebPush(): boolean {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!.trim(),
    process.env.VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim()
  );
  return true;
}

export async function upsertPushSubscription(
  supabase: SupabaseClient,
  input: {
    userId: string;
    employeeId: string | null;
    endpoint: string;
    p256dh: string;
    auth: string;
    deviceLabel?: string;
  }
): Promise<PushSubscriptionRow> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("app_push_subscription")
    .upsert(
      {
        user_id: input.userId,
        employee_id: input.employeeId,
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
        device_label: input.deviceLabel?.trim() ?? "",
        active: true,
        updated_at: now,
      },
      { onConflict: "endpoint" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PushSubscriptionRow;
}

export async function deactivatePushSubscription(
  supabase: SupabaseClient,
  userId: string,
  endpoint: string
): Promise<void> {
  const { error } = await supabase
    .from("app_push_subscription")
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("endpoint", endpoint);
  if (error) throw new Error(error.message);
}

export async function updatePushPreferences(
  supabase: SupabaseClient,
  userId: string,
  prefs: { notifyShiftChanges?: boolean; notifyCredentials?: boolean }
): Promise<void> {
  const patch: Record<string, boolean | string> = { updated_at: new Date().toISOString() };
  if (typeof prefs.notifyShiftChanges === "boolean") patch.notify_shift_changes = prefs.notifyShiftChanges;
  if (typeof prefs.notifyCredentials === "boolean") patch.notify_credentials = prefs.notifyCredentials;
  const { error } = await supabase.from("app_push_subscription").update(patch).eq("user_id", userId).eq("active", true);
  if (error) throw new Error(error.message);
}

export async function listActiveSubscriptions(
  supabase: SupabaseClient,
  userId: string
): Promise<PushSubscriptionRow[]> {
  const { data, error } = await supabase
    .from("app_push_subscription")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true);
  if (error) throw new Error(error.message);
  return (data ?? []) as PushSubscriptionRow[];
}

async function recordPushSent(
  supabase: SupabaseClient,
  userId: string,
  pushType: string,
  dedupeKey: string
): Promise<boolean> {
  const { error } = await supabase.from("mobile_push_log").insert({
    user_id: userId,
    push_type: pushType,
    dedupe_key: dedupeKey,
  });
  if (!error) return true;
  if (error.code === "23505") return false;
  throw new Error(error.message);
}

export async function sendPushToUser(
  supabase: SupabaseClient,
  userId: string,
  payload: MobilePushPayload,
  options?: {
    preference?: "shift" | "credential";
    pushType?: string;
    dedupeKey?: string;
  }
): Promise<number> {
  if (!ensureWebPush()) return 0;

  if (options?.pushType && options?.dedupeKey) {
    const fresh = await recordPushSent(supabase, userId, options.pushType, options.dedupeKey);
    if (!fresh) return 0;
  }

  const subs = await listActiveSubscriptions(supabase, userId);
  const eligible = subs.filter((sub) => {
    if (options?.preference === "shift" && !sub.notify_shift_changes) return false;
    if (options?.preference === "credential" && !sub.notify_credentials) return false;
    return true;
  });

  let sent = 0;
  for (const sub of eligible) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload)
      );
      sent += 1;
    } catch (err) {
      const status = typeof err === "object" && err && "statusCode" in err ? Number((err as { statusCode: number }).statusCode) : 0;
      if (status === 404 || status === 410) {
        await supabase
          .from("app_push_subscription")
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq("id", sub.id);
      }
    }
  }
  return sent;
}
