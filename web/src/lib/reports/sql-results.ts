import type { ReportResult } from "@/lib/reports/types";

function columnId(label: string, index: number) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug ? `${slug}_${index}` : `col_${index}`;
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function rowsJsonToReportResult(rows: Record<string, unknown>[]): ReportResult {
  if (!rows.length) {
    return { columns: [], rows: [] };
  }

  const keys = Object.keys(rows[0]);
  const columns = keys.map((key, index) => ({
    id: columnId(key, index),
    label: key,
  }));

  const idByKey = new Map(keys.map((key, index) => [key, columnId(key, index)]));

  const flatRows = rows.map((row) => {
    const flat: Record<string, string> = {};
    for (const key of keys) {
      flat[idByKey.get(key)!] = cellToString(row[key]);
    }
    return flat;
  });

  return { columns, rows: flatRows };
}
