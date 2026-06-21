import type { ClaimRecord } from "@/lib/claim";
import { buildClaimReconcileRows } from "@/lib/claim-reconciliation";
import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import { evaluateFinancialClose, type FinancialCloseContext } from "@/lib/financial-close";
import type { FinancialClosedMonthRecord } from "@/lib/financial-close-period";
import type { IncidentRecord } from "@/lib/incident";
import { isNdisReportOverdue } from "@/lib/incident";
import type { InvoiceRecord } from "@/lib/invoice";
import type { LocationRecord } from "@/lib/location";
import { currentPlanMonthIso, type MonthlyServicePlanRecord } from "@/lib/monthly-service-plan";
import {
  buildPlanVsActualRows,
  planMonthDateRange,
  planVsActualCsv,
  type PlanVsActualContext,
} from "@/lib/plan-vs-actual-reconciliation";
import type { PayrollPeriodCloseRecord } from "@/lib/payroll-period-close";
import { rowsToCsv } from "@/lib/reports/export";
import { buildNdisReportableIncidentsReport } from "@/lib/reports/runners/incident-register";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import type { TimesheetRecord } from "@/lib/timesheet";
import { verifyTimesheet } from "@/lib/timesheet-verification";

export type AuditPackSectionStatus = "pass" | "warning" | "block" | "info";

export type AuditPackSection = {
  code: string;
  label: string;
  description: string;
  status: AuditPackSectionStatus;
  message: string;
  rowCount: number;
  href?: string;
};

export type AuditPackContext = {
  clients: ClientRecord[];
  employees: EmployeeRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  incidents: IncidentRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  timesheets: TimesheetRecord[];
  rosterShifts: RosterShiftRecord[];
  locations: LocationRecord[];
  claims: ClaimRecord[];
  invoices: InvoiceRecord[];
  payrollClosedPeriods: PayrollPeriodCloseRecord[];
  financialClosedMonths: FinancialClosedMonthRecord[];
};

export type AuditPackEvaluation = {
  auditMonth: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  sections: AuditPackSection[];
  readyForAudit: boolean;
  summary: {
    participantCount: number;
    agreementCount: number;
    timesheetCount: number;
    claimCount: number;
    invoiceCount: number;
    reportableIncidentCount: number;
    credentialAlertCount: number;
  };
};

function dateInPeriod(date: string, periodStart: string, periodEnd: string): boolean {
  if (!date?.trim()) return false;
  const day = date.slice(0, 10);
  return day >= periodStart && day <= periodEnd;
}

function periodOverlapsMonth(start: string, end: string, month: string): boolean {
  if (!month?.trim()) return true;
  const startMonth = start?.slice(0, 7) ?? "";
  const endMonth = end?.slice(0, 7) ?? startMonth;
  if (startMonth === month || endMonth === month) return true;
  if (!startMonth || !endMonth) return false;
  return startMonth <= month && endMonth >= month;
}

function activeClients(clients: ClientRecord[]): ClientRecord[] {
  return clients.filter((client) => client.status !== "Inactive" && client.lifecycleStatus !== "Exit");
}

function participantsForAuditPeriod(
  ctx: AuditPackContext,
  month: string,
  periodStart: string,
  periodEnd: string
): ClientRecord[] {
  const ids = new Set<string>();

  for (const plan of ctx.monthlyServicePlans) {
    if (plan.planMonth === month && plan.clientId?.trim()) ids.add(plan.clientId);
  }

  for (const sheet of ctx.timesheets) {
    if (sheet.status !== "Approved") continue;
    for (const line of sheet.lines) {
      if (line.clientId?.trim() && dateInPeriod(line.shiftDate, periodStart, periodEnd)) {
        ids.add(line.clientId);
      }
    }
  }

  for (const claim of ctx.claims) {
    if (claim.clientId?.trim() && periodOverlapsMonth(claim.periodStart, claim.periodEnd, month)) {
      ids.add(claim.clientId);
    }
  }

  for (const invoice of ctx.invoices) {
    if (invoice.clientId?.trim() && periodOverlapsMonth(invoice.periodStart, invoice.periodEnd, month)) {
      ids.add(invoice.clientId);
    }
  }

  if (!ids.size) return activeClients(ctx.clients);
  return ctx.clients.filter((client) => ids.has(client.id));
}

