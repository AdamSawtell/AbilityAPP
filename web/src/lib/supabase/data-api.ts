import type { SupabaseClient } from "@supabase/supabase-js";
import type { AgencyShiftRequestRecord } from "@/lib/agency-shift-request";
import { normalizeAgencyShiftRequest } from "@/lib/agency-shift-request";
import type { AgencyTimesheetRecord } from "@/lib/agency-timesheet";
import type { VendorInvoiceRecord } from "@/lib/vendor-invoice";
import { normalizeVendorInvoice } from "@/lib/vendor-invoice";
import { normalizeAgencyTimesheet } from "@/lib/agency-timesheet";
import type { AgencyWorkerRecord } from "@/lib/agency-worker";
import { normalizeAgencyWorker } from "@/lib/agency-worker";
import type { SiteOrientationRecord } from "@/lib/site-orientation";
import { normalizeSiteOrientation } from "@/lib/site-orientation";
import type { ClaimRecord } from "@/lib/claim";
import { normalizeClaim } from "@/lib/claim";
import type { ClaimRemittanceRecord } from "@/lib/claim-remittance";
import { normalizeRemittance } from "@/lib/claim-remittance";
import type { InvoiceRecord } from "@/lib/invoice";
import { normalizeInvoice } from "@/lib/invoice";
import type { ClientRecord } from "@/lib/client";
import { normalizeClient } from "@/lib/client";
import type { BusinessPartnerRecord } from "@/lib/business-partner";
import { normalizeBusinessPartner } from "@/lib/business-partner";
import type { ContractRecord } from "@/lib/contract";
import { normalizeContract } from "@/lib/contract";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { IncidentRecord } from "@/lib/incident";
import { normalizeIncident } from "@/lib/incident";
import type { EmployeeRecord } from "@/lib/employee";
import { normalizeEmployee } from "@/lib/employee";
import type { LocationRecord } from "@/lib/location";
import { normalizeLocation } from "@/lib/location";
import type { FleetBookingRow, FleetVehicleRecord } from "@/lib/fleet-vehicle";
import { normalizeFleetVehicle } from "@/lib/fleet-vehicle";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import { normalizePriceList } from "@/lib/product";
import type { NdisPriceImportBatch, NdisPriceImportRow } from "@/lib/ndis-price-import";
import type { PriceUpdateImpact, PriceUpdateRun } from "@/lib/price-update";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import { normalizeServiceAgreement } from "@/lib/service-agreement";
import type { ServiceBookingRecord } from "@/lib/service-booking";
import { normalizeServiceBooking } from "@/lib/service-booking";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import { normalizeRosterShift } from "@/lib/roster-shift";
import type { RosterShiftRequestRecord } from "@/lib/roster-shift-request";
import { normalizeShiftRequest } from "@/lib/roster-shift-request";
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
  businessPartnerFromRow,
  businessPartnerToRow,
  type BusinessPartnerRow,
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
  ndisPriceImportBatchFromRow,
  ndisPriceImportBatchToRow,
  ndisPriceImportRowFromRow,
  ndisPriceImportRowToRow,
  priceUpdateRunFromRow,
  priceUpdateRunToRow,
  priceUpdateImpactFromRow,
  priceUpdateImpactToRow,
  serviceAgreementFromRow,
  serviceAgreementLineToRow,
  serviceAgreementToRow,
  serviceBookingFromRow,
  serviceBookingLineToRow,
  serviceBookingToRow,
  rosterShiftFromRow,
  rosterShiftToRow,
  rosterShiftRequestFromRow,
  rosterShiftRequestToRow,
  type RosterShiftRow,
  type RosterShiftRequestRow,
  agencyWorkerFromRow,
  agencyWorkerToRow,
  type AgencyWorkerRow,
  agencyShiftRequestFromRow,
  agencyShiftRequestToRow,
  type AgencyShiftRequestRow,
  agencyTimesheetFromRow,
  agencyTimesheetLineToRow,
  agencyTimesheetToRow,
  type AgencyTimesheetLineRowDb,
  type AgencyTimesheetRow,
  vendorInvoiceFromRow,
  vendorInvoiceToRow,
  type VendorInvoiceRow,
  siteOrientationFromRow,
  siteOrientationToRow,
  type SiteOrientationRow,
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
  type NdisPriceImportBatchRow,
  type NdisPriceImportRowDb,
  type PriceUpdateRunRow,
  type PriceUpdateImpactRow,
  type ServiceAgreementLineRow,
  type ServiceAgreementRow,
  type ServiceBookingRow,
  type ServiceBookingLineRowDb,
  type SupportPlanGoalRow,
  type SupportPlanProgressReviewRowDb,
  type SupportPlanRow,
  type SupportPlanMedicationRowDb,
  type SupportPlanDiagnosisRowDb,
  type SupportPlanHealthPlanRowDb,
  type SupportPlanSupportRequirementRowDb,
  type SupportPlanAssistiveTechnologyRowDb,
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
  fleetBookingFromRow,
  fleetBookingToRow,
  fleetFuelLogFromRow,
  fleetFuelLogToRow,
  fleetInspectionFromRow,
  fleetInspectionToRow,
  fleetServiceRecordFromRow,
  fleetServiceRecordToRow,
  fleetVehicleFromRow,
  fleetVehicleToRow,
  type FleetBookingRowDb,
  type FleetFuelLogRowDb,
  type FleetInspectionRowDb,
  type FleetServiceRecordRowDb,
  type FleetVehicleRowDb,
} from "@/lib/supabase/fleet-mappers";
import {
  rosterOfCareFromRow,
  rosterOfCareLineToRow,
  rosterOfCareToRow,
  type RosterOfCareLineRowDb,
  type RosterOfCareRow,
} from "@/lib/supabase/roster-of-care-mappers";
import {
  rosterShiftClientLineFromRow,
  rosterShiftClientLineToRow,
  rosterShiftWorkerLineFromRow,
  rosterShiftWorkerLineToRow,
  type RosterShiftClientLineRow,
  type RosterShiftWorkerLineRow,
} from "@/lib/supabase/roster-session-mappers";
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
import type {
  PayPeriodDefinitionRecord,
  PayPeriodInstanceRecord,
} from "@/lib/pay-period";
import {
  generatePayPeriodInstances,
  normalizePayPeriodDefinition,
} from "@/lib/pay-period";
import {
  payPeriodDefinitionFromRow,
  payPeriodDefinitionToRow,
  payPeriodInstanceFromRow,
  payPeriodInstanceToRow,
  type PayPeriodDefinitionRow,
  type PayPeriodInstanceRow,
} from "@/lib/supabase/pay-period-mappers";
import type { FinancialClosedMonthRecord } from "@/lib/financial-close-period";
import {
  financialClosedMonthFromRow,
  financialClosedMonthToRow,
  type FinancialClosedMonthRow,
} from "@/lib/supabase/financial-closed-month-mappers";
import type { BoardReportPackRecord } from "@/lib/board-report-pack";
import type { BoardReportTemplateRecord } from "@/lib/board-report-template";
import {
  boardReportPackFromRows,
  boardReportPackSectionToRow,
  boardReportPackToRow,
  boardReportTemplateFromRows,
  type BoardReportPackRow,
  type BoardReportPackSectionRow,
  type BoardReportTemplateRow,
  type BoardReportTemplateSectionRow,
} from "@/lib/supabase/board-report-mappers";
import type {
  DocumentTemplateRecord,
  GeneratedDocumentRecord,
  ProcessDocumentBindingRecord,
} from "@/lib/document-template";
import {
  documentTemplateBlockToRow,
  documentTemplateFromRow,
  documentTemplateToRow,
  generatedDocumentFromRow,
  generatedDocumentToRow,
  processDocumentBindingFromRow,
  processDocumentBindingToRow,
} from "@/lib/supabase/document-mappers";

