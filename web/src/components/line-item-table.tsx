"use client";

import { useMemo, useState } from "react";
import { formatLineCellValue, LineCellInput } from "@/components/line-cell-input";
import { RecordLineDrawer } from "@/components/record-line-drawer";
import { useReferenceData } from "@/lib/config-store";
import { clientDropdowns } from "@/lib/client";
import {
  renumberLines,
  type ClientTabTableConfig,
  type LineColumnDef,
} from "@/lib/client-line-tables";

type RowBase = { id: string; lineNo: number };

type DropdownMap = Record<string, string[]>;

type GenericColumn<TRow extends RowBase> = LineColumnDef<TRow>;

type GenericTableConfig<TRow extends RowBase> = {
  columns: GenericColumn<TRow>[];
  emptyRow: (lineNo: number) => TRow;
  addLabel?: string;
  emptyMessage?: string;
  listColumnKeys?: (keyof TRow & string)[];
  drawerTitle?: string;
};

export type LineItemTableLayout = "table" | "list-drawer";

export type { GenericTableConfig, GenericColumn };

/** Internal row keys — kept on data for ordering/persistence but not shown in volume tables. */
const HIDDEN_LINE_TABLE_COLUMN_KEYS = new Set(["lineNo"]);

function resolveListColumns<TRow extends RowBase>(
  config: GenericTableConfig<TRow> | ClientTabTableConfig<TRow>,
  visibleColumns: GenericColumn<TRow>[]
): GenericColumn<TRow>[] {
  if (config.listColumnKeys?.length) {
    return config.listColumnKeys
      .map((key) => visibleColumns.find((col) => col.key === key))
      .filter((col): col is GenericColumn<TRow> => Boolean(col));
  }
  return visibleColumns.filter((col) => col.type !== "textarea").slice(0, 4);
}

function drawerHeading<TRow extends RowBase>(
  config: GenericTableConfig<TRow> | ClientTabTableConfig<TRow>,
  row: TRow,
  visibleColumns: GenericColumn<TRow>[]
): string {
  const base = config.drawerTitle ?? "Line item";
  const subjectCol = visibleColumns.find((col) => col.key === "subject" || col.key === "name");
  if (!subjectCol) return base;
  const label = String(row[subjectCol.key as keyof TRow] ?? "").trim();
  return label || base;
}

