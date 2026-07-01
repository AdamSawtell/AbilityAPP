"use client";

import { useEffect, useState } from "react";
import { fetchPasskeyStatus, passkeyLabel, registerPasskey } from "@/lib/mobile/passkey-client";
import { isStandaloneMobileApp } from "@/lib/mobile/push-support";

export function MobilePasskeySettings() {
  const [enrolled, setEnrolled] = useState(false);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void fetchPasskeyStatus().then((status) => {
      setSupported(status.supported);
      setEnrolled(status.enrolled);
    });
  }, []);

  if (!supported) return null;

  const label = passkeyLabel();

  async function handleEnable() {
    setBusy(true);
    setError("");
    setMessage("");
    const result = await registerPasskey();
    if (!result.ok) {
      setError(result.error ?? `${label} setup failed`);
      setBusy(false);
      return;
    }
    setEnrolled(true);
    setMessage(`${label} enabled for faster sign-in on this device.`);
    setBusy(false);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-900">{label} sign-in</h2>
      <p className="mt-2 text-sm text-slate-600">
        {enrolled
          ? `${label} is enabled on this device. Use it next time instead of your password.`
          : `Enable ${label} to sign back in quickly after your session expires.`}
      </p>
      {!isStandaloneMobileApp() ? (
        <p className="mt-2 text-xs text-amber-800">
          For reliable {label} on iPhone, add My Workplace to your home screen first (Install on iPhone).
        </p>
      ) : null}
      {!enrolled ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleEnable()}
          className="mt-4 min-h-11 w-full rounded-xl border border-[#b51266]/20 bg-[#fdf2f8] text-sm font-semibold text-[#b51266] disabled:opacity-60"
        >
          {busy ? "Setting up…" : `Enable ${label}`}
        </button>
      ) : null}
      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
