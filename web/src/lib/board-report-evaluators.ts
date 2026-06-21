import { buildClaimReconcileRows } from "@/lib/claim-reconciliation";
import type { BoardReportMetric, BoardReportPackSection, BoardReportSectionSnapshot, BoardReportTrafficLight } from "@/lib/board-report-pack";
import { evaluateFinancialClose, type FinancialCloseContext } from "@/lib/financial-close";
import { isFinancialMonthClosed } from "@/lib/financial-close-period";
import { buildIncidentDashboardMetrics, type IncidentDateRange } from "@/lib/incident-analytics";
import { isNdisReportOverdue } from "@/lib/incident";
import { evaluateAuditPack, type AuditPackContext } from "@/lib/ndis-audit-pack";
import { buildPlanVsActualRows, planMonthDateRange, type PlanVsActualContext } from "@/lib/plan-vs-actual-reconciliation";
import { complianceSummary } from "@/lib/employee-compliance";
import type { ProductRecord } from "@/lib/product";
import type { PriceListRecord } from "@/lib/product";
import { verifyTimesheet } from "@/lib/timesheet-verification";

export type BoardReportEvalContext = AuditPackContext &
  PlanVsActualContext &
  FinancialCloseContext & {
    claimRemittances?: import("@/lib/claim-remittance").ClaimRemittanceRecord[];
    serviceBookings: import("@/lib/service-booking").ServiceBookingRecord[];
    products: ProductRecord[];
    priceLists: PriceListRecord[];
  };

function periodRange(reportPeriod: string): IncidentDateRange {
  const { start, end } = planMonthDateRange(reportPeriod);
  return { from: start, to: end };
}

function worstLight(lights: BoardReportTrafficLight[]): BoardReportTrafficLight {
  if (lights.includes("red")) return "red";
  if (lights.includes("amber")) return "amber";
  if (lights.includes("green")) return "green";
  return "none";
}

function sectionResult(
  trafficLight: BoardReportTrafficLight,
  statusMessage: string,
  snapshot: BoardReportSectionSnapshot
): Pick<BoardReportPackSection, "trafficLight" | "statusMessage" | "snapshot"> {
  return { trafficLight, statusMessage, snapshot };
}