export type AppData = {
  enquiries: EnquiryRecord[];
  incidents: IncidentRecord[];
  clients: ClientRecord[];
  businessPartners: BusinessPartnerRecord[];
  contracts: ContractRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  serviceBookings: ServiceBookingRecord[];
  rosterShifts: RosterShiftRecord[];
  rosterShiftRequests: RosterShiftRequestRecord[];
  agencyWorkers: AgencyWorkerRecord[];
  agencyShiftRequests: AgencyShiftRequestRecord[];
  siteOrientations: SiteOrientationRecord[];
  agencyTimesheets: AgencyTimesheetRecord[];
  vendorInvoices: VendorInvoiceRecord[];
  rosterOfCares: RosterOfCareRecord[];
  monthlyServicePlans: MonthlyServicePlanRecord[];
  timesheets: TimesheetRecord[];
  claims: ClaimRecord[];
  claimRemittances: ClaimRemittanceRecord[];
  invoices: InvoiceRecord[];
  payrollClosedPeriods: PayrollPeriodCloseRecord[];
  payPeriodDefinitions: PayPeriodDefinitionRecord[];
  payPeriodInstances: PayPeriodInstanceRecord[];
  financialClosedMonths: FinancialClosedMonthRecord[];
  boardReportTemplates: BoardReportTemplateRecord[];
  boardReportPacks: BoardReportPackRecord[];
  supportPlans: SupportPlanRecord[];
  planDocuments: PlanAssessmentDocument[];
  employees: EmployeeRecord[];
  locations: LocationRecord[];
  fleetVehicles: FleetVehicleRecord[];
  fleetBookings: FleetBookingRow[];
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

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim() ?? "").filter(Boolean))];
}

async function selectRowsByIds<T extends { id: string }>(
  supabase: SupabaseClient,
  table: string,
  ids: string[]
): Promise<T[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase.from(table).select("*").in("id", ids);
  if (error) throw error;
  return (data ?? []) as T[];
}

export type ClaimGatewayData = Pick<AppData, "claims" | "clients" | "serviceBookings" | "products" | "priceLists">;

export async function fetchClaimGatewayData(
  supabase: SupabaseClient,
  claimId: string
): Promise<ClaimGatewayData & { claim: ClaimRecord | null }> {
  const { data: claimRow, error: claimError } = await supabase
    .from("claim")
    .select("*")
    .eq("id", claimId)
    .maybeSingle();
  if (claimError) throw claimError;
  if (!claimRow) {
    return { claim: null, claims: [], clients: [], serviceBookings: [], products: [], priceLists: [] };
  }

  const { data: lineRows, error: lineError } = await supabase
    .from("claim_line")
    .select("*")
    .eq("claim_id", claimId)
    .order("line_no");
  if (lineError) throw lineError;

  const claimLines = (lineRows ?? []) as ClaimLineRowDb[];
  const claim = normalizeClaim(claimFromRow(claimRow as ClaimRow, claimLines));

  const clientIds = uniqueNonEmpty([claim.clientId, ...claim.lines.map((line) => line.clientId)]);
  const bookingIds = uniqueNonEmpty(claim.lines.map((line) => line.serviceBookingId));
  const productIds = uniqueNonEmpty(claim.lines.map((line) => line.productId));

  const [clientRows, bookingRows, bookingLineRows, productRows] = await Promise.all([
    selectRowsByIds(supabase, "client", clientIds),
    selectRowsByIds<ServiceBookingRow>(supabase, "service_booking", bookingIds),
    bookingIds.length
      ? supabase.from("service_booking_line").select("*").in("service_booking_id", bookingIds).order("line_no")
      : Promise.resolve({ data: [], error: null }),
    selectRowsByIds<ProductRow>(supabase, "product", productIds),
  ]);

  if (bookingLineRows.error) throw bookingLineRows.error;

  const products = (productRows as ProductRow[]).map(productFromRow);
  // Keep the same validation semantics as the in-app gateway panel: if a product
  // is missing a linked price list, revalidateClaimRecord falls back to priceLists[0].
  // Price lists are reference data, so loading the full catalog is still cheap.
  const { data: priceRows, error: priceError } = await supabase.from("price_list").select("*").order("name");
  if (priceError) throw priceError;

  const priceRowsTyped = (priceRows ?? []) as PriceListRow[];
  const resolvedPriceListIds = uniqueNonEmpty(priceRowsTyped.map((row) => row.id));
  const { data: priceLineRows, error: priceLineError } = resolvedPriceListIds.length
    ? await supabase.from("price_list_line").select("*").in("price_list_id", resolvedPriceListIds).order("line_no")
    : { data: [], error: null };
  if (priceLineError) throw priceLineError;

  const bookingLines = (bookingLineRows.data ?? []) as ServiceBookingLineRowDb[];
  const priceLines = (priceLineRows ?? []) as PriceListLineRow[];

  return {
    claim,
    claims: [claim],
    clients: (clientRows as Parameters<typeof clientFromRow>[0][]).map((row) =>
      clientFromRow(row, [], [], [], [], [], [], [], [], [])
    ),
    serviceBookings: (bookingRows as ServiceBookingRow[]).map((row) =>
      normalizeServiceBooking(
        serviceBookingFromRow(
          row,
          bookingLines.filter((line) => line.service_booking_id === row.id)
        )
      )
    ),
    products,
    priceLists: priceRowsTyped.map((row) =>
      normalizePriceList(priceListFromRow(row, priceLines.filter((line) => line.price_list_id === row.id)))
    ),
  };
}

