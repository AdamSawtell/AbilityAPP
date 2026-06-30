"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SessionExpiryModal } from "@/components/session-expiry-modal";
import { useAuth } from "@/lib/auth-store";
import { normalizeIdleTimeoutMinutes } from "@/lib/organization";
import { useOrganization } from "@/lib/organization-store";
import { useIdleTimer } from "@/lib/use-idle-timer";

export function SessionIdleGate({ children }: { children: React.ReactNode }) {
  const { session, hydrated, logout } = useAuth();
  const { organization } = useOrganization();
  const pathname = usePathname();
  const router = useRouter();
  const expiring = useRef(false);
  const lastActivityTouch = useRef(0);

  const skip =
    !hydrated ||
    !session ||
    pathname === "/login" ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/agency-portal") ||
    pathname.startsWith("/system");

  const timeoutMinutes = normalizeIdleTimeoutMinutes(
    Math.min(
      session?.idleTimeoutMinutes ?? organization.idleTimeoutMinutes,
      organization.idleTimeoutMinutes
    )
  );

  useEffect(() => {
    if (session?.sessionId) expiring.current = false;
  }, [session?.sessionId]);

  const expireSession = useCallback(async () => {
    if (expiring.current) return;
    expiring.current = true;
    await logout({ reason: "inactivity" });
    router.replace("/login?expired=inactivity");
  }, [logout, router]);

  const touchServerSession = useCallback(async () => {
    if (skip) return;
    const now = Date.now();
    if (now - lastActivityTouch.current < 60_000) return;
    lastActivityTouch.current = now;
    try {
      const res = await fetch("/api/auth/session/health", { credentials: "include" });
      if (res.status === 401) {
        await logout({ reason: "inactivity" });
        router.replace("/login?expired=inactivity");
      }
    } catch {
      // Local UI activity still resets the warning; the next successful request will re-check the server session.
    }
  }, [logout, router, skip]);

  const { warningOpen, remainingSeconds, reset } = useIdleTimer({
    enabled: !skip,
    timeoutMinutes,
    onActivity: touchServerSession,
    onExpired: expireSession,
  });

  async function staySignedIn() {
    try {
      const res = await fetch("/api/auth/session/health", { credentials: "include" });
      if (res.status === 401) {
        await logout({ reason: "inactivity" });
        router.replace("/login?expired=inactivity");
        return;
      }
    } catch {
      // If the network is temporarily unavailable, keep the form state and let the next API call re-check.
    }
    reset();
  }

  useEffect(() => {
    if (skip) return;

    async function checkSessionHealth() {
      try {
        const res = await fetch("/api/auth/session/health", { credentials: "include" });
        if (res.status === 401) {
          await logout({ reason: "inactivity" });
          router.replace("/login?expired=inactivity");
        }
      } catch {
        // Stay on the current page when offline; normal API calls will re-check the session.
      }
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") void checkSessionHealth();
    };
    window.addEventListener("focus", checkSessionHealth);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", checkSessionHealth);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [logout, router, skip]);

  return (
    <>
      {children}
      {warningOpen ? (
        <SessionExpiryModal
          timeoutMinutes={timeoutMinutes}
          remainingSeconds={remainingSeconds}
          onStaySignedIn={() => void staySignedIn()}
        />
      ) : null}
    </>
  );
}