export function evaluateBoardReportSection(
  sectionCode: string,
  ctx: BoardReportEvalContext,
  reportPeriod: string
): Pick<BoardReportPackSection, "trafficLight" | "statusMessage" | "snapshot"> {
  const range = periodRange(reportPeriod);
  const activeClients = ctx.clients.filter((c) => c.status !== "Inactive" && c.lifecycleStatus !== "Exit");
  const activeEmployees = ctx.employees.filter((e) => e.employmentStatus === "Active");
  const periodClaims = ctx.claims.filter((c) => c.periodStart?.slice(0, 7) === reportPeriod || c.periodEnd?.slice(0, 7) === reportPeriod);
  const periodInvoices = ctx.invoices.filter((i) => i.periodStart?.slice(0, 7) === reportPeriod || i.periodEnd?.slice(0, 7) === reportPeriod);
  const periodTimesheets = ctx.timesheets.filter((t) => t.periodStart?.slice(0, 7) === reportPeriod || t.periodEnd?.slice(0, 7) === reportPeriod);
  const periodShifts = ctx.rosterShifts.filter((s) => s.shiftDate?.slice(0, 7) === reportPeriod);
  const periodIncidents = ctx.incidents.filter((i) => i.occurredAt?.slice(0, 7) === reportPeriod);
  const auditPack = evaluateAuditPack(ctx, reportPeriod);
  const financialClose = evaluateFinancialClose(ctx, reportPeriod);
  const planRows = buildPlanVsActualRows(ctx, reportPeriod);

  switch (sectionCode) {
    case "executive-summary": {
      const metrics: BoardReportMetric[] = [
        { label: "Active participants", value: String(activeClients.length), trafficLight: "green" },
        { label: "Active staff", value: String(activeEmployees.length), trafficLight: "green" },
        { label: "Incidents (period)", value: String(periodIncidents.length), trafficLight: periodIncidents.length > 5 ? "amber" : "green" },
        { label: "Financial close ready", value: financialClose.readyToClose ? "Yes" : "No", trafficLight: financialClose.readyToClose ? "green" : "amber" },
        { label: "Audit pack ready", value: auditPack.readyForAudit ? "Yes" : "No", trafficLight: auditPack.readyForAudit ? "green" : "amber" },
      ];
      return sectionResult(worstLight(metrics.map((m) => m.trafficLight ?? "none")), "Executive overview for the reporting period.", {
        metrics,
        tables: [],
        bullets: auditPack.sections.slice(0, 4).map((s) => `${s.label}: ${s.message}`),
      });
    }
    case "organisational-performance": {
      const bookings = ctx.serviceBookings.filter((b) => b.datePromised?.slice(0, 7) === reportPeriod);
      const metrics: BoardReportMetric[] = [
        { label: "Service bookings", value: String(bookings.length) },
        { label: "Active agreements", value: String(ctx.serviceAgreements.filter((a) => a.status === "Active").length) },
        { label: "Locations", value: String(ctx.locations.length) },
        { label: "Roster shifts", value: String(periodShifts.length) },
      ];
      return sectionResult("green", "Operational volume indicators for the period.", { metrics, tables: [], bullets: [] });
    }
    case "participant-overview": {
      const withAlerts = activeClients.filter((c) => c.alerts.some((a) => a.showAsAlert === "Yes")).length;
      const metrics: BoardReportMetric[] = [
        { label: "Active participants", value: String(activeClients.length), trafficLight: "green" },
        { label: "Participants with alerts", value: String(withAlerts), trafficLight: withAlerts > 0 ? "amber" : "green" },
        { label: "Monthly service plans", value: String(ctx.monthlyServicePlans.filter((p) => p.planMonth === reportPeriod).length) },
      ];
      return sectionResult(withAlerts > 3 ? "amber" : "green", "Participant cohort overview.", {
        metrics,
        tables: [
          {
            title: "Top participants by plan activity",
            headers: ["Participant", "Plans", "Bookings"],
            rows: activeClients.slice(0, 8).map((c) => [
              c.searchKey,
              String(ctx.monthlyServicePlans.filter((p) => p.clientId === c.id && p.planMonth === reportPeriod).length),
              String(ctx.serviceBookings.filter((b) => b.clientId === c.id).length),
            ]),
          },
        ],
        bullets: [],
      });
    }
    case "ndis-revenue-claims": {
      const claimTotal = periodClaims.reduce((sum, c) => sum + (c.totalAmount || 0), 0);
      const remittanceGaps = buildClaimReconcileRows(ctx.claims, reportPeriod).filter((r) => r.remittanceStatus !== "Matched").length;
      const metrics: BoardReportMetric[] = [
        { label: "Claims (period)", value: String(periodClaims.length) },
        { label: "Claim value", value: `$${claimTotal.toFixed(2)}` },
        { label: "Remittance gaps", value: String(remittanceGaps), trafficLight: remittanceGaps ? "amber" : "green" },
        { label: "Invoices (period)", value: String(periodInvoices.length) },
      ];
      return sectionResult(remittanceGaps ? "amber" : "green", "NDIS billing and claims activity.", { metrics, tables: [], bullets: [] });
    }
    case "service-delivery": {
      const approvedSheets = periodTimesheets.filter((t) => t.status === "Approved" || t.status === "Exported");
      let unverified = 0;
      for (const sheet of approvedSheets) {
        const v = verifyTimesheet(sheet, ctx.rosterShifts, ctx.locations);
        if (v.issueCount > 0) unverified++;
      }
      const metrics: BoardReportMetric[] = [
        { label: "Timesheets", value: String(periodTimesheets.length) },
        { label: "Approved / exported", value: String(approvedSheets.length) },
        { label: "Unverified approved", value: String(unverified), trafficLight: unverified ? "red" : "green" },
      ];
      return sectionResult(unverified ? "red" : "green", "Service delivery and timesheet verification.", { metrics, tables: [], bullets: [] });
    }
    case "rostering-workforce": {
      const credAlerts = activeEmployees.filter((e) => complianceSummary(e).level !== "ok").length;
      const openShifts = periodShifts.filter((s) => !s.employeeId?.trim()).length;
      const metrics: BoardReportMetric[] = [
        { label: "Roster shifts", value: String(periodShifts.length) },
        { label: "Unassigned shifts", value: String(openShifts), trafficLight: openShifts ? "amber" : "green" },
        { label: "Credential alerts", value: String(credAlerts), trafficLight: credAlerts ? "amber" : "green" },
        { label: "Active employees", value: String(activeEmployees.length) },
      ];
      return sectionResult(worstLight(metrics.map((m) => m.trafficLight ?? "none")), "Workforce and roster coverage.", { metrics, tables: [], bullets: [] });
    }
    case "incidents-risk": {
      const overdue = ctx.incidents.filter((i) => isNdisReportOverdue(i)).length;
      const open = ctx.incidents.filter((i) => i.status !== "Closed").length;
      const dashboard = buildIncidentDashboardMetrics(ctx.incidents, range, "monthly", ctx);
      const metrics: BoardReportMetric[] = [
        { label: "Incidents (period)", value: String(periodIncidents.length) },
        { label: "Open investigations", value: String(open), trafficLight: open > 3 ? "amber" : "green" },
        { label: "NDIS overdue", value: String(overdue), trafficLight: overdue ? "red" : "green" },
      ];
      return sectionResult(overdue ? "red" : open > 3 ? "amber" : "green", "Incident and risk profile.", {
        metrics,
        tables: [
          {
            title: "Incidents by status",
            headers: ["Status", "Count"],
            rows: dashboard.byStatus.map((r) => [r.label, String(r.count)]),
          },
        ],
        bullets: dashboard.overdue.slice(0, 5).map((r) => `${r.documentNo}: ${r.reason}`),
      });
    }
    case "complaints-feedback":
      return sectionResult("none", "Complaints module not yet integrated — complete manually.", {
        metrics: [{ label: "Complaints logged", value: "—" }],
        tables: [],
        bullets: ["Add complaints register summary when the module is available.", "Include participant feedback themes from quality review."],
      });
    case "restrictive-practices": {
      const rpCount = activeClients.reduce((sum, c) => sum + (c.restrictivePractices?.length ?? 0), 0);
      const activeAlerts = activeClients.reduce(
        (sum, c) => sum + (c.restrictivePractices?.filter((r) => r.showAsAlert === "Yes").length ?? 0),
        0
      );
      const metrics: BoardReportMetric[] = [
        { label: "Registered practices", value: String(rpCount) },
        { label: "Active alerts", value: String(activeAlerts), trafficLight: activeAlerts ? "amber" : "green" },
      ];
      return sectionResult(activeAlerts ? "amber" : "green", "Restrictive practices register.", { metrics, tables: [], bullets: [] });
    }
    case "compliance-quality": {
      const blocked = auditPack.sections.filter((s) => s.status === "block").length;
      const warnings = auditPack.sections.filter((s) => s.status === "warning").length;
      const metrics: BoardReportMetric[] = [
        { label: "Audit sections blocked", value: String(blocked), trafficLight: blocked ? "red" : "green" },
        { label: "Audit warnings", value: String(warnings), trafficLight: warnings ? "amber" : "green" },
        { label: "Reportable incidents", value: String(auditPack.summary.reportableIncidentCount) },
      ];
      return sectionResult(blocked ? "red" : warnings ? "amber" : "green", "Compliance and audit readiness.", {
        metrics,
        tables: [],
        bullets: auditPack.sections.filter((s) => s.status !== "pass").map((s) => `${s.label}: ${s.message}`),
      });
    }
    case "plan-utilisation": {
      const over = planRows.filter((r) => r.hoursVariance < -5).length;
      const metrics: BoardReportMetric[] = [
        { label: "Participants with plans", value: String(planRows.length) },
        { label: "Material under-delivery", value: String(over), trafficLight: over ? "amber" : "green" },
      ];
      return sectionResult(over ? "amber" : "green", "Plan utilisation vs scheduled delivery.", {
        metrics,
        tables: [
          {
            title: "Plan vs actual (top variances)",
            headers: ["Participant", "Scheduled h", "Delivered h", "Variance h"],
            rows: planRows.slice(0, 8).map((r) => {
              const client = ctx.clients.find((c) => c.id === r.clientId);
              return [
                client ? `${client.searchKey} — ${client.name}` : r.clientId,
                String(r.scheduledHours),
                String(r.actualHours),
                String(r.hoursVariance),
              ];
            }),
          },
        ],
        bullets: [],
      });
    }
    case "financial-summary": {
      const closed = isFinancialMonthClosed(reportPeriod, ctx.financialClosedMonths);
      const unpaidInvoices = periodInvoices.filter((i) => i.paymentStatus === "Unpaid").length;
      const metrics: BoardReportMetric[] = [
        { label: "Month closed", value: closed ? "Yes" : "No", trafficLight: closed ? "green" : "amber" },
        { label: "Close checklist", value: financialClose.readyToClose ? "Pass" : "Blocked", trafficLight: financialClose.readyToClose ? "green" : "red" },
        { label: "Unpaid invoices", value: String(unpaidInvoices), trafficLight: unpaidInvoices ? "amber" : "green" },
      ];
      return sectionResult(financialClose.readyToClose ? "green" : "amber", "Financial month-end position.", {
        metrics,
        tables: [],
        bullets: financialClose.checks.filter((c) => c.status !== "pass").map((c) => c.label),
      });
    }
    case "operational-issues":
    case "strategic-projects":
    case "ceo-commentary":
    case "key-decisions":
      return sectionResult("none", "Manual section — add commentary before publishing.", {
        metrics: [],
        tables: [],
        bullets: ["Complete this section with executive commentary before the board meeting."],
      });
    case "appendices":
      return sectionResult("none", "Supporting reference tables.", {
        metrics: [],
        tables: [
          {
            title: "Active service agreements",
            headers: ["Agreement", "Client", "Status"],
            rows: ctx.serviceAgreements.slice(0, 15).map((a) => [a.searchKey, a.clientId, a.status]),
          },
        ],
        bullets: [],
      });
    default:
      return sectionResult("none", "Section not configured.", { metrics: [], tables: [], bullets: [] });
  }
}

