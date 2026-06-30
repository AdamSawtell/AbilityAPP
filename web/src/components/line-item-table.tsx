"use client";

import { useMemo, useState } from "react";
import { LineCellInput, formatLineCellValue } from "@/components/line-cell-input";
import {
  LineItemSaveBar,
  type LineItemSaveConfirmation,
  type LineItemSaveStatus,
} from "@/components/line-item-save-bar";
import { RecordLineDrawer } from "@/components/record-line-drawer";
import { useReferenceData } from "@/lib/config-store";
import { clientDropdowns } from "@/lib/client";
import {
  renumberLines,
  type ClientTabTableConfig,
  type LineColumnDef,
} from "@/lib/client-line-tables";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  buildActivityDeletionRequestTask,
  canDeleteActivityLines,
  findOpenActivityDeleteRequest,
  type ActivityLineDeleteContext,
} from "@/lib/activity-line-policy";
import { trackProcessExecution } from "@/lib/process-audit/track.client";
import { countDirtyRows, isRowDirty } from "@/lib/use-dirty-tracking";

import type { LineDeletePolicy } from "@/lib/activity-line-policy";

type RowBase = { id: string; lineNo: number };

type DropdownMap = Record<string, string[]>;

export type LineItemTableLayout = "table" | "list-drawer";

type GenericColumn<TRow extends RowBase> = LineColumnDef<TRow>;

type GenericTableConfig<TRow extends RowBase> = {
  columns: GenericColumn<TRow>[];
  emptyRow: (lineNo: number) => TRow;
  addLabel?: string;
  emptyMessage?: string;
  /** Summary list + side drawer for record child lines. */
  layout?: LineItemTableLayout;
  listColumnKeys?: (keyof TRow & string)[];
  drawerTitle?: string;
  /** When `admin-only`, only administrators can remove lines; others request deletion. */
  deletePolicy?: LineDeletePolicy;
};

