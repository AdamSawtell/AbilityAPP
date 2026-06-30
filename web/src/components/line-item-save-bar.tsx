"use client";

import Link from "next/link";
import { useEffect } from "react";

export type LineItemSaveStatus = "idle" | "saving" | "saved" | "error";

export type LineItemSaveConfirmation = {
  message?: string;
  link?: { label: string; href: string };
};

type LineItemSaveBarProps = {
  dirtyCount: number;
  saveStatus: LineItemSaveStatus;
  saveError?: string;
  itemLabel?: string;
  confirmation?: LineItemSaveConfirmation;
  onSave: () => void | Promise<void>;
  onDiscard: () => void;
  onConfirmationDismiss?: () => void;
};

function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}

export function LineItemSaveBar({
  dirtyCount,
  saveStatus,
  saveError,
  itemLabel = "row",
  confirmation,
  onSave,
  onDiscard,
  onConfirmationDismiss,
}: LineItemSaveBarProps) {
  useEffect(() => {
    if (saveStatus !== "saved" || !onConfirmationDismiss) return;
    const timer = window.setTimeout(onConfirmationDismiss, 5000);
    return () => window.clearTimeout(timer);
  }, [saveStatus, onConfirmationDismiss]);

  if (saveStatus === "saved") {
    const message =
      confirmation?.message ??
      `Saved — ${dirtyCount || 1} ${pluralize(dirtyCount || 1, itemLabel)} updated`;
    return (
      <div
        className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        role="status"
      >
        <p className="text-sm font-medium text-emerald-900">✓ {message}</p>
        {confirmation?.link ? (
          <Link href={confirmation.link.href} className="text-sm font-medium text-emerald-800 hover:underline">
            {confirmation.link.label} →
          </Link>
        ) : null}
      </div>
    );
  }

  if (saveStatus !== "idle" && saveStatus !== "saving" && saveStatus !== "error") return null;
  if (dirtyCount <= 0 && saveStatus === "idle") return null;

  const saving = saveStatus === "saving";
  const errored = saveStatus === "error";

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${
        errored ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
      }`}
      role={errored ? "alert" : "status"}
    >
      <div>
        <p className={`text-sm font-medium ${errored ? "text-red-900" : "text-amber-950"}`}>
          {dirtyCount} {pluralize(dirtyCount, itemLabel)} changed
        </p>
        {errored && saveError ? <p className="mt-1 text-sm text-red-800">{saveError}</p> : null}
      </div>
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
          disabled={saving}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