function activeEmployees(employees: EmployeeRecord[]): EmployeeRecord[] {
  return employees.filter((employee) => {
    const status = employee.employmentStatus?.trim().toLowerCase() ?? "";
    return status !== "terminated" && status !== "inactive";
  });
}

function agreementsForPeriod(agreements: ServiceAgreementRecord[], periodStart: string, periodEnd: string): ServiceAgreementRecord[] {
  return agreements.filter((agreement) => {
    if (!["Signed", "Active"].includes(agreement.status)) return false;
    const finish = agreement.finishDate?.slice(0, 10);
    const start = agreement.contractDate?.slice(0, 10) || agreement.executionDate?.slice(0, 10);
    if (finish && finish < periodStart) return false;
    if (start && start > periodEnd) return false;
    return true;
  });
}

function timesheetsForPeriod(timesheets: TimesheetRecord[], periodStart: string, periodEnd: string): TimesheetRecord[] {
  return timesheets.filter((sheet) => {
    if (sheet.status !== "Approved") return false;
    const start = sheet.periodStart?.slice(0, 10) ?? "";
    const end = sheet.periodEnd?.slice(0, 10) ?? start;
    return start <= periodEnd && end >= periodStart;
  });
}

function incidentsForPeriod(incidents: IncidentRecord[], periodStart: string, periodEnd: string): IncidentRecord[] {
  return incidents.filter((incident) => dateInPeriod(incident.occurredAt || incident.reportedAt, periodStart, periodEnd));
}

function credentialAlerts(employees: EmployeeRecord[], asOf: string): { employee: EmployeeRecord; credentialType: string; expiryDate: string }[] {
  const alerts: { employee: EmployeeRecord; credentialType: string; expiryDate: string }[] = [];
  const asOfDate = asOf.slice(0, 10);
  const warnBefore = new Date(`${asOfDate}T12:00:00`);
  warnBefore.setDate(warnBefore.getDate() + 90);
  const warnIso = warnBefore.toISOString().slice(0, 10);

  for (const employee of activeEmployees(employees)) {
    for (const credential of employee.credentials ?? []) {
      const expiry = credential.expiryDate?.slice(0, 10);
      if (!expiry) continue;
      if (expiry <= warnIso) {
        alerts.push({ employee, credentialType: credential.credentialType, expiryDate: expiry });
      }
    }
  }
  return alerts;
}

function timesheetsWithVerificationIssues(
  timesheets: TimesheetRecord[],
  rosterShifts: RosterShiftRecord[],
  locations: LocationRecord[]
): TimesheetRecord[] {
  return timesheets.filter((sheet) => {
    const summary = verifyTimesheet(sheet, rosterShifts, locations);
    return summary.lines.some((line) => line.status !== "verified" && line.status !== "no-roster-link");
  });
}

