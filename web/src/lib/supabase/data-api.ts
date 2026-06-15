import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientRecord } from "@/lib/client";
import { normalizeClient } from "@/lib/client";
import type { ContractRecord } from "@/lib/contract";
import { normalizeContract } from "@/lib/contract";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { EmployeeRecord } from "@/lib/employee";
import { normalizeEmployee } from "@/lib/employee";
import type { PriceListRecord, ProductRecord } from "@/lib/product";
import { normalizePriceList } from "@/lib/product";
import type { ServiceAgreementRecord } from "@/lib/service-agreement";
import { normalizeServiceAgreement } from "@/lib/service-agreement";
import type { PlanAssessmentDocument, SupportPlanRecord } from "@/lib/support-plan";
import { normalizeSupportPlan } from "@/lib/support-plan";
import {
  clientFromRow,
  clientToRow,
  contractFromRow,
  contractToRow,
  employeeFromRow,
  employeeToRow,
  enquiryFromRow,
  enquiryToRow,
  planDocumentFromRow,
  priceListFromRow,
  priceListLineToRow,
  priceListToRow,
  productFromRow,
  productToRow,
  serviceAgreementFromRow,
  serviceAgreementLineToRow,
  serviceAgreementToRow,
  supportPlanFromRow,
  supportPlanToRow,
  type ClientActivityRowDb,
  type ClientAlertRow,
  type ClientLocationRowDb,
  type ClientRow,
  type ContractAuditRowDb,
  type ContractRow,
  type EnquiryRow,
  type EmployeeRow,
  type EmployeeCredentialRowDb,
  type PlanAssessmentDocumentRow,
  type PriceListLineRow,
  type PriceListRow,
  type ProductRow,
  type ServiceAgreementLineRow,
  type ServiceAgreementRow,
  type SupportPlanGoalRow,
  type SupportPlanRow,
} from "@/lib/supabase/mappers";

export type AppData = {
  enquiries: EnquiryRecord[];
  clients: ClientRecord[];
  contracts: ContractRecord[];
  products: ProductRecord[];
  priceLists: PriceListRecord[];
  serviceAgreements: ServiceAgreementRecord[];
  supportPlans: SupportPlanRecord[];
  planDocuments: PlanAssessmentDocument[];
  employees: EmployeeRecord[];
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
    clientsRes,
    alertsRes,
    activityRes,
    locationsRes,
    productsRes,
    priceListsRes,
    priceLinesRes,
    agreementsRes,
    agreementLinesRes,
    contractsRes,
    auditRes,
    supportPlansRes,
    goalsRes,
    planDocsRes,
    employeesRes,
    employeeCredsRes,
  ] = await Promise.all([
    supabase.from("enquiry").select("*").order("date_received", { ascending: false }),
    supabase.from("client").select("*").order("search_key"),
    supabase.from("client_alert").select("*").order("line_no"),
    supabase.from("client_activity").select("*").order("line_no"),
    supabase.from("client_location").select("*").order("line_no"),
    supabase.from("product").select("*").order("search_key"),
    supabase.from("price_list").select("*").order("name"),
    supabase.from("price_list_line").select("*").order("line_no"),
    supabase.from("service_agreement").select("*").order("search_key"),
    supabase.from("service_agreement_line").select("*").order("line_no"),
    supabase.from("contract").select("*").order("document_no"),
    supabase.from("contract_audit").select("*").order("line_no"),
    supabase.from("support_plan").select("*").order("document_no"),
    supabase.from("support_plan_goal").select("*").order("line_no"),
    supabase.from("plan_assessment_document").select("*").order("document_no"),
    supabase.from("employee").select("*").order("last_name").order("first_name"),
    supabase.from("employee_credential").select("*").order("line_no"),
  ]);

  const firstError =
    enquiriesRes.error ??
    clientsRes.error ??
    alertsRes.error ??
    activityRes.error ??
    locationsRes.error ??
    productsRes.error ??
    priceListsRes.error ??
    priceLinesRes.error ??
    agreementsRes.error ??
    agreementLinesRes.error ??
    contractsRes.error ??
    auditRes.error ??
    supportPlansRes.error ??
    goalsRes.error ??
    planDocsRes.error ??
    employeesRes.error ??
    employeeCredsRes.error;

  if (firstError) throw firstError;

  const alertsByClient = groupBy(alertsRes.data as ClientAlertRow[], "client_id");
  const activityByClient = groupBy(activityRes.data as ClientActivityRowDb[], "client_id");
  const locationsByClient = groupBy(locationsRes.data as ClientLocationRowDb[], "client_id");
  const linesByPriceList = groupBy(priceLinesRes.data as PriceListLineRow[], "price_list_id");
  const linesByAgreement = groupBy(agreementLinesRes.data as ServiceAgreementLineRow[], "service_agreement_id");
  const auditByContract = groupBy(auditRes.data as ContractAuditRowDb[], "contract_id");
  const goalsByPlan = groupBy(goalsRes.data as SupportPlanGoalRow[], "support_plan_id");
  const credsByEmployee = groupBy(employeeCredsRes.data as EmployeeCredentialRowDb[], "employee_id");

  return {
    enquiries: ((enquiriesRes.data ?? []) as EnquiryRow[]).map(enquiryFromRow),
    clients: ((clientsRes.data ?? []) as ClientRow[]).map((row) =>
      normalizeClient(
        clientFromRow(
          row,
          alertsByClient.get(row.id) ?? [],
          activityByClient.get(row.id) ?? [],
          locationsByClient.get(row.id) ?? []
        )
      )
    ),
    products: ((productsRes.data ?? []) as ProductRow[]).map(productFromRow),
    priceLists: ((priceListsRes.data ?? []) as PriceListRow[]).map((row) =>
      normalizePriceList(priceListFromRow(row, linesByPriceList.get(row.id) ?? []))
    ),
    serviceAgreements: ((agreementsRes.data ?? []) as ServiceAgreementRow[]).map((row) =>
      normalizeServiceAgreement(serviceAgreementFromRow(row, linesByAgreement.get(row.id) ?? []))
    ),
    contracts: ((contractsRes.data ?? []) as ContractRow[]).map((row) =>
      normalizeContract(contractFromRow(row, auditByContract.get(row.id) ?? []))
    ),
    supportPlans: ((supportPlansRes.data ?? []) as SupportPlanRow[]).map((row) =>
      normalizeSupportPlan(supportPlanFromRow(row, goalsByPlan.get(row.id) ?? []))
    ),
    planDocuments: ((planDocsRes.data ?? []) as PlanAssessmentDocumentRow[]).map(planDocumentFromRow),
    employees: ((employeesRes.data ?? []) as EmployeeRow[]).map((row) =>
      normalizeEmployee(employeeFromRow(row, credsByEmployee.get(row.id) ?? []))
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
}

export async function saveClient(supabase: SupabaseClient, record: ClientRecord) {
  const client = normalizeClient(record);
  const { error } = await supabase.from("client").upsert(clientToRow(client));
  if (error) throw error;

  await replaceChildRows(supabase, "client_alert", "client_id", client.id);
  await replaceChildRows(supabase, "client_activity", "client_id", client.id);
  await replaceChildRows(supabase, "client_location", "client_id", client.id);

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
        notes: c.notes,
        created_by: c.createdBy,
        updated_by: c.updatedBy,
      }))
    );
    if (credError) throw credError;
  }
}
