"use client";

import { useMemo, useState } from "react";
import type { ReportColumnDef } from "@/lib/reports/types";
import { downloadCsv, rowsToCsv } from "@/lib/reports/export";

const DEFAULT_PAGE_SIZE = 50;

type ReportTableProps = {
  title: string;
  description: string;
  columns: ReportColumnDef[];
  rows: Record<string, string>[];
  maxColumns: number;
  exportFilename: string;
  /** Paginate large result sets (used by Reports Advance). */
  paginate?: boolean;
  pageSize?: number;
  /** Show copy buttons and click-to-expand for long cell values. */
  richCells?: boolean;
};

function cellDisplayValue(value: string | undefined): string {
  return value?.trim() ? value : "—";
}

export function ReportTable({
  title,
  description,
  columns,
  rows,
  maxColumns,
  exportFilename,
  paginate = false,
  pageSize = DEFAULT_PAGE_SIZE,
  richCells = false,
}: ReportTableProps) {
  const defaultOrder = useMemo(() => columns.map((c) => c.id), [columns]);
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [dragColumnId, setDragColumnId] = useState<string | null>(null);
  const [showColumnPicker, setShowColumnPicker] = useState(false);
  const [page, setPage] = useState(0);
  const [expandedCell, setExpandedCell] = useState<{ rowIdx: number; columnId: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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

  const totalPages = paginate ? Math.max(1, Math.ceil(filteredRows.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages - 1);

  const visibleRows = useMemo(() => {
    if (!paginate) return filteredRows;
    const start = safePage * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, paginate, safePage, pageSize]);

  const expandedValue = useMemo(() => {
    if (!expandedCell) return null;
    const row = visibleRows[expandedCell.rowIdx];
    if (!row) return null;
    return cellDisplayValue(row[expandedCell.columnId]);
  }, [expandedCell, visibleRows]);

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

  async function copyCellValue(rowIdx: number, columnId: string, value: string) {
    const key = `${rowIdx}:${columnId}`;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1500);
    } catch {
      // ignore clipboard failures
    }
  }

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(0);
    setExpandedCell(null);
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
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search visible columns…"
          className="w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a] sm:w-80"
        />
        <p className="text-sm text-slate-500">
          {paginate
            ? `${visibleRows.length} of ${filteredRows.length} rows on this page (${rows.length} total)`
            : `${filteredRows.length} of ${rows.length} rows`}{" "}
          · {orderedColumns.length} columns
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
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={orderedColumns.length || 1} className="px-4 py-8 text-center text-slate-500">
                  No rows match your search.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-slate-50/80">
                  {orderedColumns.map((col) => {
                    const raw = row[col.id] ?? "";
                    const display = cellDisplayValue(raw);
                    const cellKey = `${rowIdx}:${col.id}`;
                    const isLong = richCells && raw.length > 48;

                    return (
                      <td
                        key={col.id}
                        className={`px-3 py-2 text-slate-700 ${
                          richCells
                            ? "max-w-md align-top whitespace-normal break-words"
                            : "max-w-xs truncate whitespace-nowrap"
                        }`}
                      >
                        <div className="flex items-start gap-1">
                          {richCells && isLong ? (
                            <button
                              type="button"
                              onClick={() => setExpandedCell({ rowIdx, columnId: col.id })}
                              className="line-clamp-3 text-left hover:text-[#b51266] hover:underline"
                              title="Click to view full value"
                            >
                              {display}
                            </button>
                          ) : (
                            <span className={richCells ? "line-clamp-3" : undefined}>{display}</span>
                          )}
                          {richCells && raw.trim() ? (
                            <button
                              type="button"
                              onClick={() => void copyCellValue(rowIdx, col.id, raw)}
                              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                              title="Copy cell value"
                            >
                              {copiedKey === cellKey ? "Copied" : "Copy"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {paginate && filteredRows.length > pageSize ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Page {safePage + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
                setExpandedCell(null);
              }}
              disabled={safePage === 0}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => {
                setPage((p) => Math.min(totalPages - 1, p + 1));
                setExpandedCell(null);
              }}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {expandedCell && expandedValue ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          role="presentation"
          onClick={() => setExpandedCell(null)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-cell-expand-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 id="report-cell-expand-title" className="text-sm font-semibold text-slate-900">
                Cell value
              </h3>
              <button
                type="button"
                onClick={() => setExpandedCell(null)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-slate-800">{expandedValue}</pre>
            <button
              type="button"
              onClick={() => void copyCellValue(expandedCell.rowIdx, expandedCell.columnId, expandedValue)}
              className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Copy to clipboard
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
