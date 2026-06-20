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
  {
    id: "enquiry-register",
    label: "Enquiry register",
    description: "Intake enquiry listing with participant details, funding, status, and activity counts.",
    moduleGroup: "Enquiries",
    parentModuleKey: "enquiries",
    maxColumns: 20,
    exportFormats: ["csv"],
  },
  {
    id: "location-register",
    label: "Location register",
    description: "Support location listing with address, capacity, and linked client, staff, and service counts.",
    moduleGroup: "Locations",
    parentModuleKey: "locations",
    maxColumns: 20,
    exportFormats: ["csv"],
  },
  {
    id: "employee-register",
    label: "Employee register",
    description: "Employee Business Partner listing with employment, contact, and compliance counts.",
    moduleGroup: "People",
    parentModuleKey: "employees",
    maxColumns: 20,
    exportFormats: ["csv"],
  },
  {
    id: "tasks-all",
    label: "Tasks — all",
    description: "Full task listing with type, assignee, linked record, status, and completion details.",
    moduleGroup: "Core",
    parentModuleKey: "tasks-all",
    maxColumns: 20,
    exportFormats: ["csv"],
  },
  {
    id: "incident-register",
    label: "Incident register",
    description: "All incident reports with status, severity, NDIS fields, and linked record IDs.",
    moduleGroup: "Core",
    parentModuleKey: "incidents",
    maxColumns: 20,
    exportFormats: ["csv"],
  },
  {
    id: "ndis-reportable-incidents",
    label: "NDIS reportable incidents",
    description:
      "Audit-ready export of NDIS reportable incidents with deadlines, notification status, and checklist completion.",
    moduleGroup: "Core",
    parentModuleKey: "incidents",
    maxColumns: 25,
    exportFormats: ["csv"],
  },
  {
    id: "incident-compliance-digest",
    label: "Incident compliance digest",
    description:
      "Weekly-style summary of open reportable incidents, overdue NDIS deadlines, and incomplete checklists.",
    moduleGroup: "Core",
    parentModuleKey: "incidents",
    maxColumns: 10,
    exportFormats: ["csv"],
  },
  {
    id: "financial-close-summary",
    label: "Financial close summary",
    description:
      "Month-end checklist for plan vs actual, NDIS remittance, participant invoices, and payroll reconciliation. Uses the current calendar month.",
    moduleGroup: "Services",
    parentModuleKey: "reports",
    maxColumns: 10,
    exportFormats: ["csv"],
  },
  {
    id: "ndis-audit-pack-summary",
    label: "NDIS audit pack summary",
    description:
      "Audit readiness manifest for participants, delivery, billing, incidents, and credentials. Uses the current calendar month.",
    moduleGroup: "Services",
    parentModuleKey: "reports",
    maxColumns: 10,
    exportFormats: ["csv"],
  },
];

export const ALL_REPORT_IDS = ACCESS_REPORTS.map((r) => r.id);

/** Reserved route slugs — must not be used as catalog report ids. */
export const RESERVED_REPORT_ROUTE_SLUGS = new Set(["advance"]);

export function reportById(id: string) {
  if (RESERVED_REPORT_ROUTE_SLUGS.has(id)) return undefined;
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