export function refreshBoardReportPackSections(
  pack: { sections: BoardReportPackSection[] },
  ctx: BoardReportEvalContext,
  reportPeriod: string
): BoardReportPackSection[] {
  return pack.sections.map((section) => {
    const evaluated = evaluateBoardReportSection(section.sectionCode, ctx, reportPeriod);
    return {
      ...section,
      trafficLight: evaluated.trafficLight,
      statusMessage: evaluated.statusMessage,
      snapshot: evaluated.snapshot,
    };
  });
}

export function buildBoardReportEvalContext(data: {
  clients: BoardReportEvalContext["clients"];
  employees: BoardReportEvalContext["employees"];
  serviceAgreements: BoardReportEvalContext["serviceAgreements"];
  serviceBookings: BoardReportEvalContext["serviceBookings"];
  incidents: BoardReportEvalContext["incidents"];
  monthlyServicePlans: BoardReportEvalContext["monthlyServicePlans"];
  timesheets: BoardReportEvalContext["timesheets"];
  rosterShifts: BoardReportEvalContext["rosterShifts"];
  locations: BoardReportEvalContext["locations"];
  claims: BoardReportEvalContext["claims"];
  claimRemittances?: BoardReportEvalContext["claimRemittances"];
  invoices: BoardReportEvalContext["invoices"];
  payrollClosedPeriods: BoardReportEvalContext["payrollClosedPeriods"];
  financialClosedMonths: BoardReportEvalContext["financialClosedMonths"];
  products: BoardReportEvalContext["products"];
  priceLists: BoardReportEvalContext["priceLists"];
}): BoardReportEvalContext {
  return {
    clients: data.clients,
    employees: data.employees,
    serviceAgreements: data.serviceAgreements,
    serviceBookings: data.serviceBookings,
    incidents: data.incidents,
    monthlyServicePlans: data.monthlyServicePlans,
    timesheets: data.timesheets,
    rosterShifts: data.rosterShifts,
    locations: data.locations,
    claims: data.claims,
    claimRemittances: data.claimRemittances ?? [],
    invoices: data.invoices,
    payrollClosedPeriods: data.payrollClosedPeriods,
    financialClosedMonths: data.financialClosedMonths,
    products: data.products,
    priceLists: data.priceLists,
  };
}
