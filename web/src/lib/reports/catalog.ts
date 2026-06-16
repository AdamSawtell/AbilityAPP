/**
 * Registered reports for data export and review.
 * Report IDs are stored in app_role_report.
 *
 * Human summary: docs/reports/README.md
 * Machine index: docs/reports/reports.json
 */

import type { AccessReport } from "@/lib/reports/catalog-types";

export type { AccessReport, ReportExportFormat, ReportModuleGroup } from "@/lib/reports/catalog-types";

export const ACCESS_REPORTS: AccessReport[] = [
  {
    id: "client-register",
    label: "Client register",
    description:
      "Support receiver listing with demographics, funding, risk alerts, and location counts. Up to 20 columns.",
    moduleGroup: "Clients",
    parentModuleKey: "clients",
    maxColumns: 20,
    exportFormats: ["csv"],
  },
];

export const ALL_REPORT_IDS = ACCESS_REPORTS.map((r) => r.id);

export function reportById(id: string) {
  return ACCESS_REPORTS.find((r) => r.id === id);
}

export function reportsByModuleGroup(reportIds: string[]) {
  const allowed = new Set(reportIds);
  const map = new Map<string, AccessReport[]>();
  for (const report of ACCESS_REPORTS) {
    if (!allowed.has(report.id)) continue;
    const list = map.get(report.moduleGroup) ?? [];
    list.push(report);
    map.set(report.moduleGroup, list);
  }
  return map;
}

export function canAccessReport(
  reportIds: string[],
  windowKeys: string[],
  reportId: string,
  canWindow: (key: string) => boolean
): boolean {
  if (!reportIds.includes(reportId)) return false;
  const report = reportById(reportId);
  if (!report) return false;
  if (!canWindow("reports")) return false;
  if (report.parentModuleKey && !canWindow(report.parentModuleKey)) return false;
  return true;
}