export type PayrollExportData = Pick<AppData, "timesheets" | "employees" | "clients" | "locations" | "rosterShifts">;

export async function fetchPayrollExportData(
  supabase: SupabaseClient,
  timesheetIds: string[]
): Promise<PayrollExportData> {
  const ids = uniqueNonEmpty(timesheetIds);
  if (!ids.length) return { timesheets: [], employees: [], clients: [], locations: [], rosterShifts: [] };

  const [timesheetRows, lineRows] = await Promise.all([
    selectRowsByIds<TimesheetRow>(supabase, "timesheet", ids),
    supabase.from("timesheet_line").select("*").in("timesheet_id", ids).order("line_no"),
  ]);
  if (lineRows.error) throw lineRows.error;

  const lines = (lineRows.data ?? []) as TimesheetLineRowDb[];
  const timesheets = (timesheetRows as TimesheetRow[]).map((row) =>
    normalizeTimesheet(timesheetFromRow(row, lines.filter((line) => line.timesheet_id === row.id)))
  );

  const employeeIds = uniqueNonEmpty(timesheets.map((sheet) => sheet.employeeId));
  const clientIds = uniqueNonEmpty(timesheets.flatMap((sheet) => sheet.lines.map((line) => line.clientId)));
  const locationIds = uniqueNonEmpty(timesheets.flatMap((sheet) => sheet.lines.map((line) => line.locationId)));
  const rosterShiftIds = uniqueNonEmpty(timesheets.flatMap((sheet) => sheet.lines.map((line) => line.rosterShiftId)));

  const [employeeRows, clientRows, locationRows, rosterRows] = await Promise.all([
    selectRowsByIds(supabase, "employee", employeeIds),
    selectRowsByIds(supabase, "client", clientIds),
    selectRowsByIds(supabase, "support_location", locationIds),
    selectRowsByIds<RosterShiftRow>(supabase, "roster_shift", rosterShiftIds),
  ]);

  return {
    timesheets,
    employees: (employeeRows as Parameters<typeof employeeFromRow>[0][]).map((row) => normalizeEmployee(employeeFromRow(row))),
    clients: (clientRows as Parameters<typeof clientFromRow>[0][]).map((row) =>
      clientFromRow(row, [], [], [], [], [], [], [], [], [])
    ),
    locations: (locationRows as Parameters<typeof locationFromRow>[0][]).map((row) =>
      normalizeLocation(
        locationFromRow(row, {
          alerts: [],
          clientLinks: [],
          employeeLinks: [],
          productLinks: [],
          activities: [],
        })
      )
    ),
    rosterShifts: (rosterRows as RosterShiftRow[]).map((row) => normalizeRosterShift(rosterShiftFromRow(row))),
  };
}

