/** Module groups mirror core sidebar menu areas. */
export type ReportModuleGroup = "Clients" | "Enquiries" | "Locations" | "People" | "Services";

export type ReportExportFormat = "csv";

/**
 * Registered reports for role-based access.
 * IDs are stored in app_role_report (see docs/reports/reports.json).
 */
export type AccessReport = {
  id: string;
  label: string;
  description: string;
  /** Sidebar grouping under Reports — matches a core menu area. */
  moduleGroup: ReportModuleGroup;
  /** Parent window key from access catalog (e.g. clients, employees). */
  parentModuleKey: string;
  maxColumns: number;
  exportFormats: ReportExportFormat[];
};
