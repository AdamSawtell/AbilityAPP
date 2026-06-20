import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClaimRecord } from "@/lib/claim";
import { normalizeClaim } from "@/lib/claim";
import type { ClaimRemittanceRecord } from "@/lib/claim-remittance";
import { normalizeRemittance } from "@/lib/claim-remittance";
import type { InvoiceRecord } from "@/lib/invoice";
import { normalizeInvoice } from "@/lib/invoice";
import type { ClientRecord } from "@/lib/client";
import { normalizeClient } from "@/lib/client";
import type { ContractRecord } from "@/lib/contract";
import { normalizeContract } from "@/lib/contract";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { IncidentRecord } from "@/lib/incident";
import { normalizeIncident } from "@/lib/incident";
import type { EmployeeRecord } from "@/lib/employee";
import { normalizeEmployee } from "@/lib/employee";
import type { LocationRecord } from "@/lib/location";
import { normalizeLocation } from "@/lib/location";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import { normalizePriceList } from "@/lib/product";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import { normalizeServiceAgreement } from "@/lib/service-agreement";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import { normalizeServiceBooking } from "@/lib/service-booking";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { normalizeRosterShift } from "@/lib/roster-shift";
import type { TimesheetRecord } from "@/lib/timesheet";
import { normalizeTimesheet } from "@/lib/timesheet";
import type { PlanAssessmentDocument, SupportPlanRecord } from "@/lib/support-plan";
import { normalizeSupportPlan } from "@/lib/support-plan";
import type { TaskRecord, TaskUpdate } from "@/lib/task";
import { normalizeTask } from "@/lib/task";
import {
  normalizeTaskAutomation,
  normalizeAutomationModule,
  type TaskAutomationConditions,
  type TaskAutomationDedupePolicy,
  type TaskAutomationRecord,
  type TaskAutomationTriggerEvent,
} from "@/lib/task-automation";
import { legacyActionTypeToId, taskTypeIdToLegacy } from "@/lib/task-type";
import {
  clientFromRow,
  clientToRow,
  planBudgetFromRow,
  contractFromRow,
  contractToRow,
  employeeFromRow,
  employeeToRow,
  enquiryFromRow,
  enquiryToRow,
  incidentFromRow,
  incidentToRow,
  planDocumentFromRow,
  priceListFromRow,
  priceListLineToRow,
  priceListToRow,
  productFromRow,
  productToRow,
  serviceAgreementFromRow,
  serviceAgreementLineToRow,
  serviceAgreementToRow,
  serviceBookingFromRow,
  serviceBookingLineToRow,
  serviceBookingToRow,
  rosterShiftFromRow,
  rosterShiftToRow,
  type RosterShiftRow,
  timesheetFromRow,
  timesheetLineToRow,
  timesheetToRow,
  type TimesheetLineRowDb,
  type TimesheetRow,
  claimFromRow,
  claimLineToRow,
  claimToRow,
  claimRemittanceFromRow,
  claimRemittanceLineToRow,
  claimRemittanceToRow,
  invoiceFromRow,
  invoiceLineToRow,
  invoiceToRow,
  type ClaimLineRowDb,
  type ClaimRemittanceLineRowDb,
  type ClaimRemittanceRow,
  type ClaimRow,
  type InvoiceLineRowDb,
  type InvoiceRow,
  supportPlanFromRow,
  supportPlanToRow,
  type ClientActivityRowDb,
  type ClientAlertRow,
  type ClientBpAssociationRowDb,
  type ClientConsentRowDb,
  type ClientContactActivityRowDb,
  type ClientNeedRuleRowDb,
  type ClientPlanBudgetRowDb,
  type ClientRestrictivePracticeRowDb,
  type ClientRiskRowDb,
  type ClientLocationRowDb,
  type ClientRow,
  type ContractAuditRowDb,
  type ContractRow,
  type EnquiryActivityRowDb,
  type EnquiryRow,
  type IncidentActionRowDb,
  type IncidentEvidenceRowDb,
  type IncidentNotificationRowDb,
  type IncidentPartyRowDb,
  type IncidentRow,
  type EmployeeRow,
  type EmployeeCredentialRowDb,
  type EmployeeLocationRowDb,
  type EmployeeEmergencyContactRowDb,
  type EmployeeAlertRowDb,
  type EmployeeSkillRowDb,
  type EmployeeDocumentRowDb,
  type EmployeeActivityRowDb,
  type EmployeeLeaveEntitlementRowDb,
  type EmployeeLeaveRequestRowDb,
  type PlanAssessmentDocumentRow,
  type PriceListLineRow,
  type PriceListRow,
  type ProductRow,
  type ServiceAgreementLineRow,
  type ServiceAgreementRow,
  type ServiceBookingRow,
  type ServiceBookingLineRowDb,
  type SupportPlanGoalRow,
  type SupportPlanProgressReviewRowDb,
  type SupportPlanRow,
} from "@/lib/supabase/mappers";
import {
  locationFromRow,
  locationToRow,
  type SupportLocationActivityRowDb,
  type SupportLocationAlertRowDb,
  type SupportLocationClientRowDb,
  type SupportLocationEmployeeRowDb,
  type SupportLocationProductRowDb,
  type SupportLocationRow,
} from "@/lib/supabase/location-mappers";
import {
  rosterOfCareFromRow,
  rosterOfCareLineToRow,
  rosterOfCareToRow,
  type RosterOfCareLineRowDb,
  type RosterOfCareRow,
} from "@/lib/supabase/roster-of-care-mappers";
import { normalizeRosterOfCare, type RosterOfCareRecord } from "@/lib/roster-of-care";
import {
  normalizeMonthlyServicePlan,
  type MonthlyServicePlanRecord,
} from "@/lib/monthly-service-plan";
import {
  monthlyServicePlanFromRow,
  monthlyServicePlanLineToRow,
  monthlyServicePlanToRow,
  type MonthlyServicePlanLineRowDb,
  type MonthlyServicePlanRow,
} from "@/lib/supabase/monthly-service-plan-mappers";
import {
  payrollClosedPeriodFromRow,
  payrollClosedPeriodToRow,
  type PayrollClosedPeriodRow,
} from "@/lib/supabase/payroll-closed-period-mappers";
import type { PayrollPeriodCloseRecord } from "@/lib/payroll-period-close";

