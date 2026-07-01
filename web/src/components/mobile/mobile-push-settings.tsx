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

export function MobilePushSettings() {
  const [prefs, setPrefs] = useState<PushPreferences | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
        Get reminders for upcoming shifts and credential expiry. On iPhone, install the app to your home screen first — see{" "}
        <Link href="/m/install" className="font-medium text-[#b51266] underline">
          Install on iPhone
        </Link>
        .
      </p>

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
            <span className="text-slate-700">Shift reminders</span>
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
