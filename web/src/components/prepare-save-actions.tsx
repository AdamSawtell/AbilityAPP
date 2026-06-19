"use client";

import Link from "next/link";
import { useState } from "react";
import { savePreparedActivityDraft } from "@/lib/ai/prepare-save.client";

type PrepareSaveActionsProps = {
  draftId?: string;
  href: string;
  kind: string;
  layout?: "modal" | "inline" | "bar";
  onSaved?: (result: { clientName?: string; href?: string }) => void;
  onClose?: () => void;
};

export function PrepareSaveActions({
  draftId,
  href,
  kind,
  layout = "inline",
  onSaved,
  onClose,
}: PrepareSaveActionsProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const canSaveHere = kind === "client_activity_prepare" && Boolean(draftId);

  async function handleSave() {
    if (!draftId || saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await savePreparedActivityDraft(draftId);
      onSaved?.({ clientName: result.clientName, href: result.href });
      onClose?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save activity.");
    } finally {
      setSaving(false);
    }
  }

  const primaryClass =
    layout === "modal"
      ? "inline-flex w-full items-center justify-center rounded-lg bg-[#d4147a] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#b51266] disabled:opacity-60"
      : "inline-flex w-full items-center justify-center rounded-lg bg-[#d4147a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b51266] disabled:opacity-60";

  const secondaryClass =
    layout === "modal"
      ? "w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      : "inline-flex w-full items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

  return (
    <div className={layout === "bar" ? "mt-2.5 space-y-2" : "space-y-2"}>
      {canSaveHere ? (
        <button type="button" onClick={() => void handleSave()} disabled={saving} className={primaryClass}>
          {saving ? "Saving…" : "Save activity"}
        </button>
      ) : (
        <Link href={href} onClick={onClose} className={primaryClass}>
          Open form and save
        </Link>
      )}
      {canSaveHere ? (
        <Link href={href} onClick={onClose} className={secondaryClass}>
          Edit on form first
        </Link>
      ) : layout === "modal" ? (
        <button type="button" onClick={onClose} className={secondaryClass}>
          Review in chat
        </button>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
