import type { ReportColumnDef } from "@/lib/reports/types";

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCsv(
  rows: Record<string, string>[],
  columns: ReportColumnDef[]
): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvCell(row[c.id] ?? "")).join(",")
  );
  return [header, ...body].join("\r\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
