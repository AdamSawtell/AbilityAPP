import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { IncidentRecord } from "@/lib/incident";
import type { LocationRecord } from "@/lib/location";
import type { ReportResult } from "@/lib/reports/types";
import { buildClientRegisterReport } from "@/lib/reports/runners/client-register";
import { buildEmployeeRegisterReport } from "@/lib/reports/runners/employee-register";
import { buildEnquiryRegisterReport } from "@/lib/reports/runners/enquiry-register";
import {
  buildIncidentRegisterReport,
  buildNdisReportableIncidentsReport,
} from "@/lib/reports/runners/incident-register";
import { buildLocationRegisterReport } from "@/lib/reports/runners/location-register";
import { buildTasksAllReport } from "@/lib/reports/runners/tasks-all";
import type { TaskRecord } from "@/lib/task";

export type ReportDataContext = {
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  enquiries: EnquiryRecord[];
  incidents: IncidentRecord[];
  tasks: TaskRecord[];
  users: AppUserRecord[];
  roles: AppRoleRecord[];
};

export function runReport(reportId: string, ctx: ReportDataContext): ReportResult | null {
  switch (reportId) {
    case "client-register":
      return buildClientRegisterReport(ctx.clients);
    case "employee-register":
      return buildEmployeeRegisterReport(ctx.employees);
    case "location-register":
      return buildLocationRegisterReport(ctx.locations);
    case "enquiry-register":
      return buildEnquiryRegisterReport(ctx.enquiries);
    case "incident-register":
      return buildIncidentRegisterReport(ctx.incidents);
    case "ndis-reportable-incidents":
      return buildNdisReportableIncidentsReport(ctx.incidents);
    case "tasks-all":
      return buildTasksAllReport(ctx.tasks, ctx.users, ctx.roles);
    default:
      return null;
  }
}
