"use client";

import { useMemo, useState } from "react";
import type { ReportColumnDef } from "@/lib/reports/types";
import { downloadCsv, rowsToCsv } from "@/lib/reports/export";

type ReportTableProps = {
  title: string;
  description: string;
  columns: ReportColumnDef[];
  rows: Record<string, string>[];
  maxColumns: number;
  exportFilename: string;
};

export function ReportTable({
  title,
  description,
  columns,
  rows,
  maxColumns,
  exportFilename,
}: ReportTableProps) {
  const defaultOrder = useMemo(() => columns.map((c) => c.id), [columns]);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  const orderedColumns = useMemo(() => {
    const byId = new Map(columns.map((c) => [c.id, c]));
    return columnOrder
      .map((id) => byId.get(id))
      .filter((c): c is ReportColumnDef => Boolean(c))
      .filter((c) => !hiddenColumns.has(c.id));
  }, [columns, columnOrder, hiddenColumns]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      orderedColumns.some((col) => (row[col.id] ?? "").toLowerCase().includes(q))
    );
  }, [rows, orderedColumns, search]);

  function moveColumn(id: string, direction: -1 | 1) {
    setColumnOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = idx + direction;
      if (next < 0 || next >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[next]] = [copy[next], copy[idx]];
      return copy;
    });
  }

  function onDragStart(id: string) {
    setDragColumnId(id);
  }

  function onDrop(targetId: string) {
    if (!dragColumnId || dragColumnId === targetId) return;
    setColumnOrder((prev) => {
      const from = prev.indexOf(dragColumnId);
      const to = prev.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      const copy = [...prev];
      copy.splice(from, 1);
      copy.splice(to, 0, dragColumnId);
      return copy;
    });
    setDragColumnId(null);
  }

  function toggleColumn(id: string) {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (orderedColumns.length <= 1) return prev;
        next.add(id);
      }
      return next;
    });
  }

  function exportCsv() {
    const csv = rowsToCsv(filteredRows, orderedColumns);
    downloadCsv(exportFilename, csv);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowColumnPicker((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Columns
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!filteredRows.length}
            className="rounded-lg bg-[#d4147a] px-3 py-2 text-sm font-medium text-white hover:bg-[#b51266] disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {showColumnPicker ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs text-slate-500">
            Choose visible columns (max {maxColumns}). Drag headers in the table to reorder — layout is
            saved only while this window is open.
          </p>
          <div className="flex flex-wrap gap-2">
            {columns.map((col) => (
              <label
                key={col.id}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${
                  hiddenColumns.has(col.id)
                    ? "border-slate-200 text-slate-400"
                    : "border-[#f9a8d4] bg-[#fdf2f8] text-[#b51266]"
                }`}
              >
                <input
                  type="checkbox"
                  className="rounded"
                  checked={!hiddenColumns.has(col.id)}
                  onChange={() => toggleColumn(col.id)}
                />
                {col.label}
              </label>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search visible columns…"
          className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a] sm:w-80"
        />
        <p className="text-sm text-slate-500">
          {filteredRows.length} of {rows.length} rows · {orderedColumns.length} columns
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {orderedColumns.map((col) => (
                <th
                  key={col.id}
                  draggable
                  onDragStart={() => onDragStart(col.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDrop(col.id)}
                  className="group whitespace-nowrap px-3 py-2 text-left font-medium text-slate-600"
                >
                  <div className="flex items-center gap-1">
                    <span className="cursor-grab text-slate-300 group-hover:text-slate-500" title="Drag to reorder">
                      ⋮⋮
                    </span>
                    <span>{col.label}</span>
                    <span className="ml-1 inline-flex gap-0.5 opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => moveColumn(col.id, -1)}
                        className="rounded px-1 text-[10px] text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        title="Move left"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveColumn(col.id, 1)}
                        className="rounded px-1 text-[10px] text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        title="Move right"
                      >
                        →
                      </button>
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length || 1} className="px-4 py-8 text-center text-slate-500">
                  No rows match your search.
                </td>
              </tr>
            ) : (
              filteredRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/80">
                  {orderedColumns.map((col) => (
                    <td key={col.id} className="max-w-xs truncate whitespace-nowrap px-3 py-2 text-slate-700">
                      {row[col.id] || "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
