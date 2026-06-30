"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalizeIdleTimeoutMinutes } from "@/lib/organization";

export const SESSION_WARNING_SECONDS = 120;

type IdleTimerOptions = {
  timeoutMinutes: number;
  enabled: boolean;
  warningSeconds?: number;
  onActivity?: () => void | Promise<void>;
  onExpired: () => void | Promise<void>;
};

export function useIdleTimer({
  timeoutMinutes,
  enabled,
  warningSeconds = SESSION_WARNING_SECONDS,
  onActivity,
  onExpired,
}: IdleTimerOptions) {
  const [warningOpen, setWarningOpen] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(warningSeconds);
  const idleTimer = useRef<number | null>(null);
  const expiryTimer = useRef<number | null>(null);
  const countdownTimer = useRef<number | null>(null);
  const activityChannel = useRef<BroadcastChannel | null>(null);
  const onExpiredRef = useRef(onExpired);
  const warningOpenRef = useRef(false);

  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  const clearTimers = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    if (expiryTimer.current) window.clearTimeout(expiryTimer.current);
    if (countdownTimer.current) window.clearInterval(countdownTimer.current);
    idleTimer.current = null;
    expiryTimer.current = null;
    countdownTimer.current = null;
  }, []);

  const startWarning = useCallback(() => {
    setWarningOpen(true);
    warningOpenRef.current = true;
    setRemainingSeconds(warningSeconds);
    countdownTimer.current = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    expiryTimer.current = window.setTimeout(() => {
      void onExpiredRef.current();
    }, warningSeconds * 1000);
  }, [warningSeconds]);

  const reset = useCallback(() => {
    clearTimers();
    setWarningOpen(false);
    warningOpenRef.current = false;
    setRemainingSeconds(warningSeconds);
    if (!enabled) return;
    idleTimer.current = window.setTimeout(
      startWarning,
      normalizeIdleTimeoutMinutes(timeoutMinutes) * 60 * 1000
    );
  }, [clearTimers, enabled, startWarning, timeoutMinutes, warningSeconds]);

  useEffect(() => {
    if (!enabled) {
      clearTimers();
      setWarningOpen(false);
      warningOpenRef.current = false;
      return;
    }

    const onLocalActivity = () => {
      if (warningOpenRef.current) return;
      void onActivity?.();
      reset();
      activityChannel.current?.postMessage({ type: "activity", at: Date.now() });
    };

    reset();
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("abilityvua-session-activity");
      channel.onmessage = (event) => {
        if ((event.data as { type?: string } | null)?.type === "activity") reset();
      };
      activityChannel.current = channel;
    }

    const events: (keyof WindowEventMap)[] = ["mousemove", "click", "keydown", "touchstart"];
    for (const eventName of events) {
      window.addEventListener(eventName, onLocalActivity, { passive: true });
    }
    return () => {
      for (const eventName of events) {
        window.removeEventListener(eventName, onLocalActivity);
      }
      activityChannel.current?.close();
      activityChannel.current = null;
      clearTimers();
    };
  }, [clearTimers, enabled, onActivity, reset]);

  return {
    warningOpen,
    remainingSeconds,
    reset,
  };
}