/** Minimal location load for employee/client link scope checks (server-side access). */
export async function fetchSupportLocationsForScope(supabase: SupabaseClient): Promise<LocationRecord[]> {
  const [supportLocationsRes, supportLocationClientsRes, supportLocationEmployeesRes] = await Promise.all([
    supabase.from("support_location").select("*").order("search_key"),
    supabase.from("support_location_client").select("*").order("line_no"),
    supabase.from("support_location_employee").select("*").order("line_no"),
  ]);
  if (supportLocationsRes.error) throw supportLocationsRes.error;
  if (supportLocationClientsRes.error) throw supportLocationClientsRes.error;
  if (supportLocationEmployeesRes.error) throw supportLocationEmployeesRes.error;

  const clientsByLocation = groupBy(supportLocationClientsRes.data as SupportLocationClientRowDb[], "location_id");
  const employeesByLocation = groupBy(supportLocationEmployeesRes.data as SupportLocationEmployeeRowDb[], "location_id");

  return ((supportLocationsRes.data ?? []) as SupportLocationRow[]).map((row) =>
    normalizeLocation(
      locationFromRow(row, {
        alerts: [],
        clientLinks: clientsByLocation.get(row.id) ?? [],
        employeeLinks: employeesByLocation.get(row.id) ?? [],
        productLinks: [],
        activities: [],
      })
    )
  );
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
    businessPartnersRes,
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
    rosterShiftClientLinesRes,
    rosterShiftWorkerLinesRes,
    rosterShiftRequestsRes,
    agencyWorkersRes,
    agencyShiftRequestsRes,
    siteOrientationsRes,
    agencyTimesheetsRes,
    agencyTimesheetLinesRes,
    vendorInvoicesRes,
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
    planMedicationsRes,
    planDiagnosesRes,
    planHealthPlansRes,
    planSupportRequirementsRes,
    planAssistiveTechnologyRes,
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
    payPeriodDefinitionsRes,
    payPeriodInstancesRes,
    financialClosedMonthsRes,
    fleetVehiclesRes,
    fleetServiceRecordsRes,
    fleetInspectionsRes,
    fleetFuelLogsRes,
    fleetBookingsRes,
  ] = await Promise.all([
    supabase.from("enquiry").select("*").order("date_received", { ascending: false }),
    supabase.from("enquiry_activity").select("*").order("line_no"),
    supabase.from("incident").select("*").order("occurred_at", { ascending: false }),
    supabase.from("incident_party").select("*").order("line_no"),
    supabase.from("incident_action").select("*").order("line_no"),
    supabase.from("incident_notification").select("*").order("line_no"),
    supabase.from("incident_evidence").select("*").order("line_no"),
    supabase.from("client").select("*").order("search_key"),
    supabase.from("business_partner").select("*").order("search_key"),
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
    supabase.from("roster_shift_client_line").select("*").order("line_no"),
    supabase.from("roster_shift_worker_line").select("*").order("line_no"),
    supabase.from("roster_shift_request").select("*").order("submitted_at", { ascending: false }),
    supabase.from("agency_worker").select("*").order("name"),
    supabase.from("agency_shift_request").select("*").order("document_no", { ascending: false }),
    supabase.from("site_orientation").select("*").order("oriented_at", { ascending: false }),
    supabase.from("agency_timesheet").select("*").order("period_start", { ascending: false }),
    supabase.from("agency_timesheet_line").select("*").order("line_no"),
    supabase.from("vendor_invoice").select("*").order("document_no", { ascending: false }),
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
    supabase.from("support_plan_medication").select("*").order("line_no"),
    supabase.from("support_plan_diagnosis").select("*").order("line_no"),
    supabase.from("support_plan_health_plan").select("*").order("line_no"),
    supabase.from("support_plan_support_requirement").select("*").order("line_no"),
    supabase.from("support_plan_assistive_technology").select("*").order("line_no"),
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
    supabase.from("pay_period_definition").select("*").order("name"),
    supabase.from("pay_period_instance").select("*").order("start_date"),
    supabase.from("financial_closed_month").select("*").order("close_month", { ascending: false }),
    supabase.from("fleet_vehicle").select("*").order("search_key"),
    supabase.from("fleet_service_record").select("*").order("line_no"),
    supabase.from("fleet_inspection").select("*").order("inspection_date", { ascending: false }),
    supabase.from("fleet_fuel_log").select("*").order("line_no"),
    supabase.from("fleet_booking").select("*").order("start_datetime", { ascending: false }),
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
    businessPartnersRes.error ??
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
    rosterShiftClientLinesRes.error ??
    rosterShiftWorkerLinesRes.error ??
    rosterShiftRequestsRes.error ??
    agencyWorkersRes.error ??
    agencyShiftRequestsRes.error ??
    siteOrientationsRes.error ??
    agencyTimesheetsRes.error ??
    agencyTimesheetLinesRes.error ??
    vendorInvoicesRes.error ??
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
    planMedicationsRes.error ??
    planDiagnosesRes.error ??
    planHealthPlansRes.error ??
    planSupportRequirementsRes.error ??
    planAssistiveTechnologyRes.error ??
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
    payrollClosedPeriodsRes.error ??
    payPeriodDefinitionsRes.error ??
    payPeriodInstancesRes.error ??
    financialClosedMonthsRes.error ??
    fleetVehiclesRes.error ??
    fleetServiceRecordsRes.error ??
    fleetInspectionsRes.error ??
    fleetFuelLogsRes.error ??
    fleetBookingsRes.error;

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
  const clientLinesByShift = groupBy(
    rosterShiftClientLinesRes.data as RosterShiftClientLineRow[],
    "roster_shift_id"
  );
  const workerLinesByShift = groupBy(
    rosterShiftWorkerLinesRes.data as RosterShiftWorkerLineRow[],
    "roster_shift_id"
  );
  const linesByTimesheet = groupBy(timesheetLinesRes.data as TimesheetLineRowDb[], "timesheet_id");
  const linesByAgencyTimesheet = groupBy(
    agencyTimesheetLinesRes.data as AgencyTimesheetLineRowDb[],
    "agency_timesheet_id"
  );
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
  const medicationsByPlan = groupBy(planMedicationsRes.data as SupportPlanMedicationRowDb[], "support_plan_id");
  const diagnosesByPlan = groupBy(planDiagnosesRes.data as SupportPlanDiagnosisRowDb[], "support_plan_id");
  const healthPlansByPlan = groupBy(planHealthPlansRes.data as SupportPlanHealthPlanRowDb[], "support_plan_id");
  const supportRequirementsByPlan = groupBy(
    planSupportRequirementsRes.data as SupportPlanSupportRequirementRowDb[],
    "support_plan_id"
  );
  const assistiveTechnologyByPlan = groupBy(
    planAssistiveTechnologyRes.data as SupportPlanAssistiveTechnologyRowDb[],
    "support_plan_id"
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
  const serviceRecordsByVehicle = groupBy(fleetServiceRecordsRes.data as FleetServiceRecordRowDb[], "vehicle_id");
  const inspectionsByVehicle = groupBy(fleetInspectionsRes.data as FleetInspectionRowDb[], "vehicle_id");
  const fuelLogsByVehicle = groupBy(fleetFuelLogsRes.data as FleetFuelLogRowDb[], "vehicle_id");
  const boardReporting = await fetchBoardReporting(supabase);

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
    businessPartners: ((businessPartnersRes.data ?? []) as BusinessPartnerRow[]).map((row) =>
      normalizeBusinessPartner(businessPartnerFromRow(row))
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
      normalizeRosterShift({
        ...rosterShiftFromRow(row),
        clientLines: (clientLinesByShift.get(row.id) ?? []).map((line) =>
          rosterShiftClientLineFromRow(line)
        ),
        workerLines: (workerLinesByShift.get(row.id) ?? []).map((line) =>
          rosterShiftWorkerLineFromRow(line)
        ),
      })
    ),
    rosterShiftRequests: ((rosterShiftRequestsRes.data ?? []) as RosterShiftRequestRow[]).map((row) =>
      normalizeShiftRequest(rosterShiftRequestFromRow(row))
    ),
    agencyWorkers: ((agencyWorkersRes.data ?? []) as AgencyWorkerRow[]).map((row) =>
      normalizeAgencyWorker(agencyWorkerFromRow(row))
    ),
    agencyShiftRequests: ((agencyShiftRequestsRes.data ?? []) as AgencyShiftRequestRow[]).map((row) =>
      normalizeAgencyShiftRequest(agencyShiftRequestFromRow(row))
    ),
    siteOrientations: ((siteOrientationsRes.data ?? []) as SiteOrientationRow[]).map((row) =>
      normalizeSiteOrientation(siteOrientationFromRow(row))
    ),
    agencyTimesheets: ((agencyTimesheetsRes.data ?? []) as AgencyTimesheetRow[]).map((row) =>
      normalizeAgencyTimesheet(
        agencyTimesheetFromRow(row, linesByAgencyTimesheet.get(row.id) ?? [])
      )
    ),
    vendorInvoices: ((vendorInvoicesRes.data ?? []) as VendorInvoiceRow[]).map((row) =>
      normalizeVendorInvoice(vendorInvoiceFromRow(row))
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
    payPeriodDefinitions: ((payPeriodDefinitionsRes.data ?? []) as PayPeriodDefinitionRow[]).map(
      payPeriodDefinitionFromRow
    ),
    payPeriodInstances: ((payPeriodInstancesRes.data ?? []) as PayPeriodInstanceRow[]).map(
      payPeriodInstanceFromRow
    ),
    financialClosedMonths: ((financialClosedMonthsRes.data ?? []) as FinancialClosedMonthRow[]).map(
      financialClosedMonthFromRow
    ),
    contracts: ((contractsRes.data ?? []) as ContractRow[]).map((row) =>
      normalizeContract(contractFromRow(row, auditByContract.get(row.id) ?? []))
    ),
    supportPlans: ((supportPlansRes.data ?? []) as SupportPlanRow[]).map((row) => {
      const goals = goalsByPlan.get(row.id) ?? [];
      const progressReviews = goals.flatMap((goal) => progressReviewsByGoal.get(goal.id) ?? []);
      return normalizeSupportPlan(
        supportPlanFromRow(
          row,
          goals,
          progressReviews,
          medicationsByPlan.get(row.id) ?? [],
          diagnosesByPlan.get(row.id) ?? [],
          healthPlansByPlan.get(row.id) ?? [],
          supportRequirementsByPlan.get(row.id) ?? [],
          assistiveTechnologyByPlan.get(row.id) ?? []
        )
      );
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
    fleetVehicles: ((fleetVehiclesRes.data ?? []) as FleetVehicleRowDb[]).map((row) =>
      normalizeFleetVehicle(
        fleetVehicleFromRow(row, {
          serviceRecords: serviceRecordsByVehicle.get(row.id) ?? [],
          inspections: inspectionsByVehicle.get(row.id) ?? [],
          fuelLogs: fuelLogsByVehicle.get(row.id) ?? [],
        })
      )
    ),
    fleetBookings: ((fleetBookingsRes.data ?? []) as FleetBookingRowDb[]).map(fleetBookingFromRow),
    boardReportTemplates: boardReporting.templates,
    boardReportPacks: boardReporting.packs,
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
        likelihood: r.likelihood || "",
        consequence: r.consequence || "",
        controls: r.controls || "",
        emergency_response: r.emergencyResponse || "",
        escalation_process: r.escalationProcess || "",
        review_date: r.reviewDate || null,
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
        partner_id: b.partnerId?.trim() ? b.partnerId : null,
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
        plan_provider: b.planProvider?.trim() || "This organisation",
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

// Upserts only the price_list header (no line rows). Used to break the circular
// foreign key between product.price_list_id and price_list_line.product_id: the
// header must exist before products are written, and the lines (which reference
// products) must be written after products exist.
export async function savePriceListHeader(supabase: SupabaseClient, record: PriceListRecord) {
  const list = normalizePriceList(record);
  const { error } = await supabase.from("price_list").upsert(priceListToRow(list));
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

export async function fetchNdisPriceImportBatches(supabase: SupabaseClient): Promise<NdisPriceImportBatch[]> {
  const { data, error } = await supabase
    .from("ndis_price_import_batch")
    .select("*")
    .order("imported_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as NdisPriceImportBatchRow[]).map(ndisPriceImportBatchFromRow);
}

export async function fetchNdisPriceImportRows(
  supabase: SupabaseClient,
  batchId: string
): Promise<NdisPriceImportRow[]> {
  const { data, error } = await supabase
    .from("ndis_price_import_row")
    .select("*")
    .eq("batch_id", batchId)
    .order("row_no");
  if (error) throw error;
  return ((data ?? []) as NdisPriceImportRowDb[]).map(ndisPriceImportRowFromRow);
}

export async function saveNdisPriceImportBatch(
  supabase: SupabaseClient,
  batch: NdisPriceImportBatch,
  rows: NdisPriceImportRow[] = []
) {
  const { error } = await supabase.from("ndis_price_import_batch").upsert(ndisPriceImportBatchToRow(batch));
  if (error) throw error;

  await replaceChildRows(supabase, "ndis_price_import_row", "batch_id", batch.id);
  if (rows.length) {
    const { error: rowsError } = await supabase
      .from("ndis_price_import_row")
      .insert(rows.map(ndisPriceImportRowToRow));
    if (rowsError) throw rowsError;
  }
}

export async function fetchPriceUpdateRuns(supabase: SupabaseClient): Promise<PriceUpdateRun[]> {
  const { data, error } = await supabase
    .from("price_update_run")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PriceUpdateRunRow[]).map(priceUpdateRunFromRow);
}

export async function fetchPriceUpdateImpacts(supabase: SupabaseClient, runId: string): Promise<PriceUpdateImpact[]> {
  const { data, error } = await supabase
    .from("price_update_impact")
    .select("*")
    .eq("run_id", runId)
    .order("entity_type");
  if (error) throw error;
  return ((data ?? []) as PriceUpdateImpactRow[]).map(priceUpdateImpactFromRow);
}

export async function savePriceUpdateRun(
  supabase: SupabaseClient,
  run: PriceUpdateRun,
  impacts: PriceUpdateImpact[] = []
) {
  const { error } = await supabase.from("price_update_run").upsert(priceUpdateRunToRow(run));
  if (error) throw error;

  await replaceChildRows(supabase, "price_update_impact", "run_id", run.id);
  if (impacts.length) {
    const { error: impactError } = await supabase
      .from("price_update_impact")
      .insert(impacts.map(priceUpdateImpactToRow));
    if (impactError) throw impactError;
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

  await replaceChildRows(supabase, "roster_shift_client_line", "roster_shift_id", shift.id);
  if (shift.clientLines?.length) {
    const { error: clientLineError } = await supabase
      .from("roster_shift_client_line")
      .insert(shift.clientLines.map((line) => rosterShiftClientLineToRow(shift.id, line)));
    if (clientLineError) throw clientLineError;
  }

  await replaceChildRows(supabase, "roster_shift_worker_line", "roster_shift_id", shift.id);
  if (shift.workerLines?.length) {
    const { error: workerLineError } = await supabase
      .from("roster_shift_worker_line")
      .insert(shift.workerLines.map((line) => rosterShiftWorkerLineToRow(shift.id, line)));
    if (workerLineError) throw workerLineError;
  }
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
      open_fill_status: shift.openFillStatus || "Filled",
      updated_by: shift.updatedBy,
    })
    .eq("id", shift.id)
    .is("employee_id", null)
    .select("id");
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

export async function saveRosterShiftRequest(
  supabase: SupabaseClient,
  record: RosterShiftRequestRecord
) {
  const row = rosterShiftRequestToRow(normalizeShiftRequest(record));
  const { error } = await supabase.from("roster_shift_request").upsert(row);
  if (error) throw error;
}

export async function saveRosterShiftRequests(
  supabase: SupabaseClient,
  records: RosterShiftRequestRecord[]
) {
  if (!records.length) return;
  const rows = records.map((record) => rosterShiftRequestToRow(normalizeShiftRequest(record)));
  const { error } = await supabase.from("roster_shift_request").upsert(rows);
  if (error) throw error;
}

/** Approve one request and assign worker atomically when shift is still vacant. */
export async function approveVacantShiftRequest(
  supabase: SupabaseClient,
  shift: RosterShiftRecord,
  request: RosterShiftRequestRecord,
  otherRejected: RosterShiftRequestRecord[]
): Promise<boolean> {
  const normalizedShift = normalizeRosterShift(shift);
  const { data, error } = await supabase
    .from("roster_shift")
    .update({
      employee_id: normalizedShift.employeeId?.trim() ? normalizedShift.employeeId : null,
      status: normalizedShift.status,
      open_fill_status: "Filled",
      updated_by: normalizedShift.updatedBy,
    })
    .eq("id", normalizedShift.id)
    .is("employee_id", null)
    .select("id");
  if (error) throw error;
  if (!data?.length) return false;
  await saveRosterShiftRequest(supabase, request);
  await saveRosterShiftRequests(supabase, otherRejected);
  return true;
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
  for (const record of records) {
    await saveRosterShift(supabase, record);
  }
}

export async function saveAgencyWorker(supabase: SupabaseClient, record: AgencyWorkerRecord) {
  const worker = normalizeAgencyWorker(record);
  const { error } = await supabase.from("agency_worker").upsert(agencyWorkerToRow(worker));
  if (error) throw error;
}

export async function saveAgencyShiftRequest(supabase: SupabaseClient, record: AgencyShiftRequestRecord) {
  const request = normalizeAgencyShiftRequest(record);
  const { error } = await supabase.from("agency_shift_request").upsert(agencyShiftRequestToRow(request));
  if (error) throw error;
}

export async function saveSiteOrientation(supabase: SupabaseClient, record: SiteOrientationRecord) {
  const orientation = normalizeSiteOrientation(record);
  const { error } = await supabase.from("site_orientation").upsert(siteOrientationToRow(orientation));
  if (error) throw error;
}

export async function saveAgencyTimesheet(supabase: SupabaseClient, record: AgencyTimesheetRecord) {
  const sheet = normalizeAgencyTimesheet(record);
  const { error } = await supabase.from("agency_timesheet").upsert(agencyTimesheetToRow(sheet));
  if (error) throw error;

  await replaceChildRows(supabase, "agency_timesheet_line", "agency_timesheet_id", sheet.id);
  if (sheet.lines.length) {
    const { error: lineError } = await supabase
      .from("agency_timesheet_line")
      .insert(sheet.lines.map((line) => agencyTimesheetLineToRow(sheet.id, line)));
    if (lineError) throw lineError;
  }
}

export async function saveAgencyTimesheets(supabase: SupabaseClient, records: AgencyTimesheetRecord[]) {
  for (const record of records) {
    await saveAgencyTimesheet(supabase, record);
  }
}

export async function saveVendorInvoice(supabase: SupabaseClient, record: VendorInvoiceRecord) {
  const invoice = normalizeVendorInvoice(record);
  const { error } = await supabase.from("vendor_invoice").upsert(vendorInvoiceToRow(invoice));
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

export async function saveBusinessPartner(supabase: SupabaseClient, record: BusinessPartnerRecord) {
  const partner = normalizeBusinessPartner(record);
  const { error } = await supabase.from("business_partner").upsert(businessPartnerToRow(partner));
  if (error) throw error;
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
        ndis_category: g.ndisCategory,
        why_it_matters: g.whyItMatters,
        success_measures: g.successMeasures,
        start_date: g.startDate || null,
        end_date: g.endDate || null,
      }))
    );
    if (goalError) throw goalError;
  }

  for (const child of [
    ["support_plan_medication", plan.medications ?? []] as const,
    ["support_plan_diagnosis", plan.diagnoses ?? []] as const,
    ["support_plan_health_plan", plan.healthPlans ?? []] as const,
    ["support_plan_support_requirement", plan.supportRequirements ?? []] as const,
    ["support_plan_assistive_technology", plan.assistiveTechnology ?? []] as const,
  ]) {
    await replaceChildRows(supabase, child[0], "support_plan_id", plan.id);
  }

  if (plan.medications?.length) {
    const { error: medError } = await supabase.from("support_plan_medication").insert(
      plan.medications.map((m) => ({
        id: m.id,
        support_plan_id: plan.id,
        line_no: m.lineNo,
        medication_name: m.medicationName,
        dosage: m.dosage,
        purpose: m.purpose,
        administration_requirements: m.administrationRequirements,
      }))
    );
    if (medError) throw medError;
  }

  if (plan.diagnoses?.length) {
    const { error: dxError } = await supabase.from("support_plan_diagnosis").insert(
      plan.diagnoses.map((d) => ({
        id: d.id,
        support_plan_id: plan.id,
        line_no: d.lineNo,
        diagnosis: d.diagnosis,
        condition: d.condition,
        treating_practitioner: d.treatingPractitioner,
        impact_on_daily_living: d.impactOnDailyLiving,
      }))
    );
    if (dxError) throw dxError;
  }

  if (plan.healthPlans?.length) {
    const { error: hpError } = await supabase.from("support_plan_health_plan").insert(
      plan.healthPlans.map((h) => ({
        id: h.id,
        support_plan_id: plan.id,
        line_no: h.lineNo,
        plan_type: h.planType,
        attachment_reference: h.attachmentReference,
        notes: h.notes,
      }))
    );
    if (hpError) throw hpError;
  }

  if (plan.supportRequirements?.length) {
    const { error: reqError } = await supabase.from("support_plan_support_requirement").insert(
      plan.supportRequirements.map((r) => ({
        id: r.id,
        support_plan_id: plan.id,
        line_no: r.lineNo,
        support_area: r.supportArea,
        support_requirement: r.supportRequirement,
        level_of_assistance: r.levelOfAssistance,
        frequency: r.frequency,
        special_instructions: r.specialInstructions,
      }))
    );
    if (reqError) throw reqError;
  }

  if (plan.assistiveTechnology?.length) {
    const { error: atError } = await supabase.from("support_plan_assistive_technology").insert(
      plan.assistiveTechnology.map((a) => ({
        id: a.id,
        support_plan_id: plan.id,
        line_no: a.lineNo,
        equipment: a.equipment,
        serial_number: a.serialNumber,
        maintenance_schedule: a.maintenanceSchedule,
        training_required: a.trainingRequired,
      }))
    );
    if (atError) throw atError;
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

export async function savePayPeriodDefinition(supabase: SupabaseClient, record: PayPeriodDefinitionRecord) {
  const definition = normalizePayPeriodDefinition(record);
  const { error } = await supabase.from("pay_period_definition").upsert(payPeriodDefinitionToRow(definition));
  if (error) throw error;

  const { data: existingRows, error: fetchError } = await supabase
    .from("pay_period_instance")
    .select("*")
    .eq("definition_id", definition.id);
  if (fetchError) throw fetchError;

  const existing = ((existingRows ?? []) as PayPeriodInstanceRow[]).map(payPeriodInstanceFromRow);
  const instances = generatePayPeriodInstances(definition, { existing });

  await replaceChildRows(supabase, "pay_period_instance", "definition_id", definition.id);

  if (instances.length) {
    const { error: insertError } = await supabase
      .from("pay_period_instance")
      .insert(instances.map(payPeriodInstanceToRow));
    if (insertError) throw insertError;
  }
}

export async function savePayPeriodInstance(supabase: SupabaseClient, record: PayPeriodInstanceRecord) {
  const { error } = await supabase.from("pay_period_instance").upsert(payPeriodInstanceToRow(record));
  if (error) throw error;
}

export async function savePayPeriodInstances(supabase: SupabaseClient, records: PayPeriodInstanceRecord[]) {
  if (!records.length) return;
  const { error } = await supabase.from("pay_period_instance").upsert(records.map(payPeriodInstanceToRow));
  if (error) throw error;
}

export async function saveFinancialClosedMonth(supabase: SupabaseClient, record: FinancialClosedMonthRecord) {
  const { error } = await supabase.from("financial_closed_month").upsert(financialClosedMonthToRow(record));
  if (error) throw error;
}

export async function fetchBoardReporting(supabase: SupabaseClient) {
  const [templatesRes, templateSectionsRes, packsRes, packSectionsRes] = await Promise.all([
    supabase.from("board_report_template").select("*").order("name"),
    supabase.from("board_report_template_section").select("*").order("sort_order"),
    supabase.from("board_report_pack").select("*").order("report_period", { ascending: false }),
    supabase.from("board_report_pack_section").select("*").order("sort_order"),
  ]);
  if (templatesRes.error) throw templatesRes.error;
  if (templateSectionsRes.error) throw templateSectionsRes.error;
  if (packsRes.error) throw packsRes.error;
  if (packSectionsRes.error) throw packSectionsRes.error;

  const templates = ((templatesRes.data ?? []) as BoardReportTemplateRow[]).map((row) =>
    boardReportTemplateFromRows(row, (templateSectionsRes.data ?? []) as BoardReportTemplateSectionRow[])
  );
  const packs = ((packsRes.data ?? []) as BoardReportPackRow[]).map((row) =>
    boardReportPackFromRows(row, (packSectionsRes.data ?? []) as BoardReportPackSectionRow[])
  );

  return { templates, packs };
}

export async function saveBoardReportPack(supabase: SupabaseClient, record: BoardReportPackRecord) {
  const row = boardReportPackToRow(record);
  const { error } = await supabase.from("board_report_pack").upsert(row);
  if (error) throw error;

  await replaceChildRows(supabase, "board_report_pack_section", "pack_id", record.id);
  if (record.sections.length) {
    const { error: sectionError } = await supabase
      .from("board_report_pack_section")
      .insert(record.sections.map((section) => boardReportPackSectionToRow(section, record.id)));
    if (sectionError) throw sectionError;
  }
}

export async function fetchDocumentPlatform(supabase: SupabaseClient) {
  const [templatesRes, blocksRes, bindingsRes, generatedRes] = await Promise.all([
    supabase.from("app_document_template").select("*").order("name"),
    supabase.from("app_document_template_block").select("*").order("sort_order"),
    supabase.from("app_process_document_binding").select("*"),
    supabase.from("app_generated_document").select("*").order("generated_at", { ascending: false }).limit(500),
  ]);
  if (templatesRes.error) throw templatesRes.error;
  if (blocksRes.error) throw blocksRes.error;
  if (bindingsRes.error) throw bindingsRes.error;
  if (generatedRes.error) throw generatedRes.error;

  const blocksByTemplate = new Map<string, import("@/lib/supabase/document-mappers").DocumentTemplateBlockRow[]>();
  for (const block of (blocksRes.data ?? []) as import("@/lib/supabase/document-mappers").DocumentTemplateBlockRow[]) {
    const list = blocksByTemplate.get(block.template_id) ?? [];
    list.push(block);
    blocksByTemplate.set(block.template_id, list);
  }

  const templates = ((templatesRes.data ?? []) as import("@/lib/supabase/document-mappers").DocumentTemplateRow[]).map(
    (row) =>
      documentTemplateFromRow(row, blocksByTemplate.get(row.id) ?? [])
  );

  const bindings = ((bindingsRes.data ?? []) as import("@/lib/supabase/document-mappers").ProcessDocumentBindingRow[]).map(
    processDocumentBindingFromRow
  );

  const generatedDocuments = (
    (generatedRes.data ?? []) as import("@/lib/supabase/document-mappers").GeneratedDocumentRow[]
  ).map(generatedDocumentFromRow);

  return { templates, bindings, generatedDocuments };
}

export async function saveDocumentTemplate(supabase: SupabaseClient, record: DocumentTemplateRecord) {
  const row = documentTemplateToRow(record);
  const { error } = await supabase.from("app_document_template").upsert(row);
  if (error) throw error;

  await replaceChildRows(supabase, "app_document_template_block", "template_id", record.id);
  if (record.blocks.length) {
    const { error: blockError } = await supabase
      .from("app_document_template_block")
      .insert(record.blocks.map(documentTemplateBlockToRow));
    if (blockError) throw blockError;
  }
}

export async function saveProcessDocumentBinding(
  supabase: SupabaseClient,
  record: ProcessDocumentBindingRecord
) {
  const { error } = await supabase.from("app_process_document_binding").upsert(processDocumentBindingToRow(record));
  if (error) throw error;
}

export async function saveGeneratedDocument(supabase: SupabaseClient, record: GeneratedDocumentRecord) {
  const { error } = await supabase.from("app_generated_document").upsert(generatedDocumentToRow(record));
  if (error) throw error;
}

export async function saveFleetVehicle(supabase: SupabaseClient, record: FleetVehicleRecord) {
  const normalized = normalizeFleetVehicle(record);
  const { error } = await supabase.from("fleet_vehicle").upsert(fleetVehicleToRow(normalized));
  if (error) throw error;

  await replaceChildRows(supabase, "fleet_service_record", "vehicle_id", normalized.id);
  if (normalized.serviceRecords.length) {
    const { error: svcError } = await supabase.from("fleet_service_record").insert(
      normalized.serviceRecords.map((row) => fleetServiceRecordToRow(normalized.id, row))
    );
    if (svcError) throw svcError;
  }

  await replaceChildRows(supabase, "fleet_inspection", "vehicle_id", normalized.id);
  if (normalized.inspections.length) {
    const { error: inspError } = await supabase.from("fleet_inspection").insert(
      normalized.inspections.map((row) => fleetInspectionToRow(normalized.id, row))
    );
    if (inspError) throw inspError;
  }

  await replaceChildRows(supabase, "fleet_fuel_log", "vehicle_id", normalized.id);
  if (normalized.fuelLogs.length) {
    const { error: fuelError } = await supabase.from("fleet_fuel_log").insert(
      normalized.fuelLogs.map((row) => fleetFuelLogToRow(normalized.id, row))
    );
    if (fuelError) throw fuelError;
  }
}

export async function saveFleetBooking(supabase: SupabaseClient, record: FleetBookingRow) {
  const { error } = await supabase.from("fleet_booking").upsert(fleetBookingToRow(record));
  if (error) throw error;
}