export type AppData = {
  enquiries: EnquiryRecord[];
  incidents: IncidentRecord[];
  clients: ClientRecord[];
  contracts: ContractRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  serviceBookings: ServiceBookingRecord[];
  rosterShifts: RosterShiftRecord[];
  rosterOfCares: RosterOfCareRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  timesheets: TimesheetRecord[];
  claims: ClaimRecord[];
  claimRemittances: ClaimRemittanceRecord[];
  invoices: InvoiceRecord[];
  payrollClosedPeriods: PayrollPeriodCloseRecord[];
  supportPlans: SupportPlanRecord[];
  planDocuments: PlanAssessmentDocument[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
};

async function replaceChildRows(
  supabase: SupabaseClient,
  table: string,
  parentColumn: string,
  parentId: string
) {
  const { error } = await supabase.from(table).delete().eq(parentColumn, parentId);
  if (error) throw error;
}

export async function fetchAllData(supabase: SupabaseClient): Promise<AppData> {
  const [
    enquiriesRes,
    enquiryActivityRes,
    incidentsRes,
    incidentPartiesRes,
    incidentActionsRes,
    incidentNotificationsRes,
    incidentEvidenceRes,
    clientsRes,
    alertsRes,
    activityRes,
    locationsRes,
    restrictivePracticesRes,
    consentsRes,
    risksRes,
    bpAssociationsRes,
    contactActivityRes,
    needsAndRulesRes,
    planBudgetsRes,
    productsRes,
    priceListsRes,
    priceLinesRes,
    agreementsRes,
    agreementLinesRes,
    bookingsRes,
    bookingLinesRes,
    rosterShiftsRes,
    timesheetsRes,
    timesheetLinesRes,
    claimsRes,
    claimLinesRes,
    claimRemittancesRes,
    claimRemittanceLinesRes,
    invoicesRes,
    invoiceLinesRes,
    contractsRes,
    auditRes,
    supportPlansRes,
    goalsRes,
    progressReviewsRes,
    planDocsRes,
    employeesRes,
    employeeCredsRes,
    employeeLocsRes,
    employeeEcRes,
    employeeAlertsRes,
    employeeSkillsRes,
    employeeDocsRes,
    employeeActsRes,
    employeeLeaveRes,
    employeeLeaveRequestRes,
    supportLocationsRes,
    supportLocationAlertsRes,
    supportLocationClientsRes,
    supportLocationEmployeesRes,
    supportLocationProductsRes,
    supportLocationActivitiesRes,
    rosterOfCaresRes,
    rosterOfCareLinesRes,
    monthlyServicePlansRes,
    monthlyServicePlanLinesRes,
    payrollClosedPeriodsRes,
  ] = await Promise.all([
    supabase.from("enquiry").select("*").order("date_received", { ascending: false }),
    supabase.from("enquiry_activity").select("*").order("line_no"),
    supabase.from("incident").select("*").order("occurred_at", { ascending: false }),
    supabase.from("incident_party").select("*").order("line_no"),
    supabase.from("incident_action").select("*").order("line_no"),
    supabase.from("incident_notification").select("*").order("line_no"),
    supabase.from("incident_evidence").select("*").order("line_no"),
    supabase.from("client").select("*").order("search_key"),
    supabase.from("client_alert").select("*").order("line_no"),
    supabase.from("client_activity").select("*").order("line_no"),
    supabase.from("client_location").select("*").order("line_no"),
    supabase.from("client_restrictive_practice").select("*").order("line_no"),
    supabase.from("client_consent").select("*").order("line_no"),
    supabase.from("client_risk").select("*").order("line_no"),
    supabase.from("client_bp_association").select("*").order("line_no"),
    supabase.from("client_contact_activity").select("*").order("line_no"),
    supabase.from("client_support_receiver_need_rule").select("*").order("line_no"),
    supabase.from("client_plan_budget_line").select("*").order("line_no"),
    supabase.from("product").select("*").order("search_key"),
    supabase.from("price_list").select("*").order("name"),
    supabase.from("price_list_line").select("*").order("line_no"),
    supabase.from("service_agreement").select("*").order("search_key"),
    supabase.from("service_agreement_line").select("*").order("line_no"),
    supabase.from("service_booking").select("*").order("date_promised", { ascending: false }),
    supabase.from("service_booking_line").select("*").order("line_no"),
    supabase.from("roster_shift").select("*").order("shift_date"),
    supabase.from("timesheet").select("*").order("period_start", { ascending: false }),
    supabase.from("timesheet_line").select("*").order("line_no"),
    supabase.from("claim").select("*").order("period_start", { ascending: false }),
    supabase.from("claim_line").select("*").order("line_no"),
    supabase.from("claim_remittance").select("*").order("document_no", { ascending: false }),
    supabase.from("claim_remittance_line").select("*").order("line_no"),
    supabase.from("invoice").select("*").order("period_start", { ascending: false }),
    supabase.from("invoice_line").select("*").order("line_no"),
    supabase.from("contract").select("*").order("document_no"),
    supabase.from("contract_audit").select("*").order("line_no"),
    supabase.from("support_plan").select("*").order("document_no"),
    supabase.from("support_plan_goal").select("*").order("line_no"),
    supabase.from("support_plan_goal_progress_review").select("*").order("line_no"),
    supabase.from("plan_assessment_document").select("*").order("document_no"),
    supabase.from("employee").select("*").order("last_name").order("first_name"),
    supabase.from("employee_credential").select("*").order("line_no"),
    supabase.from("employee_location").select("*").order("line_no"),
    supabase.from("employee_emergency_contact").select("*").order("line_no"),
    supabase.from("employee_alert").select("*").order("line_no"),
    supabase.from("employee_skill").select("*").order("line_no"),
    supabase.from("employee_document").select("*").order("line_no"),
    supabase.from("employee_activity").select("*").order("line_no"),
    supabase.from("employee_leave_entitlement").select("*").order("line_no"),
    supabase.from("employee_leave_request").select("*").order("line_no"),
    supabase.from("support_location").select("*").order("search_key"),
    supabase.from("support_location_alert").select("*").order("line_no"),
    supabase.from("support_location_client").select("*").order("line_no"),
    supabase.from("support_location_employee").select("*").order("line_no"),
    supabase.from("support_location_product").select("*").order("line_no"),
    supabase.from("support_location_activity").select("*").order("line_no"),
    supabase.from("roster_of_care").select("*").order("name"),
    supabase.from("roster_of_care_line").select("*").order("line_no"),
    supabase.from("monthly_service_plan").select("*").order("plan_month", { ascending: false }),
    supabase.from("monthly_service_plan_line").select("*").order("line_no"),
    supabase.from("payroll_closed_period").select("*").order("period_start", { ascending: false }),
  ]);

  const firstError =
    enquiriesRes.error ??
    enquiryActivityRes.error ??
    incidentsRes.error ??
    incidentPartiesRes.error ??
    incidentActionsRes.error ??
    incidentNotificationsRes.error ??
    incidentEvidenceRes.error ??
    clientsRes.error ??
    alertsRes.error ??
    activityRes.error ??
    locationsRes.error ??
    restrictivePracticesRes.error ??
    consentsRes.error ??
    risksRes.error ??
    bpAssociationsRes.error ??
    contactActivityRes.error ??
    needsAndRulesRes.error ??
    planBudgetsRes.error ??
    productsRes.error ??
    priceListsRes.error ??
    priceLinesRes.error ??
    agreementsRes.error ??
    agreementLinesRes.error ??
    bookingsRes.error ??
    bookingLinesRes.error ??
    rosterShiftsRes.error ??
    timesheetsRes.error ??
    timesheetLinesRes.error ??
    claimsRes.error ??
    claimLinesRes.error ??
    claimRemittancesRes.error ??
    claimRemittanceLinesRes.error ??
    invoicesRes.error ??
    invoiceLinesRes.error ??
    contractsRes.error ??
    auditRes.error ??
    supportPlansRes.error ??
    goalsRes.error ??
    progressReviewsRes.error ??
    planDocsRes.error ??
    employeesRes.error ??
    employeeCredsRes.error ??
    employeeLocsRes.error ??
    employeeEcRes.error ??
    employeeAlertsRes.error ??
    employeeSkillsRes.error ??
    employeeDocsRes.error ??
    employeeActsRes.error ??
    employeeLeaveRes.error ??
    employeeLeaveRequestRes.error ??
    supportLocationsRes.error ??
    supportLocationAlertsRes.error ??
    supportLocationClientsRes.error ??
    supportLocationEmployeesRes.error ??
    supportLocationProductsRes.error ??
    supportLocationActivitiesRes.error ??
    rosterOfCaresRes.error ??
    rosterOfCareLinesRes.error ??
    monthlyServicePlansRes.error ??
    monthlyServicePlanLinesRes.error ??
    payrollClosedPeriodsRes.error;

  if (firstError) throw firstError;

  const activityByEnquiry = groupBy(enquiryActivityRes.data as EnquiryActivityRowDb[], "enquiry_id");
  const partiesByIncident = groupBy(incidentPartiesRes.data as IncidentPartyRowDb[], "incident_id");
  const actionsByIncident = groupBy(incidentActionsRes.data as IncidentActionRowDb[], "incident_id");
  const notificationsByIncident = groupBy(
    incidentNotificationsRes.data as IncidentNotificationRowDb[],
    "incident_id"
  );
  const evidenceByIncident = groupBy(incidentEvidenceRes.data as IncidentEvidenceRowDb[], "incident_id");
  const alertsByClient = groupBy(alertsRes.data as ClientAlertRow[], "client_id");
  const activityByClient = groupBy(activityRes.data as ClientActivityRowDb[], "client_id");
  const locationsByClient = groupBy(locationsRes.data as ClientLocationRowDb[], "client_id");
  const restrictivePracticesByClient = groupBy(
    restrictivePracticesRes.data as ClientRestrictivePracticeRowDb[],
    "client_id"
  );
  const consentsByClient = groupBy(consentsRes.data as ClientConsentRowDb[], "client_id");
  const risksByClient = groupBy(risksRes.data as ClientRiskRowDb[], "client_id");
  const bpAssociationsByClient = groupBy(bpAssociationsRes.data as ClientBpAssociationRowDb[], "client_id");
  const contactActivityByClient = groupBy(contactActivityRes.data as ClientContactActivityRowDb[], "client_id");
  const needsAndRulesByClient = groupBy(needsAndRulesRes.data as ClientNeedRuleRowDb[], "client_id");
  const planBudgetsByClient = groupBy(planBudgetsRes.data as ClientPlanBudgetRowDb[], "client_id");
  const linesByPriceList = groupBy(priceLinesRes.data as PriceListLineRow[], "price_list_id");
  const linesByAgreement = groupBy(agreementLinesRes.data as ServiceAgreementLineRow[], "service_agreement_id");
  const linesByBooking = groupBy(bookingLinesRes.data as ServiceBookingLineRowDb[], "service_booking_id");
  const linesByTimesheet = groupBy(timesheetLinesRes.data as TimesheetLineRowDb[], "timesheet_id");
  const linesByClaim = groupBy(claimLinesRes.data as ClaimLineRowDb[], "claim_id");
  const linesByRemittance = groupBy(claimRemittanceLinesRes.data as ClaimRemittanceLineRowDb[], "remittance_id");
  const linesByInvoice = groupBy(invoiceLinesRes.data as InvoiceLineRowDb[], "invoice_id");
  const linesByRosterOfCare = groupBy(rosterOfCareLinesRes.data as RosterOfCareLineRowDb[], "roster_of_care_id");
  const linesByMonthlyServicePlan = groupBy(
    monthlyServicePlanLinesRes.data as MonthlyServicePlanLineRowDb[],
    "monthly_service_plan_id"
  );
  const auditByContract = groupBy(auditRes.data as ContractAuditRowDb[], "contract_id");
  const goalsByPlan = groupBy(goalsRes.data as SupportPlanGoalRow[], "support_plan_id");
  const progressReviewsByGoal = groupBy(
    progressReviewsRes.data as SupportPlanProgressReviewRowDb[],
    "goal_id"
  );
  const credsByEmployee = groupBy(employeeCredsRes.data as EmployeeCredentialRowDb[], "employee_id");
  const locsByEmployee = groupBy(employeeLocsRes.data as EmployeeLocationRowDb[], "employee_id");
  const ecByEmployee = groupBy(employeeEcRes.data as EmployeeEmergencyContactRowDb[], "employee_id");
  const alertsByEmployee = groupBy(employeeAlertsRes.data as EmployeeAlertRowDb[], "employee_id");
  const skillsByEmployee = groupBy(employeeSkillsRes.data as EmployeeSkillRowDb[], "employee_id");
  const docsByEmployee = groupBy(employeeDocsRes.data as EmployeeDocumentRowDb[], "employee_id");
  const actsByEmployee = groupBy(employeeActsRes.data as EmployeeActivityRowDb[], "employee_id");
  const leaveByEmployee = groupBy(employeeLeaveRes.data as EmployeeLeaveEntitlementRowDb[], "employee_id");
  const leaveRequestsByEmployee = groupBy(employeeLeaveRequestRes.data as EmployeeLeaveRequestRowDb[], "employee_id");
  const alertsByLocation = groupBy(supportLocationAlertsRes.data as SupportLocationAlertRowDb[], "location_id");
  const clientsByLocation = groupBy(supportLocationClientsRes.data as SupportLocationClientRowDb[], "location_id");
  const employeesByLocation = groupBy(supportLocationEmployeesRes.data as SupportLocationEmployeeRowDb[], "location_id");
  const productsByLocation = groupBy(supportLocationProductsRes.data as SupportLocationProductRowDb[], "location_id");
  const activitiesByLocation = groupBy(supportLocationActivitiesRes.data as SupportLocationActivityRowDb[], "location_id");

  return {
    enquiries: ((enquiriesRes.data ?? []) as EnquiryRow[]).map((row) =>
      enquiryFromRow(row, activityByEnquiry.get(row.id) ?? [])
    ),
    incidents: ((incidentsRes.data ?? []) as IncidentRow[]).map((row) =>
      incidentFromRow(
        row,
        partiesByIncident.get(row.id) ?? [],
        actionsByIncident.get(row.id) ?? [],
        notificationsByIncident.get(row.id) ?? [],
        evidenceByIncident.get(row.id) ?? []
      )
    ),
    clients: ((clientsRes.data ?? []) as ClientRow[]).map((row) =>
      normalizeClient({
        ...clientFromRow(
          row,
          alertsByClient.get(row.id) ?? [],
          activityByClient.get(row.id) ?? [],
          locationsByClient.get(row.id) ?? [],
          restrictivePracticesByClient.get(row.id) ?? [],
          consentsByClient.get(row.id) ?? [],
          risksByClient.get(row.id) ?? [],
          bpAssociationsByClient.get(row.id) ?? [],
          contactActivityByClient.get(row.id) ?? [],
          needsAndRulesByClient.get(row.id) ?? []
        ),
        planBudgets: (planBudgetsByClient.get(row.id) ?? []).map(planBudgetFromRow),
      })
    ),
    products: ((productsRes.data ?? []) as ProductRow[]).map(productFromRow),
    priceLists: ((priceListsRes.data ?? []) as PriceListRow[]).map((row) =>
      normalizePriceList(priceListFromRow(row, linesByPriceList.get(row.id) ?? []))
    ),
    serviceAgreements: ((agreementsRes.data ?? []) as ServiceAgreementRow[]).map((row) =>
      normalizeServiceAgreement(serviceAgreementFromRow(row, linesByAgreement.get(row.id) ?? []))
    ),
    serviceBookings: ((bookingsRes.data ?? []) as ServiceBookingRow[]).map((row) =>
      normalizeServiceBooking(serviceBookingFromRow(row, linesByBooking.get(row.id) ?? []))
    ),
    rosterShifts: ((rosterShiftsRes.data ?? []) as RosterShiftRow[]).map((row) =>
      normalizeRosterShift(rosterShiftFromRow(row))
    ),
    rosterOfCares: ((rosterOfCaresRes.data ?? []) as RosterOfCareRow[]).map((row) =>
      normalizeRosterOfCare(rosterOfCareFromRow(row, linesByRosterOfCare.get(row.id) ?? []))
    ),
    monthlyServicePlans: ((monthlyServicePlansRes.data ?? []) as MonthlyServicePlanRow[]).map((row) =>
      normalizeMonthlyServicePlan(
        monthlyServicePlanFromRow(row, linesByMonthlyServicePlan.get(row.id) ?? [])
      )
    ),
    timesheets: ((timesheetsRes.data ?? []) as TimesheetRow[]).map((row) =>
      normalizeTimesheet(timesheetFromRow(row, linesByTimesheet.get(row.id) ?? []))
    ),
    claims: ((claimsRes.data ?? []) as ClaimRow[]).map((row) =>
      normalizeClaim(claimFromRow(row, linesByClaim.get(row.id) ?? []))
    ),
    claimRemittances: ((claimRemittancesRes.data ?? []) as ClaimRemittanceRow[]).map((row) =>
      normalizeRemittance(claimRemittanceFromRow(row, linesByRemittance.get(row.id) ?? []))
    ),
    invoices: ((invoicesRes.data ?? []) as InvoiceRow[]).map((row) =>
      normalizeInvoice(invoiceFromRow(row, linesByInvoice.get(row.id) ?? []))
    ),
    payrollClosedPeriods: ((payrollClosedPeriodsRes.data ?? []) as PayrollClosedPeriodRow[]).map(
      payrollClosedPeriodFromRow
    ),
    contracts: ((contractsRes.data ?? []) as ContractRow[]).map((row) =>
      normalizeContract(contractFromRow(row, auditByContract.get(row.id) ?? []))
    ),
    supportPlans: ((supportPlansRes.data ?? []) as SupportPlanRow[]).map((row) => {
      const goals = goalsByPlan.get(row.id) ?? [];
      const progressReviews = goals.flatMap((goal) => progressReviewsByGoal.get(goal.id) ?? []);
      return normalizeSupportPlan(supportPlanFromRow(row, goals, progressReviews));
    }),
    planDocuments: ((planDocsRes.data ?? []) as PlanAssessmentDocumentRow[]).map(planDocumentFromRow),
    employees: ((employeesRes.data ?? []) as EmployeeRow[]).map((row) =>
      normalizeEmployee(
        employeeFromRow(row, {
          credentials: credsByEmployee.get(row.id) ?? [],
          locations: locsByEmployee.get(row.id) ?? [],
          emergencyContacts: ecByEmployee.get(row.id) ?? [],
          alerts: alertsByEmployee.get(row.id) ?? [],
          skills: skillsByEmployee.get(row.id) ?? [],
          documents: docsByEmployee.get(row.id) ?? [],
          activities: actsByEmployee.get(row.id) ?? [],
          leaveEntitlements: leaveByEmployee.get(row.id) ?? [],
          leaveRequests: leaveRequestsByEmployee.get(row.id) ?? [],
        })
      )
    ),
    locations: ((supportLocationsRes.data ?? []) as SupportLocationRow[]).map((row) =>
      normalizeLocation(
        locationFromRow(row, {
          alerts: alertsByLocation.get(row.id) ?? [],
          clientLinks: clientsByLocation.get(row.id) ?? [],
          employeeLinks: employeesByLocation.get(row.id) ?? [],
          productLinks: productsByLocation.get(row.id) ?? [],
          activities: activitiesByLocation.get(row.id) ?? [],
        })
      )
    ),
  };
}

function groupBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const id = String(row[key]);
    const list = map.get(id) ?? [];
    list.push(row);
    map.set(id, list);
  }
  return map;
}

