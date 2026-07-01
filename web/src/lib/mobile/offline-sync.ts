"use client";

import {
  MOBILE_SYNC_MAX_RETRIES,
  type MobileOfflineActionType,
  type MobileOfflineWrite,
  type MobileOfflineWritePayload,
} from "@/lib/mobile/constants";
import {
  idbDeleteOfflineWrite,
  idbListOfflineWrites,
  idbPutOfflineWrite,
  idbUpdateOfflineWrite,
} from "@/lib/mobile/idb";

export function newSyncId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `sync-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function enqueueOfflineWrite(input: {
  shiftId: string;
  employeeId: string;
  actionType: MobileOfflineActionType;
  payload: MobileOfflineWritePayload;
}): Promise<MobileOfflineWrite> {
  const write: MobileOfflineWrite = {
    syncId: newSyncId(),
    shiftId: input.shiftId,
    employeeId: input.employeeId,
    actionType: input.actionType,
    payload: input.payload,
    createdAt: Date.now(),
    syncedAt: null,
    retryCount: 0,
  };
  await idbPutOfflineWrite(write);
  return write;
}

export async function pendingOfflineWrites(): Promise<MobileOfflineWrite[]> {
  const all = await idbListOfflineWrites();
  return all.filter((w) => !w.syncedAt).sort((a, b) => a.createdAt - b.createdAt);
}

export async function pendingOfflineCount(): Promise<number> {
  const pending = await pendingOfflineWrites();
  return pending.length;
}

export type SyncBatchResult = {
  accepted: string[];
  rejected: { syncId: string; reason: string }[];
};

export async function flushOfflineQueue(): Promise<SyncBatchResult | null> {
  const pending = await pendingOfflineWrites();
  if (!pending.length) return { accepted: [], rejected: [] };

  const res = await fetch("/api/mobile/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      writes: pending.map((w) => ({
        syncId: w.syncId,
        shiftId: w.shiftId,
        employeeId: w.employeeId,
        actionType: w.actionType,
        payload: w.payload,
        createdAt: w.createdAt,
      })),
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? "Sync failed");
  }

  const result = (await res.json()) as SyncBatchResult;

  for (const syncId of result.accepted) {
    await idbDeleteOfflineWrite(syncId);
  }

  for (const rej of result.rejected) {
    const row = pending.find((w) => w.syncId === rej.syncId);
    if (!row) continue;
    const next: MobileOfflineWrite = {
      ...row,
      retryCount: row.retryCount + 1,
      lastError: rej.reason,
    };
    if (next.retryCount >= MOBILE_SYNC_MAX_RETRIES) {
      await idbUpdateOfflineWrite(next);
    } else {
      await idbUpdateOfflineWrite(next);
    }
  }

  return result;
}
