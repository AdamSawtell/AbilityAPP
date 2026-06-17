"use client";

import type { OrgPositionRecord } from "@/lib/org-structure";

export type PendingReparent = {
  positionId: string;
  newParentId: string;
};

export function OrgReparentConfirmDialog({
  pending,
  positions,
  onConfirm,
  onCancel,
}: {
  pending: PendingReparent;
  positions: OrgPositionRecord[];
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const moving = positions.find((p) => p.id === pending.positionId);
  const target = positions.find((p) => p.id === pending.newParentId);
  if (!moving || !target) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">Confirm reporting line change</h3>
        <p className="mt-2 text-sm text-slate-600">
          Move <span className="font-medium text-slate-900">{moving.title}</span> to report under{" "}
          <span className="font-medium text-slate-900">{target.title}</span>?
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Dependent positions under {moving.title} move with it. Escalation paths update after you confirm.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Confirm move
          </button>
        </div>
      </div>
    </div>
  );
}