export async function saveEnquiry(supabase: SupabaseClient, record: EnquiryRecord) {
  const { error } = await supabase.from("enquiry").upsert(enquiryToRow(record));
  if (error) throw error;

  await replaceChildRows(supabase, "enquiry_activity", "enquiry_id", record.id);

  if (record.activity.length) {
    const { error: activityError } = await supabase.from("enquiry_activity").insert(
      record.activity.map((a) => ({
        id: a.id,
        enquiry_id: record.id,
        line_no: a.lineNo,
        activity_date: a.date || null,
        activity_type: a.activityType,
        subject: a.subject,
        description: a.description,
        created_by: a.createdBy,
      }))
    );
    if (activityError) throw activityError;
  }
}

export async function saveIncident(supabase: SupabaseClient, record: IncidentRecord) {
  const incident = normalizeIncident(record);
  const { error } = await supabase.from("incident").upsert(incidentToRow(incident));
  if (error) throw error;

  await replaceChildRows(supabase, "incident_party", "incident_id", incident.id);
  await replaceChildRows(supabase, "incident_action", "incident_id", incident.id);
  await replaceChildRows(supabase, "incident_notification", "incident_id", incident.id);
  await replaceChildRows(supabase, "incident_evidence", "incident_id", incident.id);

  if (incident.parties.length) {
    const { error: partyError } = await supabase.from("incident_party").insert(
      incident.parties.map((p) => ({
        id: p.id,
        incident_id: incident.id,
        line_no: p.lineNo,
        party_type: p.partyType,
        entity_id: p.entityId,
        party_name: p.partyName,
        role_in_incident: p.roleInIncident,
        notes: p.notes,
      }))
    );
    if (partyError) throw partyError;
  }

  if (incident.actions.length) {
    const { error: actionError } = await supabase.from("incident_action").insert(
      incident.actions.map((a) => ({
        id: a.id,
        incident_id: incident.id,
        line_no: a.lineNo,
        action_date: a.actionDate || null,
        action_type: a.actionType,
        description: a.description,
        evidence_ref: a.evidenceRef,
        owner: a.owner,
        outcome: a.outcome,
      }))
    );
    if (actionError) throw actionError;
  }

  if (incident.notifications.length) {
    const { error: notificationError } = await supabase.from("incident_notification").insert(
      incident.notifications.map((n) => ({
        id: n.id,
        incident_id: incident.id,
        line_no: n.lineNo,
        notified_at: n.notifiedAt || null,
        notify_target: n.notifyTarget,
        method: n.method,
        notified_by: n.notifiedBy,
        reference: n.reference,
        notes: n.notes,
      }))
    );
    if (notificationError) throw notificationError;
  }

  if (incident.evidence.length) {
    const { error: evidenceError } = await supabase.from("incident_evidence").insert(
      incident.evidence.map((e) => ({
        id: e.id,
        incident_id: incident.id,
        line_no: e.lineNo,
        action_id: e.actionId,
        file_name: e.fileName,
        file_url: e.fileUrl,
        storage_path: e.storagePath,
        mime_type: e.mimeType,
        uploaded_at: e.uploadedAt || null,
        uploaded_by: e.uploadedBy,
        notes: e.notes,
      }))
    );
    if (evidenceError) throw evidenceError;
  }
}

