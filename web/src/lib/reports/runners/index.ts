import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import type { ClaimRecord } from "@/lib/claim";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { IncidentRecord } from "@/lib/incident";
import type { InvoiceRecord } from "@/lib/invoice";
import type { LocationRecord } from "@/lib/location";
import type { MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";
import type { PayrollPeriodCloseRecord } from "@/lib/payroll-period-close";
import type { ReportResult } from "@/lib/reports/types";
import { buildClientRegisterReport } from "@/lib/reports/runners/client-register";
import { buildEmployeeRegisterReport } from "@/lib/reports/runners/employee-register";
import { buildEnquiryRegisterReport } from "@/lib/reports/runners/enquiry-register";
import { buildFinancialCloseSummaryReport } from "@/lib/reports/runners/financial-close-summary";
import {
  buildIncidentRegisterReport,
  buildNdisReportableIncidentsReport,
} from "@/lib/reports/runners/incident-register";
import { buildIncidentComplianceDigestReport } from "@/lib/reports/runners/incident-compliance-digest";
import { buildLocationRegisterReport } from "@/lib/reports/runners/location-register";
import { buildTasksAllReport } from "@/lib/reports/runners/tasks-all";
import type { TaskRecord } from "@/lib/task";
import type { TimesheetRecord } from "@/lib/timesheet";

export type ReportDataContext = {
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  enquiries: EnquiryRecord[];
  incidents: IncidentRecord[];
  tasks: TaskRecord[];
  users: AppUserRecord[];
  roles: AppRoleRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  timesheets: TimesheetRecord[];
  claims: ClaimRecord[];
  invoices: InvoiceRecord[];
  payrollClosedPeriods: PayrollPeriodCloseRecord[];
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
    case "incident-compliance-digest":
      return buildIncidentComplianceDigestReport(ctx.incidents);
    case "tasks-all":
      return buildTasksAllReport(ctx.tasks, ctx.users, ctx.roles);
    case "financial-close-summary":
      return buildFinancialCloseSummaryReport({
        clients: ctx.clients,
        monthlyServicePlans: ctx.monthlyServicePlans,
        timesheets: ctx.timesheets,
        claims: ctx.claims,
        invoices: ctx.invoices,
        payrollClosedPeriods: ctx.payrollClosedPeriods,
      });
    default:
      return null;
  }
}
