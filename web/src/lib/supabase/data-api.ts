import type { SupabaseClient } from "@supabase/supabase-js";
import type { ClientRecord } from "@/lib/client";
import { normalizeClient } from "@/lib/client";
import type { ContractRecord } from "@/lib/contract";
import { normalizeContract } from "@/lib/contract";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { EmployeeRecord } from "@/lib/employee";
import { normalizeEmployee } from "@/lib/employee";
import type { LocationRecord } from "@/lib/location";
import { normalizeLocation } from "@/lib/location";
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
  type ClientBpAssociationRowDb,
  type ClientConsentRowDb,
  type ClientContactActivityRowDb,
  type ClientNeedRuleRowDb,
  type ClientRestrictivePracticeRowDb,
  type ClientRiskRowDb,
  type ClientLocationRowDb,
  type ClientRow,
  type ContractAuditRowDb,
  type ContractRow,
  type EnquiryActivityRowDb,
  type EnquiryRow,
  type EmployeeRow,
  type EmployeeCredentialRowDb,
  type EmployeeLocationRowDb,
  type EmployeeEmergencyContactRowDb,
  type EmployeeAlertRowDb,
  type EmployeeSkillRowDb,
  type EmployeeDocumentRowDb,
  type EmployeeActivityRowDb,
  type EmployeeLeaveEntitlementRowDb,
  type PlanAssessmentDocumentRow,
  type PriceListLineRow,
  type PriceListRow,
  type ProductRow,
  type ServiceAgreementLineRow,
  type ServiceAgreementRow,
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
    productsRes,
    priceListsRes,
    priceLinesRes,
    agreementsRes,
    agreementLinesRes,
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
    supportLocationsRes,
    supportLocationAlertsRes,
    supportLocationClientsRes,
    supportLocationEmployeesRes,
    supportLocationProductsRes,
    supportLocationActivitiesRes,
  ] = await Promise.all([
    supabase.from("enquiry").select("*").order("date_received", { ascending: false }),
    supabase.from("enquiry_activity").select("*").order("line_no"),
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
    supabase.from("product").select("*").order("search_key"),
    supabase.from("price_list").select("*").order("name"),
    supabase.from("price_list_line").select("*").order("line_no"),
    supabase.from("service_agreement").select("*").order("search_key"),
    supabase.from("service_agreement_line").select("*").order("line_no"),
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
    supabase.from("support_location").select("*").order("search_key"),
    supabase.from("support_location_alert").select("*").order("line_no"),
    supabase.from("support_location_client").select("*").order("line_no"),
    supabase.from("support_location_employee").select("*").order("line_no"),
    supabase.from("support_location_product").select("*").order("line_no"),
    supabase.from("support_location_activity").select("*").order("line_no"),
  ]);

  const firstError =
    enquiriesRes.error ??
    enquiryActivityRes.error ??
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
    productsRes.error ??
    priceListsRes.error ??
    priceLinesRes.error ??
    agreementsRes.error ??
    agreementLinesRes.error ??
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
    supportLocationsRes.error ??
    supportLocationAlertsRes.error ??
    supportLocationClientsRes.error ??
    supportLocationEmployeesRes.error ??
    supportLocationProductsRes.error ??
    supportLocationActivitiesRes.error;

  if (firstError) throw firstError;

  const activityByEnquiry = groupBy(enquiryActivityRes.data as EnquiryActivityRowDb[], "enquiry_id");
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
  const linesByPriceList = groupBy(priceLinesRes.data as PriceListLineRow[], "price_list_id");
  const linesByAgreement = groupBy(agreementLinesRes.data as ServiceAgreementLineRow[], "service_agreement_id");
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
  const alertsByLocation = groupBy(supportLocationAlertsRes.data as SupportLocationAlertRowDb[], "location_id");
  const clientsByLocation = groupBy(supportLocationClientsRes.data as SupportLocationClientRowDb[], "location_id");
  const employeesByLocation = groupBy(supportLocationEmployeesRes.data as SupportLocationEmployeeRowDb[], "location_id");
  const productsByLocation = groupBy(supportLocationProductsRes.data as SupportLocationProductRowDb[], "location_id");
  const activitiesByLocation = groupBy(supportLocationActivitiesRes.data as SupportLocationActivityRowDb[], "location_id");

  return {
    enquiries: ((enquiriesRes.data ?? []) as EnquiryRow[]).map((row) =>
      enquiryFromRow(row, activityByEnquiry.get(row.id) ?? [])
    ),
    clients: ((clientsRes.data ?? []) as ClientRow[]).map((row) =>
      normalizeClient(
        clientFromRow(
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
        notes: c.notes,
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
