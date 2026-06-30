"use client";

import { useCallback, useEffect, useState } from "react";
import { LineCellInput, type LineCellColumn } from "@/components/line-cell-input";

type RowBase = { id: string; lineNo: number };
type DropdownMap = Record<string, string[]>;

export type RecordLineDrawerSaveActions = {
  onSave: () => boolean | void | Promise<boolean | void>;
  onDiscardLineChanges: () => void;
  dirty: boolean;
  canSave?: boolean;
  saving?: boolean;
  saveError?: string;
  saveLabel?: string;
};

type RecordLineDrawerProps<TRow extends RowBase> = {
  open: boolean;
  row: TRow | null;
  columns: LineCellColumn<TRow>[];
  title: string;
  subtitle?: string;
  dropdowns: DropdownMap;
  optionLabels?: Record<string, string>;
  readOnly?: boolean;
  onClose: () => void;
  onChange: (key: keyof TRow, value: string | number | boolean) => void;
  onDuplicate?: () => void;
  onRemove?: () => void;
  onRequestDeletion?: () => void;
  deletionPending?: boolean;
  saveActions?: RecordLineDrawerSaveActions;
};

export function RecordLineDrawer<TRow extends RowBase>({
  open,
  row,
  columns,
  title,
  subtitle,
  dropdowns,
  optionLabels,
  readOnly = false,
  onClose,
  onChange,
  onDuplicate,
  onRemove,
  onRequestDeletion,
  deletionPending = false,
  saveActions,
}: RecordLineDrawerProps<TRow>) {
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [localSaving, setLocalSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setCloseConfirm(false);
      setLocalSaving(false);
    }
  }, [open]);

  const saving = localSaving || Boolean(saveActions?.saving);
  const canSave = saveActions?.canSave !== false;
  const showSave = Boolean(saveActions && !readOnly);
  const lineDirty = Boolean(saveActions?.dirty);
  const saveLabel = saveActions?.saveLabel ?? "Save";

  const requestClose = useCallback(() => {
    if (readOnly || !lineDirty || !showSave) {
      onClose();
      return;
    }
    setCloseConfirm(true);
  }, [readOnly, lineDirty, showSave, onClose]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, requestClose]);

  if (!open || !row) return null;

  async function handleSave() {
    if (!saveActions || !canSave || saving) return;
    setLocalSaving(true);
    try {
      const saved = await saveActions.onSave();
      if (saved === false) return;
      setCloseConfirm(false);
      onClose();
    } finally {
      setLocalSaving(false);
    }
  }

  function handleDiscardLineChanges() {
    saveActions?.onDiscardLineChanges();
    setCloseConfirm(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/30" aria-label="Close line editor" onClick={requestClose} />
      <aside className="relative flex h-full w-full max-w-lg flex-col border-l border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Line item</p>
              <h2 className="mt-1 truncate text-lg font-semibold text-slate-900">{title}</h2>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-sm text-slate-600 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {columns.map((column) => (
              <label key={column.key} className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  {column.label}
                  {column.required ? <span className="text-[#d4147a]"> *</span> : null}
                </span>
                <LineCellInput
                  column={column}
                  row={row}
                  dropdowns={dropdowns}
                  optionLabels={optionLabels}
                  readOnly={readOnly}
                  stacked
                  onChange={(value) => onChange(column.key as keyof TRow, value)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-200 px-5 py-4">
          {closeConfirm ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3" role="alertdialog" aria-label="Unsaved line changes">
              <p className="text-sm font-medium text-amber-950">You have unsaved changes on this line.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={!canSave || saving}
                  className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving…" : saveLabel}
                </button>
                <button
                  type="button"
                  onClick={handleDiscardLineChanges}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Discard line changes
                </button>
                <button
                  type="button"
                  onClick={() => setCloseConfirm(false)}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Keep editing
                </button>
              </div>
            </div>
          ) : null}

          {readOnly ? (
            <p className="text-xs text-slate-500">Read-only — you cannot edit this line.</p>
          ) : showSave ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={!canSave || saving || !lineDirty}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving…" : saveLabel}
              </button>
              <button
                type="button"
                onClick={requestClose}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          ) : null}

          {!readOnly ? (
            <div className="flex flex-wrap gap-2">
              {onDuplicate ? (
                <button
                  type="button"
                  onClick={onDuplicate}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Duplicate
                </button>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  onClick={onRemove}
                  disabled={saving}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              ) : null}
              {onRequestDeletion ? (
                <button
                  type="button"
                  onClick={onRequestDeletion}
                  disabled={deletionPending || saving}
                  className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deletionPending ? "Deletion requested" : "Request deletion"}
                </button>
              ) : null}
            </div>
          ) : null}

          {saveActions?.saveError ? (
            <p className="text-sm text-red-700" role="alert">
              {saveActions.saveError}
            </p>
          ) : null}

          {readOnly ? null : showSave ? (
            <p className="text-xs text-slate-500">
              {lineDirty
                ? "Save persists this line with the parent record. Cancel closes the editor."
                : "No changes on this line yet."}
            </p>
          ) : (
            <p className="text-xs text-slate-500">Changes apply to the open record. Save the parent record to persist.</p>
          )}
        </div>
      </aside>
    </div>
  );
}