export async function fetchIncidents(supabase: SupabaseClient): Promise<IncidentRecord[]> {
  const [incidentsRes, partiesRes, actionsRes, notificationsRes, evidenceRes] = await Promise.all([
    supabase.from("incident").select("*").order("occurred_at", { ascending: false }),
    supabase.from("incident_party").select("*").order("line_no"),
    supabase.from("incident_action").select("*").order("line_no"),
    supabase.from("incident_notification").select("*").order("line_no"),
    supabase.from("incident_evidence").select("*").order("line_no"),
  ]);

  const err =
    incidentsRes.error ?? partiesRes.error ?? actionsRes.error ?? notificationsRes.error ?? evidenceRes.error;
  if (err) throw err;

  const partiesByIncident = groupBy(partiesRes.data as IncidentPartyRowDb[], "incident_id");
  const actionsByIncident = groupBy(actionsRes.data as IncidentActionRowDb[], "incident_id");
  const notificationsByIncident = groupBy(notificationsRes.data as IncidentNotificationRowDb[], "incident_id");
  const evidenceByIncident = groupBy(evidenceRes.data as IncidentEvidenceRowDb[], "incident_id");

  return ((incidentsRes.data ?? []) as IncidentRow[]).map((row) =>
    incidentFromRow(
      row,
      partiesByIncident.get(row.id) ?? [],
      actionsByIncident.get(row.id) ?? [],
      notificationsByIncident.get(row.id) ?? [],
      evidenceByIncident.get(row.id) ?? []
    )
  );
}

