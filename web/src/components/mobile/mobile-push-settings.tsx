"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchPushPreferences,
  subscribeToPushNotifications,
  unsubscribeFromPush,
  updatePushPreferences,
  type PushPreferences,
} from "@/lib/mobile/push-client";
import { pushSupportHint } from "@/lib/mobile/push-support";

export function MobilePushSettings() {
  const [prefs, setPrefs] = useState<PushPreferences | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const supportHint = pushSupportHint();

  useEffect(() => {
    void fetchPushPreferences().then(setPrefs);
  }, []);

  async function handleEnable() {
    setBusy(true);
    setError("");
    setMessage("");
    const result = await subscribeToPushNotifications();
    if (!result.ok) {
      setError(result.error ?? "Could not enable notifications.");
    } else {
      setMessage("Notifications enabled on this device.");
      setPrefs(await fetchPushPreferences());
    }
    setBusy(false);
  }

  async function handleDisable() {
    setBusy(true);
    setError("");
    setMessage("");
    await unsubscribeFromPush();
    setMessage("Notifications turned off on this device.");
    setPrefs(await fetchPushPreferences());
    setBusy(false);
  }

  async function toggleCritical(enabled: boolean) {
    const next = await updatePushPreferences({ notifyCriticalShifts: enabled });
    if (next) setPrefs(next);
  }

  async function toggleRostering(enabled: boolean) {
    const next = await updatePushPreferences({ notifyRosteringReplies: enabled });
    if (next) setPrefs(next);
  }

  async function toggleShiftRequests(enabled: boolean) {
    const next = await updatePushPreferences({ notifyShiftRequests: enabled });
    if (next) setPrefs(next);
  }

  async function toggleShift(enabled: boolean) {
    const next = await updatePushPreferences({ notifyShiftChanges: enabled });
    if (next) setPrefs(next);
  }

  async function toggleCredential(enabled: boolean) {
    const next = await updatePushPreferences({ notifyCredentials: enabled });
    if (next) setPrefs(next);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Push notifications</h2>
      <p className="mt-1 text-sm text-slate-600">
        Get alerts for critical open shifts, open shift application updates, roster updates, rostering replies, shift
        reminders, and credential expiry. On iPhone, install the app to your home screen first — see{" "}
        <Link href="/m/install" className="font-medium text-[#b51266] underline">
          Install on iPhone
        </Link>
        .
      </p>
      {supportHint ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">{supportHint}</p>
      ) : null}

      <div className="mt-4 flex flex-col gap-2">
        {prefs?.subscribed ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleDisable()}
            className="min-h-11 rounded-xl border border-slate-200 text-sm font-medium text-slate-700"
          >
            Turn off on this device
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleEnable()}
            className="min-h-11 rounded-xl bg-[#b51266] text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Enabling…" : "Enable notifications"}
          </button>
        )}
      </div>

      {prefs?.subscribed ? (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Critical shifts available</span>
            <input
              type="checkbox"
              checked={prefs.notifyCriticalShifts}
              onChange={(e) => void toggleCritical(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Rostering replies</span>
            <input
              type="checkbox"
              checked={prefs.notifyRosteringReplies}
              onChange={(e) => void toggleRostering(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Open shift applications</span>
            <input
              type="checkbox"
              checked={prefs.notifyShiftRequests}
              onChange={(e) => void toggleShiftRequests(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Shift updates and reminders</span>
            <input
              type="checkbox"
              checked={prefs.notifyShiftChanges}
              onChange={(e) => void toggleShift(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-slate-700">Credential expiry</span>
            <input
              type="checkbox"
              checked={prefs.notifyCredentials}
              onChange={(e) => void toggleCredential(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300"
            />
          </label>
        </div>
      ) : null}

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
