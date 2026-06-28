"use client";

import { AdminMessageBody } from "@/components/communications/admin-message-body";
import type { PendingAdminMessage } from "@/lib/admin-communications/types";

export function AdminMessageBanner({
  message,
  onDismiss,
}: {
  message: PendingAdminMessage;
  onDismiss: () => void;
}) {
  async function dismiss() {
    await fetch("/api/communications/acknowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageId: message.id,
        action: "dismiss_banner",
        recurrencePeriod: message.recurrencePeriod,
      }),
    });
    onDismiss();
  }

  return (
    <div className="border-b border-indigo-200 bg-indigo-50 px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-indigo-950">{message.title}</p>
          <div className="mt-1 max-h-24 overflow-y-auto">
            <AdminMessageBody body={message.body} className="text-indigo-900/90" />
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss message"
          onClick={() => void dismiss()}
          className="shrink-0 rounded-md px-2 py-1 text-lg leading-none text-indigo-700 hover:bg-indigo-100"
        >
          ×
        </button>
      </div>
    </div>
  );
}