export function evaluateAuditPack(ctx: AuditPackContext, auditMonth: string): AuditPackEvaluation {
  const month = auditMonth?.trim() || currentPlanMonthIso();
  const { start: periodStart, end: periodEnd } = planMonthDateRange(month);
  const generatedAt = new Date().toISOString();

  const participants = participantsForAuditPeriod(ctx, month, periodStart, periodEnd);
  const agreements = agreementsForPeriod(ctx.serviceAgreements, periodStart, periodEnd);
  const timesheets = timesheetsForPeriod(ctx.timesheets, periodStart, periodEnd);
  const unverifiedTimesheets = timesheetsWithVerificationIssues(timesheets, ctx.rosterShifts, ctx.locations);
  const claimRows = buildClaimReconcileRows(ctx.claims, month);
  const claimGaps = claimRows.filter(
    (row) => row.remittanceStatus === "Not imported" || row.remittanceStatus === "Variance" || row.remittanceStatus === "Partial"
  );
  const invoices = ctx.invoices.filter(
    (invoice) =>
      periodOverlapsMonth(invoice.periodStart, invoice.periodEnd, month) &&
      (invoice.status === "Sent" || invoice.status === "Paid")
  );
  const draftInvoices = ctx.invoices.filter(
    (invoice) => invoice.status === "Draft" && periodOverlapsMonth(invoice.periodStart, invoice.periodEnd, month)
  );
  const periodIncidents = incidentsForPeriod(ctx.incidents, periodStart, periodEnd);
  const reportableIncidents = periodIncidents.filter((incident) => incident.isReportable);
  const overdueReportable = reportableIncidents.filter(isNdisReportOverdue);
  const credentials = credentialAlerts(ctx.employees, periodEnd);

  const planCtx: PlanVsActualContext = {
    clients: ctx.clients,
    monthlyServicePlans: ctx.monthlyServicePlans,
    timesheets: ctx.timesheets,
    claims: ctx.claims,
    invoices: ctx.invoices,
    rosterShifts: ctx.rosterShifts,
  };
  const planRows = buildPlanVsActualRows(planCtx, month);
  const planVariance = planRows.filter((row) => row.reconcileStatus === "Variance");

  const financialCtx: FinancialCloseContext = {
    clients: ctx.clients,
    monthlyServicePlans: ctx.monthlyServicePlans,
    timesheets: ctx.timesheets,
    claims: ctx.claims,
    invoices: ctx.invoices,
    payrollClosedPeriods: ctx.payrollClosedPeriods,
    financialClosedMonths: ctx.financialClosedMonths,
    rosterShifts: ctx.rosterShifts,
  };
  const financialClose = evaluateFinancialClose(financialCtx, month);

  const sections: AuditPackSection[] = [
    {
      code: "participants",
      label: "Active participants",
      description: "Support receivers active during the audit period.",
      status: participants.length ? "pass" : "warning",
      message: `${participants.length} active participant${participants.length === 1 ? "" : "s"}.`,
      rowCount: participants.length,
      href: "/clients",
    },
    {
      code: "agreements",
      label: "Service agreements",
      description: "Signed or active agreements covering the audit period.",
      status: agreements.length ? "pass" : "warning",
      message: `${agreements.length} agreement${agreements.length === 1 ? "" : "s"} active in period.`,
      rowCount: agreements.length,
      href: "/service-agreements",
    },
    {
      code: "timesheets",
      label: "Approved timesheets",
      description: "Approved delivery records with shift verification status.",
      status: unverifiedTimesheets.length ? "block" : timesheets.length ? "pass" : "warning",
      message: unverifiedTimesheets.length
        ? `${unverifiedTimesheets.length} approved timesheet${unverifiedTimesheets.length === 1 ? "" : "s"} still unverified.`
        : `${timesheets.length} approved timesheet${timesheets.length === 1 ? "" : "s"} in period.`,
      rowCount: timesheets.length,
      href: "/timesheets",
    },
    {
      code: "claims",
      label: "NDIS claims",
      description: "Submitted claims and remittance match status.",
      status: claimGaps.length ? "block" : claimRows.length ? "pass" : "info",
      message: claimGaps.length
        ? `${claimGaps.length} claim${claimGaps.length === 1 ? "" : "s"} with remittance gaps.`
        : `${claimRows.length} submitted claim${claimRows.length === 1 ? "" : "s"} in period.`,
      rowCount: claimRows.length,
      href: "/claim-reconciliation",
    },
    {
      code: "invoices",
      label: "Participant invoices",
      description: "Sent or paid plan-managed and self-managed invoices.",
      status: draftInvoices.length ? "warning" : invoices.length ? "pass" : "info",
      message: draftInvoices.length
        ? `${draftInvoices.length} draft invoice${draftInvoices.length === 1 ? "" : "s"} remain for the period.`
        : `${invoices.length} sent or paid invoice${invoices.length === 1 ? "" : "s"}.`,
      rowCount: invoices.length,
      href: "/invoices",
    },
    {
      code: "incidents",
      label: "Reportable incidents",
      description: "NDIS reportable incidents occurring in the audit period.",
      status: overdueReportable.length ? "block" : reportableIncidents.length ? "warning" : "pass",
      message: overdueReportable.length
        ? `${overdueReportable.length} overdue NDIS reportable incident${overdueReportable.length === 1 ? "" : "s"}.`
        : `${reportableIncidents.length} reportable incident${reportableIncidents.length === 1 ? "" : "s"} in period.`,
      rowCount: reportableIncidents.length,
      href: "/incidents/compliance",
    },
    {
      code: "plan-reconciliation",
      label: "Plan vs actual",
      description: "Monthly service plan delivery compared to billed amounts.",
      status: planVariance.length ? "block" : planRows.length ? "pass" : "info",
      message: planVariance.length
        ? `${planVariance.length} participant${planVariance.length === 1 ? "" : "s"} with plan variance.`
        : `${planRows.length} reconciliation row${planRows.length === 1 ? "" : "s"}.`,
      rowCount: planRows.length,
      href: "/plan-reconciliation",
    },
    {
      code: "financial-close",
      label: "Financial close",
      description: "Month-end billing and payroll close readiness.",
      status: financialClose.readyToClose ? "pass" : "block",
      message: financialClose.readyToClose
        ? "Financial close checks passed for this month."
        : "Financial close blocked — resolve checklist items.",
      rowCount: financialClose.checks.length,
      href: "/financial-close",
    },
    {
      code: "credentials",
      label: "Worker credentials",
      description: "Credentials expiring within 90 days or already expired.",
      status: credentials.some((row) => row.expiryDate < periodEnd) ? "block" : credentials.length ? "warning" : "pass",
      message: credentials.length
        ? `${credentials.length} credential${credentials.length === 1 ? "" : "s"} expiring soon or expired.`
        : "No credential expiry alerts.",
      rowCount: credentials.length,
      href: "/employees",
    },
  ];

  const readyForAudit = sections.every((section) => section.status !== "block");

  return {
    auditMonth: month,
    periodStart,
    periodEnd,
    generatedAt,
    sections,
    readyForAudit,
    summary: {
      participantCount: participants.length,
      agreementCount: agreements.length,
      timesheetCount: timesheets.length,
      claimCount: claimRows.length,
      invoiceCount: invoices.length,
      reportableIncidentCount: reportableIncidents.length,
      credentialAlertCount: credentials.length,
    },
  };
}

