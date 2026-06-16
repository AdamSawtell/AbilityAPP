export type ReportColumnDef = {
  id: string;
  label: string;
};

export type ReportResult = {
  columns: ReportColumnDef[];
  rows: Record<string, string>[];
};