export async function saveClient(supabase: SupabaseClient, record: ClientRecord) {
  const client = normalizeClient(record);
  const { error } = await supabase.from("client").upsert(clientToRow(client));
  if (error) throw error;

  await replaceChildRows(supabase, "client_alert", "client_id", client.id);
  await replaceChildRows(supabase, "client_activity", "client_id", client.id);
  await replaceChildRows(supabase, "client_location", "client_id", client.id);
  await replaceChildRows(supabase, "client_restrictive_practice", "client_id", client.id);
  await replaceChildRows(supabase, "client_consent", "client_id", client.id);
  await replaceChildRows(supabase, "client_risk", "client_id", client.id);
  await replaceChildRows(supabase, "client_bp_association", "client_id", client.id);
  await replaceChildRows(supabase, "client_contact_activity", "client_id", client.id);
  await replaceChildRows(supabase, "client_support_receiver_need_rule", "client_id", client.id);
  await replaceChildRows(supabase, "client_plan_budget_line", "client_id", client.id);

  if (client.alerts.length) {
    const { error: alertError } = await supabase.from("client_alert").insert(
      client.alerts.map((a) => ({
        id: a.id,
        client_id: client.id,
        line_no: a.lineNo,
        alert_type: a.alertType,
        show_as_alert: a.showAsAlert,
        name: a.name,
        description: a.description,
        valid_from: a.validFrom || null,
        valid_to: a.validTo || null,
      }))
    );
    if (alertError) throw alertError;
  }

  if (client.activity.length) {
    const { error: activityError } = await supabase.from("client_activity").insert(
      client.activity.map((a) => ({
        id: a.id,
        client_id: client.id,
        line_no: a.lineNo,
        activity_date: a.date || null,
        activity_type: a.activityType,
        subject: a.subject,
        description: a.description,
        created_by: a.createdBy,
      }))
    );
    if (activityError) throw activityError;
  }

  if (client.locations.length) {
    const { error: locationError } = await supabase.from("client_location").insert(
      client.locations.map((l) => ({
        id: l.id,
        client_id: client.id,
        line_no: l.lineNo,
        name: l.name,
        address_type: l.addressType,
        address1: l.address1,
        address2: l.address2,
        address3: l.address3,
        city: l.city,
        state: l.state,
        postcode: l.postcode,
        country: l.country,
        phone: l.phone,
        mobile: l.mobile,
        email: l.email,
        post_to_address: l.postToAddress,
        invoice_address: l.invoiceAddress,
        ship_to_address: l.shipToAddress,
        service_delivery_address: l.serviceDeliveryAddress,
        active: l.active,
        valid_from: l.validFrom || null,
        valid_to: l.validTo || null,
        access_notes: l.accessNotes,
        description: l.description,
      }))
    );
    if (locationError) throw locationError;
  }

  if (client.restrictivePractices.length) {
    const { error: rpError } = await supabase.from("client_restrictive_practice").insert(
      client.restrictivePractices.map((r) => ({
        id: r.id,
        client_id: client.id,
        line_no: r.lineNo,
        practice_type: r.practiceType,
        show_as_alert: r.showAsAlert,
        name: r.name,
        description: r.description,
        valid_from: r.validFrom || null,
        valid_to: r.validTo || null,
      }))
    );
    if (rpError) throw rpError;
  }

  if (client.consents.length) {
    const { error: consentError } = await supabase.from("client_consent").insert(
      client.consents.map((c) => ({
        id: c.id,
        client_id: client.id,
        line_no: c.lineNo,
        consent_type: c.consentType,
        consent_status: c.consentStatus,
        show_as_alert: c.showAsAlert,
        name: c.name,
        description: c.description,
        valid_from: c.validFrom || null,
        valid_to: c.validTo || null,
      }))
    );
    if (consentError) throw consentError;
  }

  if (client.risks.length) {
    const { error: riskError } = await supabase.from("client_risk").insert(
      client.risks.map((r) => ({
        id: r.id,
        client_id: client.id,
        line_no: r.lineNo,
        risk_type: r.riskType,
        show_as_alert: r.showAsAlert,
        name: r.name,
        description: r.description,
        valid_from: r.validFrom || null,
        valid_to: r.validTo || null,
      }))
    );
    if (riskError) throw riskError;
  }

  if (client.bpAssociations.length) {
    const { error: bpaError } = await supabase.from("client_bp_association").insert(
      client.bpAssociations.map((b) => ({
        id: b.id,
        client_id: client.id,
        line_no: b.lineNo,
        associated_bp_name: b.associatedBpName,
        association_type: b.associationType,
        relationship: b.relationship,
        phone: b.phone,
        mobile: b.mobile,
        email: b.email,
        primary_contact: b.primaryContact,
        valid_from: b.validFrom || null,
        valid_to: b.validTo || null,
        notes: b.notes,
      }))
    );
    if (bpaError) throw bpaError;
  }

  if (client.contactActivity.length) {
    const { error: caError } = await supabase.from("client_contact_activity").insert(
      client.contactActivity.map((a) => ({
        id: a.id,
        client_id: client.id,
        line_no: a.lineNo,
        activity_date: a.date || null,
        activity_type: a.activityType,
        contact_name: a.contactName,
        subject: a.subject,
        description: a.description,
        created_by: a.createdBy,
      }))
    );
    if (caError) throw caError;
  }

  if (client.needsAndRules.length) {
    const { error: needError } = await supabase.from("client_support_receiver_need_rule").insert(
      client.needsAndRules.map((n) => ({
        id: n.id,
        client_id: client.id,
        line_no: n.lineNo,
        category: n.category,
        name: n.name,
        rule_text: n.ruleText,
        show_as_alert: n.showAsAlert,
        valid_from: n.validFrom || null,
        valid_to: n.validTo || null,
      }))
    );
    if (needError) throw needError;
  }

  if (client.planBudgets.length) {
    const { error: budgetError } = await supabase.from("client_plan_budget_line").insert(
      client.planBudgets.map((b) => ({
        id: b.id,
        client_id: client.id,
        line_no: b.lineNo,
        support_budget: b.supportBudget,
        support_category: b.supportCategory,
        description: b.description,
        ndis_line_item_ref: b.ndisLineItemRef,
        allocated_amount: b.allocatedAmount,
        claimed_amount: b.claimedAmount,
      }))
    );
    if (budgetError) throw budgetError;
  }
}

export async function saveProduct(supabase: SupabaseClient, record: ProductRecord) {
  const { error } = await supabase.from("product").upsert(productToRow(record));
  if (error) throw error;
}

