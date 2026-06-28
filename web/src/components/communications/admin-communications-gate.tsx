"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { AdminMessageAckModal } from "@/components/communications/admin-message-ack-modal";
import { AdminMessageBanner } from "@/components/communications/admin-message-banner";
import type { PendingAdminMessage } from "@/lib/admin-communications/types";

export function AdminCommunicationsGate({ children }: { children: React.ReactNode }) {
  const { session, hydrated } = useAuth();
  const pathname = usePathname();
  const [blocking, setBlocking] = useState<PendingAdminMessage | null>(null);
  const [banners, setBanners] = useState<PendingAdminMessage[]>([]);
  const [queue, setQueue] = useState<PendingAdminMessage[]>([]);

  const skip =
    !hydrated ||
    !session ||
    pathname === "/login" ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/agency-portal") ||
    pathname.startsWith("/system/login");

  const load = useCallback(async () => {
    if (skip) {
      setBlocking(null);
      setBanners([]);
      setQueue([]);
      return;
    }
    try {
      const res = await fetch("/api/communications/pending");
      if (!res.ok) return;
      const data = (await res.json()) as {
        blocking?: PendingAdminMessage | null;
        banners?: PendingAdminMessage[];
        pending?: PendingAdminMessage[];
      };
      const modalQueue = (data.pending ?? []).filter((p) => p.displayMethod === "modal" && p.requiresAcknowledgment);
      setQueue(modalQueue);
      setBlocking(data.blocking ?? modalQueue[0] ?? null);
      setBanners(data.banners ?? []);
    } catch {
      // Graceful degradation — never block the app on comms fetch failure.
    }
  }, [skip]);

  useEffect(() => {
    void load();
  }, [load, session?.userId, session?.activeRoleId, pathname]);

  function onAcknowledged() {
    const remaining = queue.filter((m) => m.id !== blocking?.id);
    setQueue(remaining);
    setBlocking(remaining[0] ?? null);
    void load();
  }

  function dismissBanner(id: string) {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <>
      {!skip && banners[0] ? <AdminMessageBanner message={banners[0]} onDismiss={() => dismissBanner(banners[0].id)} /> : null}
      {children}
      {!skip && blocking ? <AdminMessageAckModal message={blocking} onAcknowledged={onAcknowledged} /> : null}
    </>
  );
}