export function auditPackStatusClass(status: AuditPackSectionStatus): string {
  switch (status) {
    case "pass":
      return "bg-emerald-100 text-emerald-950";
    case "warning":
      return "bg-amber-100 text-amber-950";
    case "block":
      return "bg-rose-100 text-rose-950";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function auditPackManifestCsv(evaluation: AuditPackEvaluation): string {
  const header = ["AuditMonth", "Section", "Status", "RowCount", "Message", "Link"].join(",");
  const lines = evaluation.sections.map((section) =>
    [
      evaluation.auditMonth,
      `"${section.label.replace(/"/g, '""')}"`,
      section.status,
      String(section.rowCount),
      `"${section.message.replace(/"/g, '""')}"`,
      section.href ?? "",
    ].join(",")
  );
  return [header, ...lines].join("\r\n");
}

export function auditPackSectionCsv(ctx: AuditPackContext, evaluation: AuditPackEvaluation, sectionCode: string): string | null {
  const { periodStart, periodEnd } = evaluation;
  const month = evaluation.auditMonth;

  switch (sectionCode) {
    case "participants": {
      const rows = participantsForAuditPeriod(ctx, month, periodStart, periodEnd).map((client) => ({
        searchKey: client.searchKey,
        name: client.name,
        status: client.status,
        lifecycle: client.lifecycleStatus,
        fundingBody: client.fundingBody,
        ndisNumber: client.fundingBodyNumber,
      }));
      return rowsToCsv(rows, [
        { id: "searchKey", label: "Search key" },
        { id: "name", label: "Name" },
        { id: "status", label: "Status" },
        { id: "lifecycle", label: "Lifecycle" },
        { id: "fundingBody", label: "Funding body" },
        { id: "ndisNumber", label: "NDIS number" },
      ]);
    }
    case "agreements": {
      const rows = agreementsForPeriod(ctx.serviceAgreements, periodStart, periodEnd).map((agreement) => ({
        documentNo: agreement.searchKey,
        name: agreement.name,
        clientId: agreement.clientId,
        status: agreement.status,
        contractDate: agreement.contractDate,
        finishDate: agreement.finishDate,
        signedAt: agreement.signedAt,
      }));
      return rowsToCsv(rows, [
        { id: "documentNo", label: "Document" },
        { id: "name", label: "Name" },
        { id: "clientId", label: "Client ID" },
        { id: "status", label: "Status" },
        { id: "contractDate", label: "Contract date" },
        { id: "finishDate", label: "Finish date" },
        { id: "signedAt", label: "Signed at" },
      ]);
    }
    case "timesheets": {
      const rows = timesheetsForPeriod(ctx.timesheets, periodStart, periodEnd).map((sheet) => {
        const summary = verifyTimesheet(sheet, ctx.rosterShifts, ctx.locations);
        return {
          documentNo: sheet.documentNo,
          employeeId: sheet.employeeId,
          periodStart: sheet.periodStart,
          periodEnd: sheet.periodEnd,
          status: sheet.status,
          verifiedLines: String(summary.verifiedCount),
          issueLines: String(summary.issueCount),
          totalHours: String(sheet.totalHours ?? 0),
          payrollExportStatus: sheet.payrollExportStatus,
        };
      });
      return rowsToCsv(rows, [
        { id: "documentNo", label: "Document" },
        { id: "employeeId", label: "Employee ID" },
        { id: "periodStart", label: "Period start" },
        { id: "periodEnd", label: "Period end" },
        { id: "status", label: "Status" },
        { id: "verifiedLines", label: "Verified lines" },
        { id: "issueLines", label: "Issue lines" },
        { id: "totalHours", label: "Total hours" },
        { id: "payrollExportStatus", label: "Payroll export" },
      ]);
    }
    case "claims": {
      const claimRows = buildClaimReconcileRows(ctx.claims, month);
      const header = ["Document", "ClientId", "Claimed", "Paid", "RemittanceStatus", "Message"].join(",");
      const lines = claimRows.map((row) =>
        [row.documentNo, row.clientId, row.claimedAmount.toFixed(2), row.paidAmount.toFixed(2), row.remittanceStatus, `"${row.reconcileMessage.replace(/"/g, '""')}"`].join(",")
      );
      return [header, ...lines].join("\r\n");
    }
    case "invoices": {
      const rows = ctx.invoices
        .filter((invoice) => periodOverlapsMonth(invoice.periodStart, invoice.periodEnd, month))
        .map((invoice) => ({
          documentNo: invoice.documentNo,
          clientId: invoice.clientId,
          status: invoice.status,
          periodStart: invoice.periodStart,
          periodEnd: invoice.periodEnd,
          totalAmount: String(invoice.totalAmount ?? 0),
        }));
      return rowsToCsv(rows, [
        { id: "documentNo", label: "Document" },
        { id: "clientId", label: "Client ID" },
        { id: "status", label: "Status" },
        { id: "periodStart", label: "Period start" },
        { id: "periodEnd", label: "Period end" },
        { id: "totalAmount", label: "Total amount" },
      ]);
    }
    case "incidents": {
      const report = buildNdisReportableIncidentsReport(
        incidentsForPeriod(ctx.incidents, periodStart, periodEnd).filter((incident) => incident.isReportable)
      );
      return rowsToCsv(report.rows, report.columns);
    }
    case "plan-reconciliation": {
      const planCtx: PlanVsActualContext = {
        clients: ctx.clients,
        monthlyServicePlans: ctx.monthlyServicePlans,
        timesheets: ctx.timesheets,
        claims: ctx.claims,
        invoices: ctx.invoices,
        rosterShifts: ctx.rosterShifts,
      };
      return planVsActualCsv(buildPlanVsActualRows(planCtx, month), ctx.clients);
    }
    case "financial-close": {
      const financialCtx: FinancialCloseContext = {
        clients: ctx.clients,
        monthlyServicePlans: ctx.monthlyServicePlans,
        timesheets: ctx.timesheets,
        claims: ctx.claims,
        invoices: ctx.invoices,
        payrollClosedPeriods: ctx.payrollClosedPeriods,
        financialClosedMonths: ctx.financialClosedMonths,
        rosterShifts: ctx.rosterShifts,
      };
      const close = evaluateFinancialClose(financialCtx, month);
      const header = ["Check", "Status", "Message", "Count"].join(",");
      const lines = close.checks.map((check) =>
        [`"${check.label.replace(/"/g, '""')}"`, check.status, `"${check.message.replace(/"/g, '""')}"`, check.count ?? ""].join(",")
      );
      return [header, ...lines].join("\r\n");
    }
    case "credentials": {
      const rows = credentialAlerts(ctx.employees, periodEnd).map((row) => ({
        employeeId: row.employee.id,
        employeeName: row.employee.name,
        credentialType: row.credentialType,
        expiryDate: row.expiryDate,
      }));
      return rowsToCsv(rows, [
        { id: "employeeId", label: "Employee ID" },
        { id: "employeeName", label: "Employee name" },
        { id: "credentialType", label: "Credential type" },
        { id: "expiryDate", label: "Expiry date" },
      ]);
    }
    default:
      return null;
  }
}