export type { GenericTableConfig, GenericColumn, ActivityLineDeleteContext };
export type { LineItemSaveConfirmation, LineItemSaveStatus } from "@/components/line-item-save-bar";

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
  activityDeleteContext,
  saveable = false,
  referenceRows,
  dirty,
  dirtyCount,
  saveStatus = "idle",
  saveError,
  saveConfirmation,
  saveItemLabel = "row",
  onSave,
  onDiscard,
  onSaveConfirmationDismiss,
}: {
  config: GenericTableConfig<TRow> | ClientTabTableConfig<TRow>;
  rows: TRow[];
  onChange: (rows: TRow[]) => void;
  dropdowns?: DropdownMap;
  optionLabels?: Record<string, string>;
  readOnly?: boolean;
  layout?: LineItemTableLayout;
  activityDeleteContext?: ActivityLineDeleteContext;
  saveable?: boolean;
  referenceRows?: TRow[];
  dirty?: boolean;
  dirtyCount?: number;
  saveStatus?: LineItemSaveStatus;
  saveError?: string;
  saveConfirmation?: LineItemSaveConfirmation;
  saveItemLabel?: string;
  onSave?: () => void | Promise<void>;
  onDiscard?: () => void;
  onSaveConfirmationDismiss?: () => void;
}) {
  const layout = layoutProp ?? ("layout" in config ? config.layout : undefined) ?? "table";
  const { catalog } = useReferenceData();
  const { session, roles, canProcess } = useAuth();
  const { tasks, addTask } = useData();
  const activeRole = roles.find((role) => role.id === session?.activeRoleId) ?? session?.activeRoleId ?? null;
  const deletePolicy = "deletePolicy" in config ? config.deletePolicy : undefined;
  const adminOnlyDelete = deletePolicy === "admin-only";
  const canDelete = !readOnly && canDeleteActivityLines(deletePolicy, activeRole);
  const canRequestDeletion =
    !readOnly &&
    adminOnlyDelete &&
    !canDelete &&
    Boolean(activityDeleteContext) &&
    canProcess("request-activity-deletion");
  const resolvedDropdowns = useMemo(() => {
    const fromCatalog = Object.fromEntries(
      Object.entries(catalog).map(([key, options]) => [key, options])
    ) as DropdownMap;
    return { ...fromCatalog, ...clientDropdowns, ...dropdowns };
  }, [catalog, dropdowns]);
  const [search, setSearch] = useState("");
  const [drawerRowId, setDrawerRowId] = useState<string | null>(null);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);

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

  const baselineRows = referenceRows ?? rows;
  const computedDirtyCount = useMemo(
    () => (referenceRows ? countDirtyRows(rows, referenceRows) : 0),
    [referenceRows, rows]
  );
  const resolvedDirtyCount = dirtyCount ?? computedDirtyCount;
  const isDirty = dirty ?? (referenceRows ? computedDirtyCount > 0 : resolvedDirtyCount > 0);
  const showInlineSave = saveable && !readOnly && Boolean(onSave && onDiscard);
  const showSaveBar =
    showInlineSave && (saveStatus === "saved" || saveStatus === "error" || saveStatus === "saving" || isDirty);

  const actorName = session?.displayName?.trim() || "Unknown user";

  function updateRow(id: string, key: keyof TRow, value: string | number | boolean) {
    onChange(
      rows.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [key]: value };
        // Keep updatedBy in sync with the editor; skip when the field itself is being edited.
        if (key !== "updatedBy" && Object.prototype.hasOwnProperty.call(row, "updatedBy")) {
          (updated as Record<string, unknown>).updatedBy = actorName;
        }
        return updated;
      })
    );
  }

  function stampActor(row: TRow): TRow {
    const stamped = { ...row };
    if (Object.prototype.hasOwnProperty.call(row, "createdBy")) {
      (stamped as Record<string, unknown>).createdBy = actorName;
    }
    if (Object.prototype.hasOwnProperty.call(row, "updatedBy")) {
      (stamped as Record<string, unknown>).updatedBy = actorName;
    }
    return stamped;
  }

  function addRow() {
    const next = stampActor(config.emptyRow(rows.length + 1));
    onChange(renumberLines([...rows, next]));
    if (layout === "list-drawer") setDrawerRowId(next.id);
  }

  function removeRow(id: string) {
    if (!canDelete) return;
    onChange(renumberLines(rows.filter((row) => row.id !== id)));
    if (drawerRowId === id) setDrawerRowId(null);
  }

  function requestDeletion(row: TRow) {
    if (!canRequestDeletion || !activityDeleteContext || !session) return;
    const existing = findOpenActivityDeleteRequest(
      tasks,
      activityDeleteContext.entityType,
      activityDeleteContext.entityId,
      row.id
    );
    if (existing) {
      setRequestMessage(`Deletion already requested (${existing.documentNo}). An administrator will review it.`);
      return;
    }
    const partial = buildActivityDeletionRequestTask({
      row,
      context: activityDeleteContext,
      createdByUserId: session.userId,
      createdBy: session.displayName,
      existingTasks: tasks,
    });
    const created = addTask(partial, { assigneeDisplayName: "AbilityVua Admin" });
    trackProcessExecution({
      processId: "request-activity-deletion",
      entityType: activityDeleteContext.entityType,
      entityId: activityDeleteContext.entityId,
      entityLabel: activityDeleteContext.entityLabel,
      detail: `Requested removal of ${activityDeleteContext.collectionLabel} line ${row.lineNo} (${created.documentNo})`,
    });
    setRequestMessage(`Deletion request sent (${created.documentNo}). An administrator will review and remove the line if appropriate.`);
  }

  function duplicateRow(id: string) {
    const source = rows.find((row) => row.id === id);
    if (!source) return;
    const copy = stampActor({ ...source, id: config.emptyRow(rows.length + 1).id });
    onChange(renumberLines([...rows, copy]));
    if (layout === "list-drawer") setDrawerRowId(copy.id);
  }

  const footerNote = showInlineSave
    ? "Use the save bar below to persist changes."
    : layout === "list-drawer"
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
                  <tr
                    key={row.id}
                    className={`align-top hover:bg-slate-50/80 ${
                      referenceRows && isRowDirty(row, baselineRows) ? "bg-amber-50/50" : ""
                    }`}
                  >
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
                          {canDelete ? (
                            <button
                              type="button"
                              title="Remove row"
                              onClick={() => removeRow(row.id)}
                              className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          ) : canRequestDeletion ? (
                            <button
                              type="button"
                              title="Request administrator to remove this line"
                              onClick={() => requestDeletion(row)}
                              className="rounded-md px-2 py-1 text-xs text-amber-800 hover:bg-amber-50"
                            >
                              Request deletion
                            </button>
                          ) : null}
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

      {adminOnlyDelete && !readOnly ? (
        <p className="text-xs text-slate-500">
          {canDelete
            ? "As an administrator you can remove activity lines directly."
            : canRequestDeletion
              ? "Activity lines can only be removed by an administrator. Use Request deletion to send a task to the admin team."
              : "Activity lines can only be removed by an administrator."}
        </p>
      ) : null}

      {requestMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900" role="status">
          {requestMessage}
        </p>
      ) : null}

      {showSaveBar && onSave && onDiscard ? (
        <LineItemSaveBar
          dirtyCount={resolvedDirtyCount || dirtyCount || 1}
          saveStatus={saveStatus}
          saveError={saveError}
          itemLabel={saveItemLabel}
          confirmation={saveConfirmation}
          onSave={onSave}
          onDiscard={onDiscard}
          onConfirmationDismiss={onSaveConfirmationDismiss}
        />
      ) : null}

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
            readOnly || !drawerRow || !canDelete
              ? undefined
              : () => {
                  removeRow(drawerRow.id);
                }
          }
          onRequestDeletion={
            readOnly || !drawerRow || !canRequestDeletion
              ? undefined
              : () => {
                  requestDeletion(drawerRow);
                }
          }
          deletionPending={
            drawerRow && activityDeleteContext
              ? Boolean(
                  findOpenActivityDeleteRequest(
                    tasks,
                    activityDeleteContext.entityType,
                    activityDeleteContext.entityId,
                    drawerRow.id
                  )
                )
              : false
          }
        />
      ) : null}
    </div>
  );
}