export function LineItemTable<TRow extends RowBase>({
  config,
  rows,
  onChange,
  dropdowns = clientDropdowns as DropdownMap,
  optionLabels,
  readOnly = false,
  layout: layoutProp,
}: {
  config: GenericTableConfig<TRow> | ClientTabTableConfig<TRow>;
  rows: TRow[];
  onChange: (rows: TRow[]) => void;
  dropdowns?: DropdownMap;
  optionLabels?: Record<string, string>;
  readOnly?: boolean;
  /** Override config.layout — `list-drawer` shows summary list + side drawer. */
  layout?: LineItemTableLayout;
}) {
  const layout = layoutProp ?? ("layout" in config ? config.layout : undefined) ?? "table";
  const { catalog } = useReferenceData();
  const resolvedDropdowns = useMemo(() => {
    const fromCatalog = Object.fromEntries(
      Object.entries(catalog).map(([key, options]) => [key, options])
    ) as DropdownMap;
    return { ...fromCatalog, ...clientDropdowns, ...dropdowns };
  }, [catalog, dropdowns]);
  const [search, setSearch] = useState("");
  const [drawerRowId, setDrawerRowId] = useState<string | null>(null);

  const visibleColumns = useMemo(
    () => config.columns.filter((col) => !HIDDEN_LINE_TABLE_COLUMN_KEYS.has(col.key)),
    [config.columns]
  );

  const listColumns = useMemo(
    () => resolveListColumns(config, visibleColumns),
    [config, visibleColumns]
  );

  const tableColumns = layout === "list-drawer" ? listColumns : visibleColumns;

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

  const drawerRow = drawerRowId ? rows.find((row) => row.id === drawerRowId) ?? null : null;

  function updateRow(id: string, key: keyof TRow, value: string | number | boolean) {
    onChange(rows.map((row) => (row.id === id ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    const next = config.emptyRow(rows.length + 1);
    onChange(renumberLines([...rows, next]));
    if (layout === "list-drawer") setDrawerRowId(next.id);
  }

  function removeRow(id: string) {
    onChange(renumberLines(rows.filter((row) => row.id !== id)));
    if (drawerRowId === id) setDrawerRowId(null);
  }

  function duplicateRow(id: string) {
    const source = rows.find((row) => row.id === id);
    if (!source) return;
    const copy = { ...source, id: config.emptyRow(rows.length + 1).id };
    onChange(renumberLines([...rows, copy]));
    if (layout === "list-drawer") setDrawerRowId(copy.id);
  }

  const footerNote =
    layout === "list-drawer"
      ? "Click a row to open the editor. Changes save with the parent record."
      : "Changes save with the parent record.";

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
          disabled={readOnly}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {config.addLabel ?? "Add row"}
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {tableColumns.map((col) => (
                <th key={col.key} className={`px-3 py-2.5 font-medium ${col.className ?? ""}`}>
                  {col.label}
                  {layout === "table" && col.required ? <span className="text-[#d4147a]"> *</span> : null}
                </th>
              ))}
              {layout === "table" && !readOnly ? <th className="px-3 py-2.5 font-medium">Actions</th> : null}
              {layout === "list-drawer" ? <th className="w-10 px-3 py-2.5 font-medium" aria-label="Open" /> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filtered.length ? (
              filtered.map((row) =>
                layout === "list-drawer" ? (
                  <tr
                    key={row.id}
                    className="cursor-pointer align-top hover:bg-slate-50/80"
                    onClick={() => setDrawerRowId(row.id)}
                  >
                    {tableColumns.map((col) => (
                      <td key={col.key} className={`px-3 py-2.5 text-slate-700 ${col.className ?? ""}`}>
                        <span className="line-clamp-2">
                          {formatLineCellValue(col, row, resolvedDropdowns, optionLabels)}
                        </span>
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right text-slate-400" aria-hidden>
                      →
                    </td>
                  </tr>
                ) : (
                  <tr key={row.id} className="align-top hover:bg-slate-50/80">
                    {tableColumns.map((col) => (
                      <td key={col.key} className={`px-3 py-2 ${col.className ?? ""}`}>
                        <LineCellInput
                          column={col}
                          row={row}
                          dropdowns={resolvedDropdowns}
                          optionLabels={optionLabels}
                          readOnly={readOnly}
                          onChange={(value) => updateRow(row.id, col.key as keyof TRow, value)}
                        />
                      </td>
                    ))}
                    {readOnly ? null : (
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
                    )}
                  </tr>
                )
              )
            ) : (
              <tr>
                <td
                  colSpan={tableColumns.length + (layout === "list-drawer" ? 1 : readOnly ? 0 : 1)}
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
        {readOnly ? " · Read-only" : ` · ${footerNote}`}
      </p>

      {layout === "list-drawer" ? (
        <RecordLineDrawer
          open={Boolean(drawerRow)}
          row={drawerRow}
          columns={visibleColumns}
          title={drawerRow ? drawerHeading(config, drawerRow, visibleColumns) : config.drawerTitle ?? "Line item"}
          subtitle={drawerRow ? `Line ${drawerRow.lineNo}` : undefined}
          dropdowns={resolvedDropdowns}
          optionLabels={optionLabels}
          readOnly={readOnly}
          onClose={() => setDrawerRowId(null)}
          onChange={(key, value) => {
            if (!drawerRow) return;
            updateRow(drawerRow.id, key, value);
          }}
          onDuplicate={
            readOnly || !drawerRow
              ? undefined
              : () => {
                  duplicateRow(drawerRow.id);
                }
          }
          onRemove={
            readOnly || !drawerRow
              ? undefined
              : () => {
                  removeRow(drawerRow.id);
                }
          }
        />
      ) : null}
    </div>
  );
}
