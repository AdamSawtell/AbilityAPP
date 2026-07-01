"use client";

import { useCallback, useEffect, useState } from "react";
import { flushOfflineQueue, pendingOfflineCount } from "@/lib/mobile/offline-sync";
import { useMobileOnline } from "@/lib/mobile/use-mobile-online";

export function useMobileSyncState() {
  const online = useMobileOnline();
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const refreshPending = useCallback(async () => {
    try {
      setPending(await pendingOfflineCount());
    } catch {
      setPending(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (!online) {
      setSyncError("You are offline — sync will run when connected.");
      return;
    }
    setSyncing(true);
    setSyncError("");
    try {
      await flushOfflineQueue();
      setLastSyncedAt(Date.now());
      await refreshPending();
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Sync failed");
      await refreshPending();
    } finally {
      setSyncing(false);
    }
  }, [online, refreshPending]);

  useEffect(() => {
    void refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    if (!online) return;
    void syncNow();
  }, [online]); // eslint-disable-line react-hooks/exhaustive-deps -- sync on reconnect only

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && online) void syncNow();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [online, syncNow]);

  return { online, pending, syncing, syncError, lastSyncedAt, syncNow, refreshPending };
}