export async function savePriceList(supabase: SupabaseClient, record: PriceListRecord) {
  const list = normalizePriceList(record);
  const { error } = await supabase.from("price_list").upsert(priceListToRow(list));
  if (error) throw error;

  await replaceChildRows(supabase, "price_list_line", "price_list_id", list.id);
  if (list.lines.length) {
    const { error: lineError } = await supabase
      .from("price_list_line")
      .insert(list.lines.map((line) => priceListLineToRow(list.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveServiceAgreement(supabase: SupabaseClient, record: ServiceAgreementRecord) {
  const agreement = normalizeServiceAgreement(record);
  const { error } = await supabase.from("service_agreement").upsert(serviceAgreementToRow(agreement));
  if (error) throw error;

  await replaceChildRows(supabase, "service_agreement_line", "service_agreement_id", agreement.id);
  if (agreement.lines.length) {
    const { error: lineError } = await supabase
      .from("service_agreement_line")
      .insert(agreement.lines.map((line) => serviceAgreementLineToRow(agreement.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveServiceBooking(supabase: SupabaseClient, record: ServiceBookingRecord) {
  const booking = normalizeServiceBooking(record);
  const { error } = await supabase.from("service_booking").upsert(serviceBookingToRow(booking));
  if (error) throw error;

  await replaceChildRows(supabase, "service_booking_line", "service_booking_id", booking.id);
  if (booking.lines.length) {
    const { error: lineError } = await supabase
      .from("service_booking_line")
      .insert(booking.lines.map((line) => serviceBookingLineToRow(booking.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveRosterShift(supabase: SupabaseClient, record: RosterShiftRecord) {
  const shift = normalizeRosterShift(record);
  const { error } = await supabase.from("roster_shift").upsert(rosterShiftToRow(shift));
  if (error) throw error;
}

/** Assign worker only when shift is still vacant — returns false if already claimed. */
export async function claimVacantRosterShift(
  supabase: SupabaseClient,
  record: RosterShiftRecord
): Promise<boolean> {
  const shift = normalizeRosterShift(record);
  const { data, error } = await supabase
    .from("roster_shift")
    .update({
      employee_id: shift.employeeId?.trim() ? shift.employeeId : null,
      status: shift.status,
      updated_by: shift.updatedBy,
    })
    .eq("id", shift.id)
    .is("employee_id", null)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** Record worker check-in only when not already checked in. */
export async function checkInRosterShift(
  supabase: SupabaseClient,
  record: RosterShiftRecord,
  employeeId: string
): Promise<boolean> {
  const shift = normalizeRosterShift(record);
  const { data, error } = await supabase
    .from("roster_shift")
    .update({
      checked_in_at: shift.checkedInAt,
      updated_by: shift.updatedBy,
    })
    .eq("id", shift.id)
    .eq("employee_id", employeeId)
    .is("checked_in_at", null)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** Record worker check-out only when checked in and not yet checked out. */
export async function checkOutRosterShift(
  supabase: SupabaseClient,
  record: RosterShiftRecord,
  employeeId: string
): Promise<boolean> {
  const shift = normalizeRosterShift(record);
  const { data, error } = await supabase
    .from("roster_shift")
    .update({
      checked_out_at: shift.checkedOutAt,
      check_in_notes: shift.checkInNotes ?? "",
      status: shift.status,
      updated_by: shift.updatedBy,
    })
    .eq("id", shift.id)
    .eq("employee_id", employeeId)
    .not("checked_in_at", "is", null)
    .is("checked_out_at", null)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function saveRosterShifts(supabase: SupabaseClient, records: RosterShiftRecord[]) {
  if (!records.length) return;
  const rows = records.map((record) => rosterShiftToRow(normalizeRosterShift(record)));
  const { error } = await supabase.from("roster_shift").upsert(rows);
  if (error) throw error;
}

export async function saveTimesheet(supabase: SupabaseClient, record: TimesheetRecord) {
  const sheet = normalizeTimesheet(record);
  const { error } = await supabase.from("timesheet").upsert(timesheetToRow(sheet));
  if (error) throw error;

  await replaceChildRows(supabase, "timesheet_line", "timesheet_id", sheet.id);
  if (sheet.lines.length) {
    const { error: lineError } = await supabase
      .from("timesheet_line")
      .insert(sheet.lines.map((line) => timesheetLineToRow(sheet.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveTimesheets(supabase: SupabaseClient, records: TimesheetRecord[]) {
  for (const record of records) {
    await saveTimesheet(supabase, record);
  }
}

export async function saveClaim(supabase: SupabaseClient, record: ClaimRecord) {
  const claim = normalizeClaim(record);
  const { error } = await supabase.from("claim").upsert(claimToRow(claim));
  if (error) throw error;

  await replaceChildRows(supabase, "claim_line", "claim_id", claim.id);
  if (claim.lines.length) {
    const { error: lineError } = await supabase
      .from("claim_line")
      .insert(claim.lines.map((line) => claimLineToRow(claim.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveClaims(supabase: SupabaseClient, records: ClaimRecord[]) {
  for (const record of records) {
    await saveClaim(supabase, record);
  }
}

export async function saveClaimRemittance(supabase: SupabaseClient, record: ClaimRemittanceRecord) {
  const remittance = normalizeRemittance(record);
  const { error } = await supabase.from("claim_remittance").upsert(claimRemittanceToRow(remittance));
  if (error) throw error;

  await replaceChildRows(supabase, "claim_remittance_line", "remittance_id", remittance.id);
  if (remittance.lines.length) {
    const { error: lineError } = await supabase
      .from("claim_remittance_line")
      .insert(remittance.lines.map((line) => claimRemittanceLineToRow(remittance.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveInvoice(supabase: SupabaseClient, record: InvoiceRecord) {
  const invoice = normalizeInvoice(record);
  const { error } = await supabase.from("invoice").upsert(invoiceToRow(invoice));
  if (error) throw error;

  await replaceChildRows(supabase, "invoice_line", "invoice_id", invoice.id);
  if (invoice.lines.length) {
    const { error: lineError } = await supabase
      .from("invoice_line")
      .insert(invoice.lines.map((line) => invoiceLineToRow(invoice.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveInvoices(supabase: SupabaseClient, records: InvoiceRecord[]) {
  for (const record of records) {
    await saveInvoice(supabase, record);
  }
}

export async function saveContract(supabase: SupabaseClient, record: ContractRecord) {
  const contract = normalizeContract(record);
  const { error } = await supabase.from("contract").upsert(contractToRow(contract));
  if (error) throw error;

  await replaceChildRows(supabase, "contract_audit", "contract_id", contract.id);
  if (contract.audit.length) {
    const { error: auditError } = await supabase.from("contract_audit").insert(
      contract.audit.map((a) => ({
        id: a.id,
        contract_id: contract.id,
        line_no: a.lineNo,
        audit_date: a.auditDate || null,
        changed_by: a.changedBy,
        action: a.action,
        description: a.description,
      }))
    );
    if (auditError) throw auditError;
  }
}

export async function saveSupportPlan(supabase: SupabaseClient, record: SupportPlanRecord) {
  const plan = normalizeSupportPlan(record);
  const { error } = await supabase.from("support_plan").upsert(supportPlanToRow(plan));
  if (error) throw error;

  await replaceChildRows(supabase, "support_plan_goal", "support_plan_id", plan.id);
  if (plan.goals.length) {
    const { error: goalError } = await supabase.from("support_plan_goal").insert(
      plan.goals.map((g) => ({
        id: g.id,
        support_plan_id: plan.id,
        line_no: g.lineNo,
        name: g.name,
        goal_number: g.goalNumber,
        goal_term: g.goalTerm,
        goal_type: g.goalType,
        goal: g.goal,
        support_required: g.supportRequired,
        start_date: g.startDate || null,
        end_date: g.endDate || null,
      }))
    );
    if (goalError) throw goalError;
  }

  const goalIds = new Set(plan.goals.map((g) => g.id));
  for (const goalId of goalIds) {
    await replaceChildRows(supabase, "support_plan_goal_progress_review", "goal_id", goalId);
  }
  const progressReviews = (plan.progressReviews ?? []).filter((r) => goalIds.has(r.goalId));
  if (progressReviews.length) {
    const { error: prError } = await supabase.from("support_plan_goal_progress_review").insert(
      progressReviews.map((r) => ({
        id: r.id,
        goal_id: r.goalId,
        line_no: r.lineNo,
        progress_review_type: r.progressReviewType,
        review_date: r.reviewDate || null,
        goal_progress: r.goalProgress,
        progress_taken: r.progressTaken,
        receiver_feeling: r.receiverFeeling,
        next_steps: r.nextSteps,
        created_by: r.createdBy,
        updated_by: r.updatedBy,
      }))
    );
    if (prError) throw prError;
  }
}

export async function savePlanDocument(supabase: SupabaseClient, record: PlanAssessmentDocument) {
  const { error } = await supabase.from("plan_assessment_document").upsert({
    id: record.id,
    client_id: record.clientId,
    document_no: record.documentNo,
    document_type: record.documentType,
    plan_type: record.planType,
    assessment_type: record.assessmentType,
    review_date: record.reviewDate || null,
    date_received: record.dateReceived || null,
    document_status: record.documentStatus,
    document_developer: record.documentDeveloper,
    support_plan_id: record.supportPlanId?.trim() ? record.supportPlanId : null,
  });
  if (error) throw error;
}

export async function saveEmployee(supabase: SupabaseClient, record: EmployeeRecord) {
  const normalized = normalizeEmployee(record);
  const { error } = await supabase.from("employee").upsert(employeeToRow(normalized));
  if (error) throw error;

  await replaceChildRows(supabase, "employee_credential", "employee_id", normalized.id);

  if (normalized.credentials.length) {
    const { error: credError } = await supabase.from("employee_credential").insert(
      normalized.credentials.map((c) => ({
        id: c.id,
        employee_id: normalized.id,
        line_no: c.lineNo,
        credential_type: c.credentialType,
        credential_number: c.credentialNumber,
        issuing_body: c.issuingBody,
        issue_date: c.issueDate || null,
        expiry_date: c.expiryDate || null,
        status: c.status,
        document_ref: c.documentRef,
        evidence_ref: c.evidenceRef ?? "",
        notes: c.notes,
        staff_submitted: c.staffSubmitted ?? false,
        submitted_at: c.submittedAt ?? null,
        submitted_by_user_id: c.submittedByUserId ?? "",
        reviewed_at: c.reviewedAt ?? null,
        reviewed_by: c.reviewedBy ?? "",
        review_notes: c.reviewNotes ?? "",
        created_by: c.createdBy,
        updated_by: c.updatedBy,
      }))
    );
    if (credError) throw credError;
  }

  await replaceChildRows(supabase, "employee_location", "employee_id", normalized.id);

  if (normalized.locations.length) {
    const { error: locError } = await supabase.from("employee_location").insert(
      normalized.locations.map((l) => ({
        id: l.id,
        employee_id: normalized.id,
        line_no: l.lineNo,
        name: l.name,
        address_type: l.addressType,
        address1: l.address1,
        address2: l.address2,
        address3: l.address3,
        city: l.city,
        state: l.state,
        postcode: l.postcode,
        country: l.country,
        phone: l.phone,
        mobile: l.mobile,
        email: l.email,
        primary_address: l.primaryAddress,
        active: l.active,
        valid_from: l.validFrom || null,
        valid_to: l.validTo || null,
        access_notes: l.accessNotes,
        description: l.description,
      }))
    );
    if (locError) throw locError;
  }

  await replaceChildRows(supabase, "employee_emergency_contact", "employee_id", normalized.id);
  if (normalized.emergencyContacts.length) {
    const { error } = await supabase.from("employee_emergency_contact").insert(
      normalized.emergencyContacts.map((c) => ({
        id: c.id,
        employee_id: normalized.id,
        line_no: c.lineNo,
        contact_type: c.contactType,
        name: c.name,
        relationship: c.relationship,
        phone: c.phone,
        mobile: c.mobile,
        email: c.email,
        call_order: c.callOrder,
        primary_contact: c.primaryContact,
        notes: c.notes,
      }))
    );
    if (error) throw error;
  }

  const manualAlerts = normalized.alerts.filter((a) => a.source !== "System");
  await replaceChildRows(supabase, "employee_alert", "employee_id", normalized.id);
  if (manualAlerts.length) {
    const { error } = await supabase.from("employee_alert").insert(
      manualAlerts.map((a) => ({
        id: a.id,
        employee_id: normalized.id,
        line_no: a.lineNo,
        alert_type: a.alertType,
        show_as_alert: a.showAsAlert,
        name: a.name,
        description: a.description,
        valid_from: a.validFrom || null,
        valid_to: a.validTo || null,
        source: a.source || "Manual",
      }))
    );
    if (error) throw error;
  }

  await replaceChildRows(supabase, "employee_skill", "employee_id", normalized.id);
  if (normalized.skills.length) {
    const { error } = await supabase.from("employee_skill").insert(
      normalized.skills.map((s) => ({
        id: s.id,
        employee_id: normalized.id,
        line_no: s.lineNo,
        skill_type: s.skillType,
        name: s.name,
        proficiency: s.proficiency,
        notes: s.notes,
      }))
    );
    if (error) throw error;
  }

  await replaceChildRows(supabase, "employee_document", "employee_id", normalized.id);
  if (normalized.documents.length) {
    const { error } = await supabase.from("employee_document").insert(
      normalized.documents.map((d) => ({
        id: d.id,
        employee_id: normalized.id,
        line_no: d.lineNo,
        document_type: d.documentType,
        name: d.name,
        document_ref: d.documentRef,
        issue_date: d.issueDate || null,
        expiry_date: d.expiryDate || null,
        status: d.status,
        notes: d.notes,
        staff_visible: d.staffVisible !== false,
        requires_acknowledgement: Boolean(d.requiresAcknowledgement),
      }))
    );
    if (error) throw error;
  }

  await replaceChildRows(supabase, "employee_activity", "employee_id", normalized.id);
  if (normalized.activities.length) {
    const { error } = await supabase.from("employee_activity").insert(
      normalized.activities.map((a) => ({
        id: a.id,
        employee_id: normalized.id,
        line_no: a.lineNo,
        activity_date: a.date || null,
        activity_type: a.activityType,
        subject: a.subject,
        description: a.description,
        created_by: a.createdBy,
      }))
    );
    if (error) throw error;
  }

  await replaceChildRows(supabase, "employee_leave_entitlement", "employee_id", normalized.id);
  if (normalized.leaveEntitlements.length) {
    const { error } = await supabase.from("employee_leave_entitlement").insert(
      normalized.leaveEntitlements.map((l) => ({
        id: l.id,
        employee_id: normalized.id,
        line_no: l.lineNo,
        leave_type: l.leaveType,
        entitlement_days: l.entitlementDays,
        balance_days: l.balanceDays,
        accrual_notes: l.accrualNotes,
      }))
    );
    if (error) throw error;
  }

  await replaceChildRows(supabase, "employee_leave_request", "employee_id", normalized.id);
  if (normalized.leaveRequests.length) {
    const { error } = await supabase.from("employee_leave_request").insert(
      normalized.leaveRequests.map((l) => ({
        id: l.id,
        employee_id: normalized.id,
        line_no: l.lineNo,
        leave_type: l.leaveType,
        start_date: l.startDate || null,
        end_date: l.endDate || null,
        days_requested: l.daysRequested,
        status: l.status,
        notes: l.notes,
        submitted_at: l.submittedAt || null,
        reviewed_at: l.reviewedAt || null,
        reviewed_by: l.reviewedBy ?? "",
        decline_reason: l.declineReason ?? "",
      }))
    );
    if (error) throw error;
  }
}

export async function saveLocation(supabase: SupabaseClient, record: LocationRecord) {
  const normalized = normalizeLocation(record);
  const { error } = await supabase.from("support_location").upsert(locationToRow(normalized));
  if (error) throw error;

  await replaceChildRows(supabase, "support_location_alert", "location_id", normalized.id);
  if (normalized.alerts.length) {
    const { error: alertError } = await supabase.from("support_location_alert").insert(
      normalized.alerts.map((a) => ({
        id: a.id,
        location_id: normalized.id,
        line_no: a.lineNo,
        alert_type: a.alertType,
        show_as_alert: a.showAsAlert,
        name: a.name,
        description: a.description,
        valid_from: a.validFrom || null,
        valid_to: a.validTo || null,
      }))
    );
    if (alertError) throw alertError;
  }

  await replaceChildRows(supabase, "support_location_client", "location_id", normalized.id);
  if (normalized.clientLinks.length) {
    const { error: clientError } = await supabase.from("support_location_client").insert(
      normalized.clientLinks.map((l) => ({
        id: l.id,
        location_id: normalized.id,
        line_no: l.lineNo,
        client_id: l.clientId,
        assignment_role: l.assignmentRole,
        primary_assignment: l.primaryAssignment,
        valid_from: l.validFrom || null,
        valid_to: l.validTo || null,
        notes: l.notes,
      }))
    );
    if (clientError) throw clientError;
  }

  await replaceChildRows(supabase, "support_location_employee", "location_id", normalized.id);
  if (normalized.employeeLinks.length) {
    const { error: employeeError } = await supabase.from("support_location_employee").insert(
      normalized.employeeLinks.map((l) => ({
        id: l.id,
        location_id: normalized.id,
        line_no: l.lineNo,
        employee_id: l.employeeId,
        assignment_role: l.assignmentRole,
        primary_assignment: l.primaryAssignment,
        valid_from: l.validFrom || null,
        valid_to: l.validTo || null,
        notes: l.notes,
      }))
    );
    if (employeeError) throw employeeError;
  }

  await replaceChildRows(supabase, "support_location_product", "location_id", normalized.id);
  if (normalized.productLinks.length) {
    const { error: productError } = await supabase.from("support_location_product").insert(
      normalized.productLinks.map((l) => ({
        id: l.id,
        location_id: normalized.id,
        line_no: l.lineNo,
        product_id: l.productId,
        active: l.active,
        valid_from: l.validFrom || null,
        valid_to: l.validTo || null,
        notes: l.notes,
      }))
    );
    if (productError) throw productError;
  }

  await replaceChildRows(supabase, "support_location_activity", "location_id", normalized.id);
  if (normalized.activities.length) {
    const { error: activityError } = await supabase.from("support_location_activity").insert(
      normalized.activities.map((a) => ({
        id: a.id,
        location_id: normalized.id,
        line_no: a.lineNo,
        activity_date: a.date || null,
        activity_type: a.activityType,
        subject: a.subject,
        description: a.description,
        created_by: a.createdBy,
      }))
    );
    if (activityError) throw activityError;
  }
}

type TaskRow = {
  id: string;
  document_no: string;
  title: string;
  description: string;
  status: string;
  action_type: string;
  task_type_id?: string | null;
  priority: string;
  due_date: string | null;
  assignment_type: string;
  assignee_user_id: string | null;
  assignee_role_id: string | null;
  entity_type: string;
  entity_id: string;
  entity_label: string;
  created_by_user_id: string | null;
  created_by: string;
  updated_by: string;
  completed_by: string;
  completed_at: string | null;
  resolution_notes: string;
  updates?: TaskUpdate[];
  automation_rule_id?: string | null;
  automation_dedupe_key?: string | null;
};

function taskFromRow(row: TaskRow): TaskRecord {
  return normalizeTask({
    id: row.id,
    documentNo: row.document_no,
    title: row.title,
    description: row.description,
    status: row.status as TaskRecord["status"],
    actionType: row.action_type,
    taskTypeId: row.task_type_id || legacyActionTypeToId(row.action_type),
    priority: (row.priority as TaskRecord["priority"]) || "Normal",
    dueDate: row.due_date ?? "",
    assignmentType: row.assignment_type === "role" ? "role" : "user",
    assigneeUserId: row.assignee_user_id ?? "",
    assigneeRoleId: row.assignee_role_id ?? "",
    entityType: (row.entity_type || "") as TaskRecord["entityType"],
    entityId: row.entity_id ?? "",
    entityLabel: row.entity_label ?? "",
    createdByUserId: row.created_by_user_id ?? "",
    createdBy: row.created_by ?? "",
    updatedBy: row.updated_by ?? "",
    completedBy: row.completed_by ?? "",
    completedAt: row.completed_at ?? "",
    resolutionNotes: row.resolution_notes ?? "",
    updates: Array.isArray(row.updates) ? row.updates : [],
    automationRuleId: row.automation_rule_id ?? "",
    automationDedupeKey: row.automation_dedupe_key ?? "",
  });
}

function taskToRow(task: TaskRecord): TaskRow {
  const normalized = normalizeTask(task);
  return {
    id: normalized.id,
    document_no: normalized.documentNo,
    title: normalized.title,
    description: normalized.description,
    status: normalized.status,
    action_type: taskTypeIdToLegacy(normalized.taskTypeId),
    task_type_id: normalized.taskTypeId || null,
    priority: normalized.priority,
    due_date: normalized.dueDate || null,
    assignment_type: normalized.assignmentType,
    assignee_user_id: normalized.assigneeUserId || null,
    assignee_role_id: normalized.assigneeRoleId || null,
    entity_type: normalized.entityType || "",
    entity_id: normalized.entityId || "",
    entity_label: normalized.entityLabel || "",
    created_by_user_id: normalized.createdByUserId || null,
    created_by: normalized.createdBy,
    updated_by: normalized.updatedBy,
    completed_by: normalized.completedBy,
    completed_at: normalized.completedAt || null,
    resolution_notes: normalized.resolutionNotes,
    updates: normalized.updates,
    automation_rule_id: normalized.automationRuleId || null,
    automation_dedupe_key: normalized.automationDedupeKey || null,
  };
}

export async function fetchTasks(supabase: SupabaseClient): Promise<TaskRecord[]> {
  const { data, error } = await supabase.from("app_task").select("*").order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => taskFromRow(row as TaskRow));
}

export async function saveTask(supabase: SupabaseClient, task: TaskRecord) {
  const row = taskToRow(normalizeTask(task));
  const { error } = await supabase.from("app_task").upsert(row);
  if (error) throw error;
}

type TaskAutomationRow = {
  id: string;
  name: string;
  active: boolean;
  module: string;
  trigger_event: string;
  conditions: Record<string, unknown>;
  task_type_id: string;
  title_template: string;
  description_template: string;
  priority: string;
  due_offset_hours: number | null;
  due_offset_days: number | null;
  due_from_field: string | null;
  assignee_mode: string;
  assignee_position_id: string | null;
  assignee_role_id: string;
  dedupe_policy: string;
  sort_order: number;
};

function taskAutomationFromRow(row: TaskAutomationRow): TaskAutomationRecord {
  return normalizeTaskAutomation({
    id: row.id,
    name: row.name,
    active: row.active,
    module: normalizeAutomationModule(row.module) as TaskAutomationRecord["module"],
    triggerEvent: row.trigger_event as TaskAutomationTriggerEvent,
    conditions: (row.conditions ?? {}) as TaskAutomationConditions,
    taskTypeId: row.task_type_id,
    titleTemplate: row.title_template,
    descriptionTemplate: row.description_template,
    priority: (row.priority as TaskAutomationRecord["priority"]) || "Normal",
    dueOffsetHours: row.due_offset_hours,
    dueOffsetDays: row.due_offset_days,
    dueFromField: row.due_from_field,
    assigneeMode: (row.assignee_mode as TaskAutomationRecord["assigneeMode"]) || "role",
    assigneePositionId: row.assignee_position_id ?? "",
    assigneeRoleId: row.assignee_role_id,
    dedupePolicy: (row.dedupe_policy as TaskAutomationDedupePolicy) || "one_open_per_entity",
    sortOrder: row.sort_order ?? 0,
  });
}

export async function fetchTaskAutomations(supabase: SupabaseClient): Promise<TaskAutomationRecord[]> {
  const { data, error } = await supabase
    .from("app_task_automation")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => taskAutomationFromRow(row as TaskAutomationRow));
}

function taskAutomationToRow(rule: TaskAutomationRecord): TaskAutomationRow {
  const normalized = normalizeTaskAutomation(rule);
  return {
    id: normalized.id,
    name: normalized.name,
    active: normalized.active,
    module: normalized.module,
    trigger_event: normalized.triggerEvent,
    conditions: normalized.conditions as Record<string, unknown>,
    task_type_id: normalized.taskTypeId,
    title_template: normalized.titleTemplate,
    description_template: normalized.descriptionTemplate,
    priority: normalized.priority,
    due_offset_hours: normalized.dueOffsetHours,
    due_offset_days: normalized.dueOffsetDays,
    due_from_field: normalized.dueFromField,
    assignee_mode: normalized.assigneeMode,
    assignee_position_id: normalized.assigneePositionId || null,
    assignee_role_id: normalized.assigneeRoleId,
    dedupe_policy: normalized.dedupePolicy,
    sort_order: normalized.sortOrder,
  };
}

export async function saveTaskAutomation(supabase: SupabaseClient, rule: TaskAutomationRecord) {
  const row = taskAutomationToRow(rule);
  const { error } = await supabase.from("app_task_automation").upsert(row);
  if (error) throw error;
}

export async function deleteTaskAutomation(supabase: SupabaseClient, id: string) {
  const { error } = await supabase.from("app_task_automation").delete().eq("id", id);
  if (error) throw error;
}

export async function appendClientActivity(
  supabase: SupabaseClient,
  clientId: string,
  activity: {
    id: string;
    lineNo: number;
    date: string;
    activityType: string;
    subject: string;
    description: string;
    createdBy: string;
  }
) {
  const { error } = await supabase.from("client_activity").insert({
    id: activity.id,
    client_id: clientId,
    line_no: activity.lineNo,
    activity_date: activity.date || null,
    activity_type: activity.activityType,
    subject: activity.subject,
    description: activity.description,
    created_by: activity.createdBy,
  });
  if (error) throw error;
}

export async function nextClientActivityLineNo(supabase: SupabaseClient, clientId: string): Promise<number> {
  const { data } = await supabase
    .from("client_activity")
    .select("line_no")
    .eq("client_id", clientId)
    .order("line_no", { ascending: false })
    .limit(1);
  const max = data?.[0]?.line_no;
  return typeof max === "number" ? max + 1 : 1;
}

export type ClientPatchFields = {
  status?: string;
  email?: string;
  phone?: string;
  fundingBody?: string;
  disability?: string;
  services?: string;
  preferredName?: string;
};

export async function patchClientFields(
  supabase: SupabaseClient,
  clientId: string,
  fields: ClientPatchFields,
  updatedBy: string
) {
  const row: Record<string, string> = { updated_by: updatedBy };
  if (fields.status !== undefined) row.status = fields.status;
  if (fields.email !== undefined) row.email = fields.email;
  if (fields.phone !== undefined) row.phone = fields.phone;
  if (fields.fundingBody !== undefined) row.funding_body = fields.fundingBody;
  if (fields.disability !== undefined) row.disability = fields.disability;
  if (fields.services !== undefined) row.services = fields.services;
  if (fields.preferredName !== undefined) row.preferred_name = fields.preferredName;
  const { error } = await supabase.from("client").update(row).eq("id", clientId);
  if (error) throw error;
}

export async function saveRosterOfCare(supabase: SupabaseClient, record: RosterOfCareRecord) {
  const roc = normalizeRosterOfCare(record);
  const { error } = await supabase.from("roster_of_care").upsert(rosterOfCareToRow(roc));
  if (error) throw error;

  if (roc.lines.length) {
    const { error: lineError } = await supabase
      .from("roster_of_care_line")
      .upsert(roc.lines.map((line) => rosterOfCareLineToRow(roc.id, line)));
    if (lineError) throw lineError;
  }

  const keepIds = new Set(roc.lines.map((line) => line.id));
  const { data: existingLines, error: fetchError } = await supabase
    .from("roster_of_care_line")
    .select("id")
    .eq("roster_of_care_id", roc.id);
  if (fetchError) throw fetchError;
  const staleIds = (existingLines ?? []).map((row) => row.id).filter((id) => !keepIds.has(id));
  if (staleIds.length) {
    const { error: deleteError } = await supabase.from("roster_of_care_line").delete().in("id", staleIds);
    if (deleteError) throw deleteError;
  }
}

export async function saveRosterOfCares(supabase: SupabaseClient, records: RosterOfCareRecord[]) {
  for (const record of records) {
    await saveRosterOfCare(supabase, record);
  }
}

export async function saveMonthlyServicePlan(supabase: SupabaseClient, record: MonthlyServicePlanRecord) {
  const plan = normalizeMonthlyServicePlan(record);
  const { error } = await supabase.from("monthly_service_plan").upsert(monthlyServicePlanToRow(plan));
  if (error) throw error;

  if (plan.lines.length) {
    const { error: lineError } = await supabase
      .from("monthly_service_plan_line")
      .upsert(plan.lines.map((line) => monthlyServicePlanLineToRow(plan.id, line)));
    if (lineError) throw lineError;
  }

  const keepIds = new Set(plan.lines.map((line) => line.id));
  const { data: existingLines, error: fetchError } = await supabase
    .from("monthly_service_plan_line")
    .select("id")
    .eq("monthly_service_plan_id", plan.id);
  if (fetchError) throw fetchError;
  const staleIds = (existingLines ?? []).map((row) => row.id).filter((id) => !keepIds.has(id));
  if (staleIds.length) {
    const { error: deleteError } = await supabase.from("monthly_service_plan_line").delete().in("id", staleIds);
    if (deleteError) throw deleteError;
  }
}

export async function savePayrollClosedPeriod(supabase: SupabaseClient, record: PayrollPeriodCloseRecord) {
  const { error } = await supabase.from("payroll_closed_period").upsert(payrollClosedPeriodToRow(record));
  if (error) throw error;
}
