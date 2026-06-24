"use client";

import { useEffect } from "react";
import { LineCellInput, type LineCellColumn } from "@/components/line-cell-input";

type RowBase = { id: string; lineNo: number };
type DropdownMap = Record<string, string[]>;

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
}: RecordLineDrawerProps<TRow>) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button type="button" className="absolute inset-0 bg-slate-900/30" aria-label="Close line editor" onClick={onClose} />
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
              onClick={onClose}
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
          {readOnly ? (
            <p className="text-xs text-slate-500">Read-only — you cannot edit this line.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {onDuplicate ? (
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Duplicate
                </button>
              ) : null}
              {onRemove ? (
                <button
                  type="button"
                  onClick={onRemove}
                  className="rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Remove
                </button>
              ) : null}
            </div>
          )}
          <p className="text-xs text-slate-500">Changes apply to the open record. Save the parent record to persist.</p>
        </div>
      </aside>
    </div>
  );
}
