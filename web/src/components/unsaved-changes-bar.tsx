"use client";

type UnsavedChangesBarProps = {
  visible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  message?: string;
};

export function UnsavedChangesBar({
  visible,
  onSave,
  onDiscard,
  message = "You have unsaved changes",
}: UnsavedChangesBarProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-6 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:pl-72">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-slate-700">{message}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
