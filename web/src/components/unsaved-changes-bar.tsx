"use client";

import Link from "next/link";
import { useEffect } from "react";

export type SaveConfirmation = {
  message: string;
  link?: { label: string; href: string };
};

type UnsavedChangesBarProps = {
  visible: boolean;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  message?: string;
  saveDisabled?: boolean;
  saving?: boolean;
  confirmation?: SaveConfirmation | null;
  onConfirmationDismiss?: () => void;
};

export function UnsavedChangesBar({
  visible,
  onSave,
  onDiscard,
  message = "You have unsaved changes",
  saveDisabled = false,
  saving = false,
  confirmation = null,
  onConfirmationDismiss,
}: UnsavedChangesBarProps) {
  useEffect(() => {
    if (!confirmation || !onConfirmationDismiss) return;
    const timer = window.setTimeout(onConfirmationDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [confirmation, onConfirmationDismiss]);

  if (!visible && !confirmation) return null;

  if (confirmation) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-200 bg-emerald-50/95 px-6 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:pl-72">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-emerald-900" role="status">
            ✓ {confirmation.message}
          </p>
          {confirmation.link ? (
            <Link href={confirmation.link.href} className="text-sm font-medium text-emerald-800 hover:underline">
              {confirmation.link.label} →
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:pl-72">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saveDisabled || saving}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
