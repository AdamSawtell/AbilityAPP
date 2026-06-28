"use client";

import { useEffect, useState } from "react";
import { AdminMessageBody } from "@/components/communications/admin-message-body";
import type { PendingAdminMessage } from "@/lib/admin-communications/types";

const MIN_VIEW_MS = 3000;

export function AdminMessageAckModal({
  message,
  onAcknowledged,
}: {
  message: PendingAdminMessage;
  onAcknowledged: () => void;
}) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), MIN_VIEW_MS);
    void fetch("/api/communications/acknowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: message.id,
        action: "seen",
        recurrencePeriod: message.recurrencePeriod,
      }),
    });
    return () => window.clearTimeout(timer);
  }, [message.id, message.recurrencePeriod]);

  async function acknowledge() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/communications/acknowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: message.id,
          action: "acknowledge",
          recurrencePeriod: message.recurrencePeriod,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Could not record acknowledgment.");
      }
      onAcknowledged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record acknowledgment.");
    } finally {
      setBusy(false);
    }
  }

  const published = new Date(message.publishAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 px-4 py-8 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-message-title"
        className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="border-b border-slate-100 bg-gradient-to-r from-[#fdf2f8] to-white px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">Company message</p>
          <h2 id="admin-message-title" className="mt-1 text-xl font-semibold text-slate-900">
            {message.title}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            From {message.senderName} · {published}
          </p>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-6 py-5">
          <AdminMessageBody body={message.body} />
        </div>
        <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
          {error ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
          ) : null}
          {!ready ? (
            <p className="mb-3 text-xs text-slate-500">Please read the message before acknowledging.</p>
          ) : null}
          <button
            type="button"
            disabled={!ready || busy}
            onClick={() => void acknowledge()}
            className="w-full rounded-lg bg-[#d4147a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? "Saving…" : "I have read and understood"}
          </button>
        </div>
      </div>
    </div>
  );
}
