"use client";

type DropdownMap = Record<string, string[]>;

export type LineCellColumn<TRow extends { id: string }> = {
  key: keyof TRow & string;
  label: string;
  type: string;
  optionsKey?: string;
  required?: boolean;
  className?: string;
};

export function formatLineCellValue<TRow extends { id: string }>(
  column: LineCellColumn<TRow>,
  row: TRow,
  dropdowns: DropdownMap,
  optionLabels?: Record<string, string>
): string {
  const value = row[column.key as keyof TRow];
  if (column.type === "checkbox") return Boolean(value) ? "Yes" : "No";
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  if (column.type === "select" && optionLabels?.[raw]) return optionLabels[raw];
  return raw;
}

export function LineCellInput<TRow extends { id: string }, TColumn extends LineCellColumn<TRow>>({
  column,
  row,
  onChange,
  dropdowns,
  optionLabels,
  readOnly,
  stacked = false,
}: {
  column: TColumn;
  row: TRow;
  onChange: (value: string | number | boolean) => void;
  dropdowns: DropdownMap;
  optionLabels?: Record<string, string>;
  readOnly?: boolean;
  /** Vertical form layout — full width fields in drawer */
  stacked?: boolean;
}) {
  const base =
    "w-full min-w-0 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-[#d4147a] focus:ring-1 focus:ring-[#d4147a]/30";
  const stackedBase = stacked ? "rounded-lg px-3 py-2 shadow-sm" : base;
  const value = row[column.key as keyof TRow];
  const disabledClass = readOnly ? " bg-slate-50 text-slate-600" : "";

  if (readOnly) {
    const display = formatLineCellValue(column, row, dropdowns, optionLabels);
    return (
      <span className={`block text-sm text-slate-700 ${stacked ? "px-0 py-0.5" : "px-1 py-1.5"}`}>{display}</span>
    );
  }

  if (column.type === "number") {
    return (
      <input
        className={`${stackedBase} ${stacked ? "" : "w-12 text-center"}${disabledClass}`}
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
        className={stackedBase}
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
        className={stackedBase}
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
        className={`${stackedBase} min-h-[88px] resize-y${disabledClass}`}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
        rows={stacked ? 4 : 2}
      />
    );
  }

  return (
    <input
      className={stackedBase}
      type="text"
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
