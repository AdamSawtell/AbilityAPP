import type { MyWorkplaceContext } from "@/lib/my-workplace/server";
import {
  performMyShiftCheckIn,
  performMyShiftCheckOut,
} from "@/lib/my-workplace/server";
import { normalizeGeoInput } from "@/lib/geolocation";
import { ORGANIZATION_ID } from "@/lib/organization";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type MobileSyncWriteInput = {
  syncId: string;
  shiftId: string;
  employeeId: string;
  actionType: "checkin" | "checkout";
  payload: {
    timestamp?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    notes?: string;
    geoApproximate?: boolean;
  };
  createdAt?: number;
};

export type MobileSyncBatchResult = {
  accepted: string[];
  rejected: { syncId: string; reason: string }[];
};

function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url?.trim() || !key?.trim()) throw new Error("Supabase not configured");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function syncRowExists(supabase: SupabaseClient, syncId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("mobile_offline_sync")
    .select("sync_id")
    .eq("sync_id", syncId)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

async function recordSyncAudit(
  supabase: SupabaseClient,
  write: MobileSyncWriteInput,
  status: "accepted" | "rejected" | "duplicate",
  rejectionReason = ""
): Promise<void> {
  const { error } = await supabase.from("mobile_offline_sync").insert({
    sync_id: write.syncId,
    organization_id: ORGANIZATION_ID,
    shift_id: write.shiftId,
    employee_id: write.employeeId,
    action_type: write.actionType,
    payload: write.payload,
    status,
    rejection_reason: rejectionReason,
    client_created_at: write.payload.timestamp ?? null,
    retry_count: 0,
  });
  if (error && !error.message.includes("duplicate")) throw error;
}

export async function processMobileSyncBatch(
  ctx: MyWorkplaceContext,
  writes: MobileSyncWriteInput[]
): Promise<MobileSyncBatchResult> {
  const accepted: string[] = [];
  const rejected: MobileSyncBatchResult["rejected"] = [];
  const supabase = isSupabaseConfigured() ? serviceClient() : null;

  for (const write of writes) {
    const syncId = write.syncId?.trim();
    if (!syncId) {
      rejected.push({ syncId: write.syncId ?? "", reason: "Missing sync id." });
      continue;
    }
    if (write.employeeId.trim() !== ctx.employeeId) {
      rejected.push({ syncId, reason: "Employee mismatch." });
      if (supabase) await recordSyncAudit(supabase, write, "rejected", "Employee mismatch.");
      continue;
    }

    try {
      if (supabase && (await syncRowExists(supabase, syncId))) {
        accepted.push(syncId);
        await recordSyncAudit(supabase, { ...write, syncId }, "duplicate");
        continue;
      }

      const geo = normalizeGeoInput(write.payload.latitude, write.payload.longitude);
      const at = write.payload.timestamp ? new Date(write.payload.timestamp) : undefined;
      if (at && Number.isNaN(at.getTime())) {
        throw new Error("Invalid timestamp in offline payload.");
      }

      if (write.actionType === "checkin") {
        await performMyShiftCheckIn(ctx, write.shiftId, geo, at);
      } else {
        await performMyShiftCheckOut(ctx, write.shiftId, write.payload.notes ?? "", geo, at);
      }

      if (supabase) await recordSyncAudit(supabase, { ...write, syncId }, "accepted");
      accepted.push(syncId);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "Sync rejected";
      rejected.push({ syncId, reason });
      if (supabase) await recordSyncAudit(supabase, { ...write, syncId }, "rejected", reason);
    }
  }

  return { accepted, rejected };
}

export type MobileSyncAuditRow = {
  id: string;
  syncId: string;
  shiftId: string;
  employeeId: string;
  actionType: string;
  status: string;
  retryCount: number;
  rejectionReason: string;
  clientCreatedAt: string;
  syncedAt: string;
};

export async function listMobileSyncAudit(limit = 200): Promise<MobileSyncAuditRow[]> {
  const supabase = isSupabaseConfigured() ? serviceClient() : null;
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("mobile_offline_sync")
    .select("*")
    .eq("organization_id", ORGANIZATION_ID)
    .order("synced_at", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id as string,
    syncId: row.sync_id as string,
    shiftId: row.shift_id as string,
    employeeId: row.employee_id as string,
    actionType: row.action_type as string,
    status: row.status as string,
    retryCount: Number(row.retry_count ?? 0),
    rejectionReason: (row.rejection_reason as string) ?? "",
    clientCreatedAt: (row.client_created_at as string) ?? "",
    syncedAt: (row.synced_at as string) ?? "",
  }));
}
