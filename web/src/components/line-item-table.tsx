"use client";

import { useMemo, useState } from "react";
import { useReferenceData } from "@/lib/config-store";
import { clientDropdowns } from "@/lib/client";
import {
  renumberLines,
  type ClientTabTableConfig,
} from "@/lib/client-line-tables";

type RowBase = { id: string; lineNo: number };

type DropdownMap = Record<string, string[]>;

type GenericColumn<TRow extends RowBase> = {
  key: keyof TRow & string;
  label: string;
  type: string;
  optionsKey?: string;
  required?: boolean;
  className?: string;
};

type GenericTableConfig<TRow extends RowBase> = {
  columns: GenericColumn<TRow>[];
  emptyRow: (lineNo: number) => TRow;
  addLabel?: string;
  emptyMessage?: string;
};

export type { GenericTableConfig, GenericColumn };

function CellInput<TRow extends RowBase, TColumn extends { key: keyof TRow & string; type: string; optionsKey?: string }>({
  column,
  row,
  onChange,
  dropdowns,
  optionLabels,
}: {
  column: TColumn;
  row: TRow;
  onChange: (value: string | number | boolean) => void;
  dropdowns: DropdownMap;
  optionLabels?: Record<string, string>;
}) {
  const base =
    "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#d4147a] focus:ring-1 focus:ring-[#d4147a]/30";
  const value = row[column.key as keyof TRow];

  if (column.type === "number") {
    return (
      <input
        className={`${base} w-12 text-center`}
        type="number"
        min={1}
        value={Number(value) || ""}
        onChange={(e) => onChange(Number(e.target.value) || 1)}
      />
    );
  }

  if (column.type === "date") {
    return (
      <input
        className={base}
        type="date"
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (column.type === "select" && column.optionsKey) {
    const options = dropdowns[column.optionsKey] ?? [];
    return (
      <select
        className={base}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {optionLabels?.[o] ?? o}
          </option>
        ))}
      </select>
    );
  }

  if (column.type === "checkbox") {
    return (
      <input
        className="h-4 w-4 rounded border-slate-300"
        type="checkbox"
        checked={Boolean(value)}
        onChange={(e) => onChange(e.target.checked)}
      />
    );
  }

  if (column.type === "textarea") {
    return (
      <textarea
        className={`${base} min-h-[60px] resize-y`}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
      />
    );
  }

  return (
    <input
      className={base}
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function LineItemTable<TRow extends RowBase>({
  config,
  rows,
  onChange,
  dropdowns = clientDropdowns as DropdownMap,
  optionLabels,
}: {
  config: GenericTableConfig<TRow> | ClientTabTableConfig<TRow>;
  rows: TRow[];
  onChange: (rows: TRow[]) => void;
  dropdowns?: DropdownMap;
  optionLabels?: Record<string, string>;
}) {
  const { catalog } = useReferenceData();
  const resolvedDropdowns = useMemo(() => {
    const fromCatalog = Object.fromEntries(
      Object.entries(catalog).map(([key, options]) => [key, options])
    ) as DropdownMap;
    return { ...fromCatalog, ...clientDropdowns, ...dropdowns };
  }, [catalog, dropdowns]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter((row) =>
      config.columns.some((col) => {
        const val = row[col.key as keyof TRow];
        return String(val ?? "")
          .toLowerCase()
          .includes(q);
      })
    );
  }, [rows, search, config.columns]);

  function updateRow(id: string, key: keyof TRow, value: string | number | boolean) {
    onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    onChange(renumberLines([...rows, config.emptyRow(rows.length + 1)]));
  }

  function removeRow(id: string) {
    onChange(renumberLines(rows.filter((row) => row.id !== id)));
  }

  function duplicateRow(id: string) {
    const source = rows.find((row) => row.id === id);
    if (!source) return;
    const copy = { ...source, id: config.emptyRow(rows.length + 1).id };
    onChange(renumberLines([...rows, copy]));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Search rows…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
        />
        <button
          type="button"
          onClick={addRow}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
        >
          {config.addLabel ?? "Add row"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {config.columns.map((col) => (
                <th key={col.key} className={`px-3 py-2.5 font-medium ${col.className ?? ""}`}>
                  {col.label}
                  {col.required ? <span className="text-[#d4147a]"> *</span> : null}
                </th>
              ))}
              <th className="px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.length ? (
              filtered.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50/80">
                  {config.columns.map((col) => (
                    <td key={col.key} className={`px-3 py-2 ${col.className ?? ""}`}>
                      <CellInput
                        column={col}
                        row={row}
                        dropdowns={resolvedDropdowns}
                        optionLabels={optionLabels}
                        onChange={(value) => updateRow(row.id, col.key as keyof TRow, value)}
                      />
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        title="Duplicate row"
                        onClick={() => duplicateRow(row.id)}
                        className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                      >
                        Copy
                      </button>
                      <button
                        type="button"
                        title="Remove row"
                        onClick={() => removeRow(row.id)}
                        className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={config.columns.length + 1}
                  className="px-3 py-10 text-center text-sm text-slate-500"
                >
                  {search.trim() ? "No rows match your search." : config.emptyMessage ?? "No rows yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        {rows.length} row{rows.length === 1 ? "" : "s"}
        {search.trim() && filtered.length !== rows.length ? ` · ${filtered.length} shown` : ""}
        {" · "}
        Changes save with the parent record.
      </p>
    </div>
  );
}
