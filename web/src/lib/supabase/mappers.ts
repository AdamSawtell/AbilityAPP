/** Map between Postgres snake_case rows and app camelCase records. */

import type { AgencyShiftRequestRecord } from "@/lib/agency-shift-request";
import { normalizeAgencyShiftRequest } from "@/lib/agency-shift-request";
import type { AgencyWorkerRecord } from "@/lib/agency-worker";
import { normalizeAgencyWorker } from "@/lib/agency-worker";
import type { SiteOrientationRecord } from "@/lib/site-orientation";
import { normalizeSiteOrientation } from "@/lib/site-orientation";
import type { ClaimLine, ClaimRecord } from "@/lib/claim";
import type { ClaimRemittanceLine, ClaimRemittanceRecord } from "@/lib/claim-remittance";
import type { InvoiceLine, InvoiceRecord } from "@/lib/invoice";
import type { BusinessPartnerRecord } from "@/lib/business-partner";
import type { ClientRecord } from "@/lib/client";
import type { ClientPlanBudgetRow } from "@/lib/client-line-tables";
import type { ContractRecord } from "@/lib/contract";
import type {
  EmployeeRecord,
  EmployeeActivityRow,
  EmployeeAlertRow,
  EmployeeCredentialRow,
  EmployeeDocumentRow,
  EmployeeDocumentAcknowledgement,
  EmployeeAvailabilityRow,
  EmployeeEmergencyContactRow,
  EmployeeLeaveEntitlementRow,
  EmployeeLeaveRequestRow,
  EmployeeLocationRow,
  EmployeeSkillRow,
} from "@/lib/employee";
import type { EnquiryRecord } from "@/lib/enquiry";
import { normalizeEnquiry } from "@/lib/enquiry";
import type {
  IncidentActionRow,
  IncidentEvidenceRow,
  IncidentNotificationRow,
  IncidentPartyRow,
  IncidentRecord,
} from "@/lib/incident";
import { normalizeIncident } from "@/lib/incident";
import type {
  PriceListLine,
  PriceListRecord,
  ProductRecord,
} from "@/lib/product";
import type { ServiceAgreementLine, ServiceAgreementRecord } from "@/lib/service-agreement";
import type { ServiceBookingLine, ServiceBookingRecord } from "@/lib/service-booking";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { TimesheetLine, TimesheetRecord } from "@/lib/timesheet";
import type {
  PlanAssessmentDocument,
  SupportPlanGoalLine,
  SupportPlanRecord,
} from "@/lib/support-plan";

export function strDate(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function toDate(value: string): string | null {
  return value?.trim() ? value.trim() : null;
}

export function strMoney(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  return String(value);
}

export function toMoney(value: string): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

// --- Enquiry ---

export type EnquiryRow = {
  id: string;
  document_no: string;
  date_received: string | null;
  date_next_action: string | null;
  status: string;
  first_name: string;
  last_name: string;
  funding_body: string;
  disability: string;
  services: string;
  is_enquiry_for_self: string;
  third_party_consent: string;
  relationship_type: string;
  phone: string;
  email: string;
  birthday: string | null;
  gender: string;
  preferred_communication_method: string;
  bp_name: string;
  enquiry_source: string;
  description: string;
  outcome: string;
  additional_disability_information: string;
  other: string;
  loss_reason: string;
  ndis_number: string;
  plan_status: string;
  plan_management_type: string;
  postcode: string;
  support_categories: string;
  urgency: string;
  qualification_score: number;
  qualification_tier: string;
  qualification_summary: string;
  external_crm_provider: string;
  external_crm_id: string;
  external_crm_synced_at: string | null;
  created_by: string;
  updated_by: string;
};

export type EnquiryActivityRowDb = {
  id: string;
  enquiry_id: string;
  line_no: number;
  activity_date: string | null;
  activity_type: string;
  subject: string;
  description: string;
  created_by: string;
};

export function enquiryFromRow(row: EnquiryRow, activity: EnquiryActivityRowDb[] = []): EnquiryRecord {
  return normalizeEnquiry({
    id: row.id,
    documentNo: row.document_no,
    dateReceived: strDate(row.date_received),
    dateNextAction: strDate(row.date_next_action),
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    fundingBody: row.funding_body,
    disability: row.disability,
    services: row.services,
    isEnquiryForSelf: row.is_enquiry_for_self,
    thirdPartyConsent: row.third_party_consent,
    relationshipType: row.relationship_type,
    phone: row.phone,
    email: row.email,
    birthday: strDate(row.birthday),
    gender: row.gender,
    preferredCommunicationMethod: row.preferred_communication_method,
    bpName: row.bp_name,
    enquirySource: row.enquiry_source,
    description: row.description,
    outcome: row.outcome,
    additionalDisabilityInformation: row.additional_disability_information,
    other: row.other,
    lossReason: row.loss_reason ?? "",
    ndisNumber: row.ndis_number ?? "",
    planStatus: row.plan_status ?? "",
    planManagementType: row.plan_management_type ?? "",
    postcode: row.postcode ?? "",
    supportCategories: row.support_categories ?? "",
    urgency: row.urgency ?? "",
    qualificationScore: row.qualification_score ?? 0,
    qualificationTier: row.qualification_tier ?? "Not qualified",
    qualificationSummary: row.qualification_summary ?? "",
    externalCrmProvider: row.external_crm_provider ?? "",
    externalCrmId: row.external_crm_id ?? "",
    externalCrmSyncedAt: row.external_crm_synced_at ?? "",
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    activity: activity.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      date: strDate(a.activity_date),
      activityType: a.activity_type,
      subject: a.subject,
      description: a.description,
      createdBy: a.created_by,
    })),
  });
}

export function enquiryToRow(record: EnquiryRecord): EnquiryRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    date_received: toDate(record.dateReceived),
    date_next_action: toDate(record.dateNextAction),
    status: record.status,
    first_name: record.firstName,
    last_name: record.lastName,
    funding_body: record.fundingBody,
    disability: record.disability,
    services: record.services,
    is_enquiry_for_self: record.isEnquiryForSelf,
    third_party_consent: record.thirdPartyConsent,
    relationship_type: record.relationshipType,
    phone: record.phone,
    email: record.email,
    birthday: toDate(record.birthday),
    gender: record.gender,
    preferred_communication_method: record.preferredCommunicationMethod,
    bp_name: record.bpName,
    enquiry_source: record.enquirySource,
    description: record.description,
    outcome: record.outcome,
    additional_disability_information: record.additionalDisabilityInformation,
    other: record.other,
    loss_reason: record.lossReason ?? "",
    ndis_number: record.ndisNumber ?? "",
    plan_status: record.planStatus ?? "",
    plan_management_type: record.planManagementType ?? "",
    postcode: record.postcode ?? "",
    support_categories: record.supportCategories ?? "",
    urgency: record.urgency ?? "",
    qualification_score: record.qualificationScore ?? 0,
    qualification_tier: record.qualificationTier ?? "Not qualified",
    qualification_summary: record.qualificationSummary ?? "",
    external_crm_provider: record.externalCrmProvider ?? "",
    external_crm_id: record.externalCrmId ?? "",
    external_crm_synced_at: toDate(record.externalCrmSyncedAt),
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

// --- Client ---

export type ClientRow = {
  id: string;
  enquiry_id: string | null;
  search_key: string;
  business_partner_group: string;
  name: string;
  risk_alerts: string;
  consent_alert_list: string;
  first_name: string;
  preferred_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  phone: string;
  status: string;
  lifecycle_status: string;
  plan_review_due_date: string | null;
  lifecycle_exit_reason: string;
  birthday: string | null;
  is_estimated_age: boolean;
  gender: string;
  decision_making: string;
  lgbtiqa: string;
  living_arrangement: string;
  sales_representative: string;
  services: string;
  funding_body: string;
  funding_body_number: string;
  transitioned_to_pace: string | null;
  date_support_commencement: string | null;
  date_support_ceased: string | null;
  aboriginal_torres_strait_islander: string;
  cultural_affiliation: string;
  disability: string;
  additional_disability_information: string;
  preferred_communication_method: string;
  plan_management_type: string;
  plan_manager_partner_id: string | null;
  invoice_delivery_method: string;
  statement_delivery_method: string;
  picture_url: string;
  created_by: string;
  updated_by: string;
};

export type ClientAlertRow = {
  id: string;
  client_id: string;
  line_no: number;
  alert_type: string;
  show_as_alert: string;
  name: string;
  description: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type ClientRestrictivePracticeRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  practice_type: string;
  show_as_alert: string;
  name: string;
  description: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type ClientConsentRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  consent_type: string;
  consent_status: string;
  show_as_alert: string;
  name: string;
  description: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type ClientRiskRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  risk_type: string;
  show_as_alert: string;
  name: string;
  description: string;
  likelihood: string;
  consequence: string;
  controls: string;
  emergency_response: string;
  escalation_process: string;
  review_date: string | null;
  valid_from: string | null;
  valid_to: string | null;
};

export type ClientBpAssociationRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  associated_bp_name: string;
  association_type: string;
  relationship: string;
  phone: string;
  mobile: string;
  email: string;
  primary_contact: string;
  valid_from: string | null;
  valid_to: string | null;
  notes: string;
  partner_id: string | null;
};

export type ClientContactActivityRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  activity_date: string | null;
  activity_type: string;
  contact_name: string;
  subject: string;
  description: string;
  created_by: string;
};

export type ClientNeedRuleRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  category: string;
  name: string;
  rule_text: string;
  show_as_alert: string;
  valid_from: string | null;
  valid_to: string | null;
};

export type ClientPlanBudgetRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  support_budget: string;
  support_category: string;
  description: string;
  ndis_line_item_ref: string;
  plan_provider: string;
  allocated_amount: number | string;
  claimed_amount: number | string;
};

export function planBudgetFromRow(row: ClientPlanBudgetRowDb): ClientPlanBudgetRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    planProvider: row.plan_provider?.trim() || "This organisation",
    supportBudget: row.support_budget,
    supportCategory: row.support_category,
    description: row.description,
    ndisLineItemRef: row.ndis_line_item_ref,
    allocatedAmount: Number(row.allocated_amount) || 0,
    claimedAmount: Number(row.claimed_amount) || 0,
  };
}

export type ClientActivityRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  activity_date: string | null;
  activity_type: string;
  subject: string;
  description: string;
  created_by: string;
};

export type ClientLocationRowDb = {
  id: string;
  client_id: string;
  line_no: number;
  name: string;
  address_type: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  post_to_address: string;
  invoice_address: string;
  ship_to_address: string;
  service_delivery_address: string;
  active: string;
  valid_from: string | null;
  valid_to: string | null;
  access_notes: string;
  description: string;
};

export function clientFromRow(
  row: ClientRow,
  alerts: ClientAlertRow[],
  activity: ClientActivityRowDb[],
  locations: ClientLocationRowDb[],
  restrictivePractices: ClientRestrictivePracticeRowDb[] = [],
  consents: ClientConsentRowDb[] = [],
  risks: ClientRiskRowDb[] = [],
  bpAssociations: ClientBpAssociationRowDb[] = [],
  contactActivity: ClientContactActivityRowDb[] = [],
  needsAndRules: ClientNeedRuleRowDb[] = []
): ClientRecord {
  return {
    id: row.id,
    enquiryId: row.enquiry_id ?? "",
    searchKey: row.search_key,
    businessPartnerGroup: row.business_partner_group,
    name: row.name,
    riskAlerts: row.risk_alerts,
    consentAlertList: row.consent_alert_list,
    firstName: row.first_name,
    preferredName: row.preferred_name,
    lastName: row.last_name,
    middleName: row.middle_name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    lifecycleStatus: row.lifecycle_status || "intake",
    planReviewDueDate: strDate(row.plan_review_due_date),
    lifecycleExitReason: row.lifecycle_exit_reason,
    birthday: strDate(row.birthday),
    isEstimatedAge: row.is_estimated_age,
    gender: row.gender,
    decisionMaking: row.decision_making,
    lgbtiqa: row.lgbtiqa,
    livingArrangement: row.living_arrangement,
    salesRepresentative: row.sales_representative,
    services: row.services,
    fundingBody: row.funding_body,
    fundingBodyNumber: row.funding_body_number,
    transitionedToPace: strDate(row.transitioned_to_pace),
    dateSupportCommencement: strDate(row.date_support_commencement),
    dateSupportCeased: strDate(row.date_support_ceased),
    aboriginalTorresStraitIslander: row.aboriginal_torres_strait_islander,
    culturalAffiliation: row.cultural_affiliation,
    disability: row.disability,
    additionalDisabilityInformation: row.additional_disability_information,
    preferredCommunicationMethod: row.preferred_communication_method ?? "",
    planManagementType: row.plan_management_type ?? "",
    planManagerPartnerId: row.plan_manager_partner_id ?? "",
    invoiceDeliveryMethod: row.invoice_delivery_method ?? "",
    statementDeliveryMethod: row.statement_delivery_method ?? "",
    pictureUrl: row.picture_url ?? "",
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    alerts: alerts.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      alertType: a.alert_type,
      showAsAlert: a.show_as_alert,
      name: a.name,
      description: a.description,
      validFrom: strDate(a.valid_from),
      validTo: strDate(a.valid_to),
    })),
    activity: activity.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      date: strDate(a.activity_date),
      activityType: a.activity_type,
      subject: a.subject,
      description: a.description,
      createdBy: a.created_by,
    })),
    locations: locations.map((l) => ({
      id: l.id,
      lineNo: l.line_no,
      name: l.name,
      addressType: l.address_type,
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
      postToAddress: l.post_to_address,
      invoiceAddress: l.invoice_address,
      shipToAddress: l.ship_to_address,
      serviceDeliveryAddress: l.service_delivery_address,
      active: l.active,
      validFrom: strDate(l.valid_from),
      validTo: strDate(l.valid_to),
      accessNotes: l.access_notes,
      description: l.description,
    })),
    restrictivePractices: restrictivePractices.map((r) => ({
      id: r.id,
      lineNo: r.line_no,
      practiceType: r.practice_type,
      showAsAlert: r.show_as_alert,
      name: r.name,
      description: r.description,
      validFrom: strDate(r.valid_from),
      validTo: strDate(r.valid_to),
    })),
    consents: consents.map((c) => ({
      id: c.id,
      lineNo: c.line_no,
      consentType: c.consent_type,
      consentStatus: c.consent_status || "Pending",
      showAsAlert: c.show_as_alert,
      name: c.name,
      description: c.description,
      validFrom: strDate(c.valid_from),
      validTo: strDate(c.valid_to),
    })),
    risks: risks.map((r) => ({
      id: r.id,
      lineNo: r.line_no,
      riskType: r.risk_type,
      showAsAlert: r.show_as_alert,
      name: r.name,
      description: r.description,
      likelihood: r.likelihood ?? "",
      consequence: r.consequence ?? "",
      controls: r.controls ?? "",
      emergencyResponse: r.emergency_response ?? "",
      escalationProcess: r.escalation_process ?? "",
      reviewDate: strDate(r.review_date),
      validFrom: strDate(r.valid_from),
      validTo: strDate(r.valid_to),
    })),
    bpAssociations: bpAssociations.map((b) => ({
      id: b.id,
      lineNo: b.line_no,
      associatedBpName: b.associated_bp_name,
      associationType: b.association_type,
      relationship: b.relationship,
      phone: b.phone,
      mobile: b.mobile,
      email: b.email,
      primaryContact: b.primary_contact,
      validFrom: strDate(b.valid_from),
      validTo: strDate(b.valid_to),
      notes: b.notes,
      partnerId: b.partner_id ?? "",
    })),
    contactActivity: contactActivity.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      date: strDate(a.activity_date),
      activityType: a.activity_type,
      contactName: a.contact_name,
      subject: a.subject,
      description: a.description,
      createdBy: a.created_by,
    })),
    needsAndRules: needsAndRules.map((n) => ({
      id: n.id,
      lineNo: n.line_no,
      category: n.category,
      name: n.name,
      ruleText: n.rule_text,
      showAsAlert: n.show_as_alert,
      validFrom: strDate(n.valid_from),
      validTo: strDate(n.valid_to),
    })),
    planBudgets: [],
  };
}

export function clientToRow(record: ClientRecord): ClientRow {
  return {
    id: record.id,
    enquiry_id: record.enquiryId?.trim() ? record.enquiryId : null,
    search_key: record.searchKey,
    business_partner_group: record.businessPartnerGroup,
    name: record.name,
    risk_alerts: record.riskAlerts,
    consent_alert_list: record.consentAlertList,
    first_name: record.firstName,
    preferred_name: record.preferredName,
    last_name: record.lastName,
    middle_name: record.middleName,
    email: record.email,
    phone: record.phone,
    status: record.status,
    lifecycle_status: record.lifecycleStatus,
    plan_review_due_date: toDate(record.planReviewDueDate),
    lifecycle_exit_reason: record.lifecycleExitReason,
    birthday: toDate(record.birthday),
    is_estimated_age: record.isEstimatedAge,
    gender: record.gender,
    decision_making: record.decisionMaking,
    lgbtiqa: record.lgbtiqa,
    living_arrangement: record.livingArrangement,
    sales_representative: record.salesRepresentative,
    services: record.services,
    funding_body: record.fundingBody,
    funding_body_number: record.fundingBodyNumber,
    transitioned_to_pace: toDate(record.transitionedToPace),
    date_support_commencement: toDate(record.dateSupportCommencement),
    date_support_ceased: toDate(record.dateSupportCeased),
    aboriginal_torres_strait_islander: record.aboriginalTorresStraitIslander,
    cultural_affiliation: record.culturalAffiliation,
    disability: record.disability,
    additional_disability_information: record.additionalDisabilityInformation,
    preferred_communication_method: record.preferredCommunicationMethod ?? "",
    plan_management_type: record.planManagementType ?? "",
    plan_manager_partner_id: record.planManagerPartnerId?.trim() ? record.planManagerPartnerId : null,
    invoice_delivery_method: record.invoiceDeliveryMethod ?? "",
    statement_delivery_method: record.statementDeliveryMethod ?? "",
    picture_url: record.pictureUrl ?? "",
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

// --- Product & price list ---

export type ProductRow = {
  id: string;
  search_key: string;
  name: string;
  description: string;
  product_category: string;
  uom: string;
  product_type: string;
  active: boolean;
  sold: boolean;
  price_list_id: string | null;
  ndis_support_item: string;
  created_by: string;
  updated_by: string;
};

export type PriceListRow = {
  id: string;
  name: string;
  schema_name: string;
  base_price_list_id: string;
  valid_from: string | null;
  currency: string;
  created_by: string;
  updated_by: string;
};

export type PriceListLineRow = {
  id: string;
  price_list_id: string;
  line_no: number;
  product_id: string | null;
  list_price: number | null;
  standard_price: number | null;
  limit_price: number | null;
};

export function productFromRow(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    searchKey: row.search_key,
    name: row.name,
    description: row.description,
    productCategory: row.product_category,
    uom: row.uom,
    productType: row.product_type,
    active: row.active,
    sold: row.sold,
    priceListId: row.price_list_id ?? "",
    ndisSupportItem: row.ndis_support_item || undefined,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export function productToRow(record: ProductRecord): ProductRow {
  return {
    id: record.id,
    search_key: record.searchKey,
    name: record.name,
    description: record.description,
    product_category: record.productCategory,
    uom: record.uom,
    product_type: record.productType,
    active: record.active,
    sold: record.sold,
    price_list_id: record.priceListId?.trim() ? record.priceListId : null,
    ndis_support_item: record.ndisSupportItem ?? "",
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function priceListFromRow(row: PriceListRow, lines: PriceListLineRow[]): PriceListRecord {
  return {
    id: row.id,
    name: row.name,
    schema: row.schema_name,
    basePriceListId: row.base_price_list_id,
    validFrom: strDate(row.valid_from),
    currency: row.currency,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lines: lines.map(
      (line): PriceListLine => ({
        id: line.id,
        lineNo: line.line_no,
        productId: line.product_id ?? "",
        listPrice: strMoney(line.list_price),
        standardPrice: strMoney(line.standard_price),
        limitPrice: strMoney(line.limit_price),
      })
    ),
  };
}

export function priceListToRow(record: PriceListRecord): PriceListRow {
  return {
    id: record.id,
    name: record.name,
    schema_name: record.schema,
    base_price_list_id: record.basePriceListId,
    valid_from: toDate(record.validFrom),
    currency: record.currency,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function priceListLineToRow(listId: string, line: PriceListLine): PriceListLineRow {
  return {
    id: line.id,
    price_list_id: listId,
    line_no: line.lineNo,
    product_id: line.productId?.trim() ? line.productId : null,
    list_price: toMoney(line.listPrice),
    standard_price: toMoney(line.standardPrice),
    limit_price: toMoney(line.limitPrice),
  };
}

// --- Service agreement ---

export type ServiceAgreementRow = {
  id: string;
  search_key: string;
  name: string;
  description: string;
  client_id: string | null;
  price_list_id: string | null;
  term: string;
  status: string;
  execution_date: string | null;
  contract_date: string | null;
  finish_date: string | null;
  review_date: string | null;
  total_planned_amount: number | null;
  sent_at: string | null;
  signed_at: string | null;
  activated_at: string | null;
  signer_name: string;
  signer_role: string;
  signature_image: string;
  signature_captured_at: string | null;
  created_by: string;
  updated_by: string;
};

export type ServiceAgreementLineRow = {
  id: string;
  service_agreement_id: string;
  line_no: number;
  product_id: string | null;
  name: string;
  description: string;
  planned_price: number | null;
  registration_group: string;
  funding_type: string;
  funding_body: string;
  funding_management_type: string;
  budget_rules: string;
};

export function serviceAgreementFromRow(
  row: ServiceAgreementRow,
  lines: ServiceAgreementLineRow[]
): ServiceAgreementRecord {
  return {
    id: row.id,
    searchKey: row.search_key,
    name: row.name,
    description: row.description,
    clientId: row.client_id ?? "",
    priceListId: row.price_list_id ?? "",
    term: row.term,
    status: row.status,
    executionDate: strDate(row.execution_date),
    contractDate: strDate(row.contract_date),
    finishDate: strDate(row.finish_date),
    reviewDate: strDate(row.review_date),
    totalPlannedAmount: strMoney(row.total_planned_amount),
    sentAt: strDate(row.sent_at),
    signedAt: strDate(row.signed_at),
    activatedAt: strDate(row.activated_at),
    signerName: row.signer_name ?? "",
    signerRole: row.signer_role ?? "",
    signatureImage: row.signature_image ?? "",
    signatureCapturedAt: row.signature_captured_at ?? "",
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lines: lines.map(
      (line): ServiceAgreementLine => ({
        id: line.id,
        lineNo: line.line_no,
        productId: line.product_id ?? "",
        name: line.name,
        description: line.description,
        plannedPrice: strMoney(line.planned_price),
        registrationGroup: line.registration_group,
        fundingType: line.funding_type,
        fundingBody: line.funding_body,
        fundingManagementType: line.funding_management_type,
        budgetRules: line.budget_rules,
      })
    ),
  };
}

export function serviceAgreementToRow(record: ServiceAgreementRecord): ServiceAgreementRow {
  return {
    id: record.id,
    search_key: record.searchKey,
    name: record.name,
    description: record.description,
    client_id: record.clientId?.trim() ? record.clientId : null,
    price_list_id: record.priceListId?.trim() ? record.priceListId : null,
    term: record.term,
    status: record.status,
    execution_date: toDate(record.executionDate),
    contract_date: toDate(record.contractDate),
    finish_date: toDate(record.finishDate),
    review_date: toDate(record.reviewDate),
    total_planned_amount: toMoney(record.totalPlannedAmount),
    sent_at: toDate(record.sentAt),
    signed_at: toDate(record.signedAt),
    activated_at: toDate(record.activatedAt),
    signer_name: record.signerName ?? "",
    signer_role: record.signerRole ?? "",
    signature_image: record.signatureImage ?? "",
    signature_captured_at: record.signatureCapturedAt?.trim() ? record.signatureCapturedAt : null,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function serviceAgreementLineToRow(
  agreementId: string,
  line: ServiceAgreementLine
): ServiceAgreementLineRow {
  return {
    id: line.id,
    service_agreement_id: agreementId,
    line_no: line.lineNo,
    product_id: line.productId?.trim() ? line.productId : null,
    name: line.name,
    description: line.description,
    planned_price: toMoney(line.plannedPrice),
    registration_group: line.registrationGroup,
    funding_type: line.fundingType,
    funding_body: line.fundingBody,
    funding_management_type: line.fundingManagementType,
    budget_rules: line.budgetRules,
  };
}

// --- Service booking ---

export type ServiceBookingRow = {
  id: string;
  document_no: string;
  organization: string;
  description: string;
  target_document_type: string;
  is_template: boolean;
  ready_to_claim_rule: string;
  program_of_supports: boolean;
  date_ordered: string | null;
  date_promised: string | null;
  start_date: string | null;
  end_date: string | null;
  client_id: string | null;
  invoice_partner: string;
  service_agreement_id: string | null;
  booking_generator_ref: string;
  total_lines: number | null;
  grand_total: number | null;
  document_status: string;
  cancellation_notice_days: number;
  cancelled_at: string | null;
  cancellation_initiated_by: string;
  cancellation_reason: string;
  cancellation_notes: string;
  created_by: string;
  updated_by: string;
};

export type ServiceBookingLineRowDb = {
  id: string;
  service_booking_id: string;
  line_no: number;
  manual_hold: boolean;
  ready_to_claim: boolean;
  ordered_quantity: number;
  quantity_invoiced: number;
  date_promised: string | null;
  product_id: string | null;
  claim_type: string;
  use_time_based_quantity: boolean;
  start_date: string | null;
  end_date: string | null;
  uom: string;
  price: number | null;
  line_amount: number | null;
};

export function serviceBookingFromRow(
  row: ServiceBookingRow,
  lines: ServiceBookingLineRowDb[]
): ServiceBookingRecord {
  return {
    id: row.id,
    documentNo: row.document_no,
    organization: row.organization,
    description: row.description,
    targetDocumentType: row.target_document_type,
    isTemplate: row.is_template,
    readyToClaimRule: row.ready_to_claim_rule,
    programOfSupports: row.program_of_supports,
    dateOrdered: strDate(row.date_ordered),
    datePromised: strDate(row.date_promised),
    startDate: strDate(row.start_date),
    endDate: strDate(row.end_date),
    clientId: row.client_id ?? "",
    invoicePartner: row.invoice_partner,
    serviceAgreementId: row.service_agreement_id ?? "",
    bookingGeneratorRef: row.booking_generator_ref,
    totalLines: strMoney(row.total_lines),
    grandTotal: strMoney(row.grand_total),
    documentStatus: row.document_status,
    cancellationNoticeDays: row.cancellation_notice_days ?? 7,
    cancelledAt: strDate(row.cancelled_at),
    cancellationInitiatedBy: row.cancellation_initiated_by ?? "",
    cancellationReason: row.cancellation_reason ?? "",
    cancellationNotes: row.cancellation_notes ?? "",
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    lines: lines.map(
      (line): ServiceBookingLine => ({
        id: line.id,
        lineNo: line.line_no,
        manualHold: line.manual_hold,
        readyToClaim: line.ready_to_claim,
        orderedQuantity: String(line.ordered_quantity),
        quantityInvoiced: String(line.quantity_invoiced),
        datePromised: strDate(line.date_promised),
        productId: line.product_id ?? "",
        claimType: line.claim_type,
        useTimeBasedQuantity: line.use_time_based_quantity,
        startDate: strDate(line.start_date),
        endDate: strDate(line.end_date),
        uom: line.uom,
        price: strMoney(line.price),
        lineAmount: strMoney(line.line_amount),
      })
    ),
  };
}

export function serviceBookingToRow(record: ServiceBookingRecord): ServiceBookingRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    organization: record.organization,
    description: record.description,
    target_document_type: record.targetDocumentType,
    is_template: record.isTemplate,
    ready_to_claim_rule: record.readyToClaimRule,
    program_of_supports: record.programOfSupports,
    date_ordered: toDate(record.dateOrdered),
    date_promised: toDate(record.datePromised),
    start_date: toDate(record.startDate),
    end_date: toDate(record.endDate),
    client_id: record.clientId?.trim() ? record.clientId : null,
    invoice_partner: record.invoicePartner,
    service_agreement_id: record.serviceAgreementId?.trim() ? record.serviceAgreementId : null,
    booking_generator_ref: record.bookingGeneratorRef,
    total_lines: toMoney(record.totalLines),
    grand_total: toMoney(record.grandTotal),
    document_status: record.documentStatus,
    cancellation_notice_days: record.cancellationNoticeDays,
    cancelled_at: toDate(record.cancelledAt),
    cancellation_initiated_by: record.cancellationInitiatedBy,
    cancellation_reason: record.cancellationReason,
    cancellation_notes: record.cancellationNotes,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function serviceBookingLineToRow(
  bookingId: string,
  line: ServiceBookingLine
): ServiceBookingLineRowDb {
  return {
    id: line.id,
    service_booking_id: bookingId,
    line_no: line.lineNo,
    manual_hold: line.manualHold,
    ready_to_claim: line.readyToClaim,
    ordered_quantity: Number(line.orderedQuantity) || 0,
    quantity_invoiced: Number(line.quantityInvoiced) || 0,
    date_promised: toDate(line.datePromised),
    product_id: line.productId?.trim() ? line.productId : null,
    claim_type: line.claimType,
    use_time_based_quantity: line.useTimeBasedQuantity,
    start_date: toDate(line.startDate),
    end_date: toDate(line.endDate),
    uom: line.uom,
    price: toMoney(line.price),
    line_amount: toMoney(line.lineAmount),
  };
}

// --- Contract ---

export type ContractRow = {
  id: string;
  document_no: string;
  client_id: string | null;
  business_partner_name: string;
  contract_type: string;
  name: string;
  description: string;
  contract_term: string;
  execution_date: string | null;
  start_date: string | null;
  end_date: string | null;
  review_date: string | null;
  reference: string;
  project: string;
  created_by: string;
  updated_by: string;
};

export type ContractAuditRowDb = {
  id: string;
  contract_id: string;
  line_no: number;
  audit_date: string | null;
  changed_by: string;
  action: string;
  description: string;
};

export function contractFromRow(row: ContractRow, audit: ContractAuditRowDb[]): ContractRecord {
  return {
    id: row.id,
    documentNo: row.document_no,
    clientId: row.client_id ?? "",
    businessPartnerName: row.business_partner_name,
    contractType: row.contract_type,
    name: row.name,
    description: row.description,
    contractTerm: row.contract_term,
    executionDate: strDate(row.execution_date),
    startDate: strDate(row.start_date),
    endDate: strDate(row.end_date),
    reviewDate: strDate(row.review_date),
    reference: row.reference,
    project: row.project,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    audit: audit.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      auditDate: strDate(a.audit_date),
      changedBy: a.changed_by,
      action: a.action,
      description: a.description,
    })),
  };
}

export function contractToRow(record: ContractRecord): ContractRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    client_id: record.clientId?.trim() ? record.clientId : null,
    business_partner_name: record.businessPartnerName,
    contract_type: record.contractType,
    name: record.name,
    description: record.description,
    contract_term: record.contractTerm,
    execution_date: toDate(record.executionDate),
    start_date: toDate(record.startDate),
    end_date: toDate(record.endDate),
    review_date: toDate(record.reviewDate),
    reference: record.reference,
    project: record.project,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

// --- Support plan ---

export type SupportPlanRow = {
  id: string;
  client_id: string;
  document_no: string;
  description: string;
  provided_to_receiver: string | null;
  execution_date: string | null;
  active: boolean;
  my_story: string;
  important_to_me: string;
  important_for_me: string;
  how_supported: string;
  hobbies: string;
  cultural_needs: string;
  religious_requirements: string;
  family_information: string;
  pets: string;
  strengths: string;
  skills: string;
  aspirations: string;
  likes: string;
  dislikes: string;
  about_other: string;
  primary_language: string;
  interpreter_required: string;
  communication_method: string;
  verbal_communication_level: string;
  non_verbal_communication: string;
  communication_aids: string;
  communication_triggers: string;
  calming_strategies: string;
  worker_guidance: string;
  medication_required: string;
  medication_details: string;
  known_allergies: string;
  medical_history: string;
  behaviour_support_required: string;
  behaviour_practitioner: string;
  behaviour_authorisations: string;
  behaviour_description: string;
  strategies: string;
  relaxation: string;
  stress_cause: string;
  emergency_medical_procedure: string;
  emergency_missing_person_procedure: string;
  emergency_behavioural_crisis_procedure: string;
  emergency_fire_evacuation_procedure: string;
  what_works_best: string;
  worker_approaches: string;
  environmental_considerations: string;
  avoid_list: string;
  unsafe_practices: string;
  shift_arrival_process: string;
  shift_departure_process: string;
  documentation_requirements: string;
  morning: string;
  daytime: string;
  afternoon: string;
  evening_night: string;
  weekly: string;
  activity_attendance: boolean;
  activity_details: string;
  personal_care: boolean;
  dressing: string;
  hair_care: string;
  menstrual_management: string;
  oral_hygiene: string;
  nail_care: string;
  shaving: string;
  sleeping: string;
  toilet_use: string;
  showering: string;
  personal_care_other: string;
  household_support_required: boolean;
  cooking: string;
  cleaning: string;
  gardening: string;
  laundry: string;
  make_bed: string;
  grocery: string;
  mobility_support_required: string;
  mobility_detail: string;
  eating_drinking_support: string;
  dietary_allergies: string;
  favourite_foods: string;
  disliked_foods: string;
  meal_other: string;
  transport_arrangements: string;
  financial_arrangement: string;
  financial_arrangement_details: string;
  created_by: string;
  updated_by: string;
};

export type SupportPlanGoalRow = {
  id: string;
  support_plan_id: string;
  line_no: number;
  name: string;
  goal_number: string;
  goal_term: string;
  goal_type: string;
  goal: string;
  support_required: string;
  ndis_category: string;
  why_it_matters: string;
  success_measures: string;
  start_date: string | null;
  end_date: string | null;
};

export type SupportPlanMedicationRowDb = {
  id: string;
  support_plan_id: string;
  line_no: number;
  medication_name: string;
  dosage: string;
  purpose: string;
  administration_requirements: string;
};

export type SupportPlanDiagnosisRowDb = {
  id: string;
  support_plan_id: string;
  line_no: number;
  diagnosis: string;
  condition: string;
  treating_practitioner: string;
  impact_on_daily_living: string;
};

export type SupportPlanHealthPlanRowDb = {
  id: string;
  support_plan_id: string;
  line_no: number;
  plan_type: string;
  attachment_reference: string;
  notes: string;
};

export type SupportPlanSupportRequirementRowDb = {
  id: string;
  support_plan_id: string;
  line_no: number;
  support_area: string;
  support_requirement: string;
  level_of_assistance: string;
  frequency: string;
  special_instructions: string;
};

export type SupportPlanAssistiveTechnologyRowDb = {
  id: string;
  support_plan_id: string;
  line_no: number;
  equipment: string;
  serial_number: string;
  maintenance_schedule: string;
  training_required: string;
};

export type SupportPlanProgressReviewRowDb = {
  id: string;
  goal_id: string;
  line_no: number;
  progress_review_type: string;
  review_date: string | null;
  goal_progress: string;
  progress_taken: string;
  receiver_feeling: string;
  next_steps: string;
  created_by: string;
  updated_by: string;
};

export type PlanAssessmentDocumentRow = {
  id: string;
  client_id: string;
  document_no: string;
  document_type: string;
  plan_type: string;
  assessment_type: string;
  review_date: string | null;
  date_received: string | null;
  document_status: string;
  document_developer: string;
  support_plan_id: string | null;
};

export function supportPlanFromRow(
  row: SupportPlanRow,
  goals: SupportPlanGoalRow[],
  progressReviews: SupportPlanProgressReviewRowDb[] = [],
  medications: SupportPlanMedicationRowDb[] = [],
  diagnoses: SupportPlanDiagnosisRowDb[] = [],
  healthPlans: SupportPlanHealthPlanRowDb[] = [],
  supportRequirements: SupportPlanSupportRequirementRowDb[] = [],
  assistiveTechnology: SupportPlanAssistiveTechnologyRowDb[] = []
): SupportPlanRecord {
  const goalNameById = Object.fromEntries(goals.map((g) => [g.id, g.name || g.goal]));
  return {
    id: row.id,
    clientId: row.client_id,
    documentNo: row.document_no,
    description: row.description,
    providedToReceiver: strDate(row.provided_to_receiver),
    executionDate: strDate(row.execution_date),
    active: row.active,
    myStory: row.my_story ?? "",
    importantToMe: row.important_to_me,
    importantForMe: row.important_for_me ?? "",
    howSupported: row.how_supported,
    hobbies: row.hobbies,
    culturalNeeds: row.cultural_needs,
    religiousRequirements: row.religious_requirements ?? "",
    familyInformation: row.family_information ?? "",
    pets: row.pets ?? "",
    strengths: row.strengths ?? "",
    skills: row.skills ?? "",
    aspirations: row.aspirations ?? "",
    likes: row.likes,
    dislikes: row.dislikes,
    aboutOther: row.about_other,
    primaryLanguage: row.primary_language,
    interpreterRequired: row.interpreter_required,
    communicationMethod: row.communication_method,
    verbalCommunicationLevel: row.verbal_communication_level ?? "",
    nonVerbalCommunication: row.non_verbal_communication ?? "",
    communicationAids: row.communication_aids ?? "",
    communicationTriggers: row.communication_triggers ?? "",
    calmingStrategies: row.calming_strategies ?? "",
    workerGuidance: row.worker_guidance ?? "",
    medicationRequired: row.medication_required,
    medicationDetails: row.medication_details,
    knownAllergies: row.known_allergies,
    medicalHistory: row.medical_history,
    behaviourSupportRequired: row.behaviour_support_required,
    behaviourPractitioner: row.behaviour_practitioner ?? "",
    behaviourAuthorisations: row.behaviour_authorisations ?? "",
    behaviourDescription: row.behaviour_description,
    strategies: row.strategies,
    relaxation: row.relaxation,
    stressCause: row.stress_cause,
    emergencyMedicalProcedure: row.emergency_medical_procedure ?? "",
    emergencyMissingPersonProcedure: row.emergency_missing_person_procedure ?? "",
    emergencyBehaviouralCrisisProcedure: row.emergency_behavioural_crisis_procedure ?? "",
    emergencyFireEvacuationProcedure: row.emergency_fire_evacuation_procedure ?? "",
    whatWorksBest: row.what_works_best ?? "",
    workerApproaches: row.worker_approaches ?? "",
    environmentalConsiderations: row.environmental_considerations ?? "",
    avoidList: row.avoid_list ?? "",
    unsafePractices: row.unsafe_practices ?? "",
    shiftArrivalProcess: row.shift_arrival_process ?? "",
    shiftDepartureProcess: row.shift_departure_process ?? "",
    documentationRequirements: row.documentation_requirements ?? "",
    morning: row.morning,
    daytime: row.daytime,
    afternoon: row.afternoon,
    eveningNight: row.evening_night,
    weekly: row.weekly,
    activityAttendance: row.activity_attendance,
    activityDetails: row.activity_details,
    personalCare: row.personal_care,
    dressing: row.dressing,
    hairCare: row.hair_care,
    menstrualManagement: row.menstrual_management,
    oralHygiene: row.oral_hygiene,
    nailCare: row.nail_care,
    shaving: row.shaving,
    sleeping: row.sleeping,
    toiletUse: row.toilet_use,
    showering: row.showering,
    personalCareOther: row.personal_care_other,
    householdSupportRequired: row.household_support_required,
    cooking: row.cooking,
    cleaning: row.cleaning,
    gardening: row.gardening,
    laundry: row.laundry,
    makeBed: row.make_bed,
    grocery: row.grocery,
    mobilitySupportRequired: row.mobility_support_required,
    mobilityDetail: row.mobility_detail,
    eatingDrinkingSupport: row.eating_drinking_support,
    dietaryAllergies: row.dietary_allergies,
    favouriteFoods: row.favourite_foods,
    dislikedFoods: row.disliked_foods,
    mealOther: row.meal_other,
    transportArrangements: row.transport_arrangements,
    financialArrangement: row.financial_arrangement,
    financialArrangementDetails: row.financial_arrangement_details,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    goals: goals.map(
      (g): SupportPlanGoalLine => ({
        id: g.id,
        lineNo: g.line_no,
        name: g.name,
        goalNumber: g.goal_number,
        goalTerm: g.goal_term,
        goalType: g.goal_type,
        goal: g.goal,
        supportRequired: g.support_required,
        ndisCategory: g.ndis_category ?? "",
        whyItMatters: g.why_it_matters ?? "",
        successMeasures: g.success_measures ?? "",
        startDate: strDate(g.start_date),
        endDate: strDate(g.end_date),
      })
    ),
    medications: medications.map((m) => ({
      id: m.id,
      lineNo: m.line_no,
      medicationName: m.medication_name,
      dosage: m.dosage,
      purpose: m.purpose,
      administrationRequirements: m.administration_requirements,
    })),
    diagnoses: diagnoses.map((d) => ({
      id: d.id,
      lineNo: d.line_no,
      diagnosis: d.diagnosis,
      condition: d.condition,
      treatingPractitioner: d.treating_practitioner,
      impactOnDailyLiving: d.impact_on_daily_living,
    })),
    healthPlans: healthPlans.map((h) => ({
      id: h.id,
      lineNo: h.line_no,
      planType: h.plan_type,
      attachmentReference: h.attachment_reference,
      notes: h.notes,
    })),
    supportRequirements: supportRequirements.map((r) => ({
      id: r.id,
      lineNo: r.line_no,
      supportArea: r.support_area,
      supportRequirement: r.support_requirement,
      levelOfAssistance: r.level_of_assistance,
      frequency: r.frequency,
      specialInstructions: r.special_instructions,
    })),
    assistiveTechnology: assistiveTechnology.map((a) => ({
      id: a.id,
      lineNo: a.line_no,
      equipment: a.equipment,
      serialNumber: a.serial_number,
      maintenanceSchedule: a.maintenance_schedule,
      trainingRequired: a.training_required,
    })),
    progressReviews: progressReviews.map((r) => ({
      id: r.id,
      lineNo: r.line_no,
      goalId: r.goal_id,
      goalName: goalNameById[r.goal_id] ?? "",
      progressReviewType: r.progress_review_type,
      reviewDate: strDate(r.review_date),
      goalProgress: r.goal_progress,
      progressTaken: r.progress_taken,
      receiverFeeling: r.receiver_feeling,
      nextSteps: r.next_steps,
      createdBy: r.created_by,
      updatedBy: r.updated_by,
    })),
  };
}

export function supportPlanToRow(record: SupportPlanRecord): SupportPlanRow {
  return {
    id: record.id,
    client_id: record.clientId,
    document_no: record.documentNo,
    description: record.description,
    provided_to_receiver: toDate(record.providedToReceiver),
    execution_date: toDate(record.executionDate),
    active: record.active,
    my_story: record.myStory,
    important_to_me: record.importantToMe,
    important_for_me: record.importantForMe,
    how_supported: record.howSupported,
    hobbies: record.hobbies,
    cultural_needs: record.culturalNeeds,
    religious_requirements: record.religiousRequirements,
    family_information: record.familyInformation,
    pets: record.pets,
    strengths: record.strengths,
    skills: record.skills,
    aspirations: record.aspirations,
    likes: record.likes,
    dislikes: record.dislikes,
    about_other: record.aboutOther,
    primary_language: record.primaryLanguage,
    interpreter_required: record.interpreterRequired,
    communication_method: record.communicationMethod,
    verbal_communication_level: record.verbalCommunicationLevel,
    non_verbal_communication: record.nonVerbalCommunication,
    communication_aids: record.communicationAids,
    communication_triggers: record.communicationTriggers,
    calming_strategies: record.calmingStrategies,
    worker_guidance: record.workerGuidance,
    medication_required: record.medicationRequired,
    medication_details: record.medicationDetails,
    known_allergies: record.knownAllergies,
    medical_history: record.medicalHistory,
    behaviour_support_required: record.behaviourSupportRequired,
    behaviour_practitioner: record.behaviourPractitioner,
    behaviour_authorisations: record.behaviourAuthorisations,
    behaviour_description: record.behaviourDescription,
    strategies: record.strategies,
    relaxation: record.relaxation,
    stress_cause: record.stressCause,
    emergency_medical_procedure: record.emergencyMedicalProcedure,
    emergency_missing_person_procedure: record.emergencyMissingPersonProcedure,
    emergency_behavioural_crisis_procedure: record.emergencyBehaviouralCrisisProcedure,
    emergency_fire_evacuation_procedure: record.emergencyFireEvacuationProcedure,
    what_works_best: record.whatWorksBest,
    worker_approaches: record.workerApproaches,
    environmental_considerations: record.environmentalConsiderations,
    avoid_list: record.avoidList,
    unsafe_practices: record.unsafePractices,
    shift_arrival_process: record.shiftArrivalProcess,
    shift_departure_process: record.shiftDepartureProcess,
    documentation_requirements: record.documentationRequirements,
    morning: record.morning,
    daytime: record.daytime,
    afternoon: record.afternoon,
    evening_night: record.eveningNight,
    weekly: record.weekly,
    activity_attendance: record.activityAttendance,
    activity_details: record.activityDetails,
    personal_care: record.personalCare,
    dressing: record.dressing,
    hair_care: record.hairCare,
    menstrual_management: record.menstrualManagement,
    oral_hygiene: record.oralHygiene,
    nail_care: record.nailCare,
    shaving: record.shaving,
    sleeping: record.sleeping,
    toilet_use: record.toiletUse,
    showering: record.showering,
    personal_care_other: record.personalCareOther,
    household_support_required: record.householdSupportRequired,
    cooking: record.cooking,
    cleaning: record.cleaning,
    gardening: record.gardening,
    laundry: record.laundry,
    make_bed: record.makeBed,
    grocery: record.grocery,
    mobility_support_required: record.mobilitySupportRequired,
    mobility_detail: record.mobilityDetail,
    eating_drinking_support: record.eatingDrinkingSupport,
    dietary_allergies: record.dietaryAllergies,
    favourite_foods: record.favouriteFoods,
    disliked_foods: record.dislikedFoods,
    meal_other: record.mealOther,
    transport_arrangements: record.transportArrangements,
    financial_arrangement: record.financialArrangement,
    financial_arrangement_details: record.financialArrangementDetails,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function planDocumentFromRow(row: PlanAssessmentDocumentRow): PlanAssessmentDocument {
  return {
    id: row.id,
    clientId: row.client_id,
    documentNo: row.document_no,
    documentType: row.document_type,
    planType: row.plan_type,
    assessmentType: row.assessment_type,
    reviewDate: strDate(row.review_date),
    dateReceived: strDate(row.date_received),
    documentStatus: row.document_status,
    documentDeveloper: row.document_developer,
    supportPlanId: row.support_plan_id ?? "",
  };
}

// --- Employee ---

export type EmployeeRow = {
  id: string;
  search_key: string;
  business_partner_group: string;
  name: string;
  first_name: string;
  last_name: string;
  preferred_name: string;
  middle_name: string;
  email: string;
  phone: string;
  mobile: string;
  job_title: string;
  department: string;
  employment_status: string;
  employment_type: string;
  start_date: string | null;
  end_date: string | null;
  probation_end_date: string | null;
  confirmation_date: string | null;
  notice_days: number | null;
  site_branch: string;
  cost_centre: string;
  gender: string;
  birthday: string | null;
  employee_number: string;
  reports_to_id: string | null;
  manager_name: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  driver_licence_class: string;
  driver_licence_expiry: string | null;
  visa_subclass: string;
  visa_expiry: string | null;
  work_rights_notes: string;
  bank_name: string;
  bank_bsb: string;
  bank_account_number: string;
  pay_method: string;
  tfn: string;
  tax_declaration: string;
  super_fund: string;
  super_member_number: string;
  standard_hours_per_week: number | null;
  fte: number | null;
  leave_policy: string;
  medical_restrictions_notes: string;
  notes: string;
  picture_url: string;
  created_by: string;
  updated_by: string;
};

export type EmployeeChildRows = {
  credentials?: EmployeeCredentialRowDb[];
  locations?: EmployeeLocationRowDb[];
  emergencyContacts?: EmployeeEmergencyContactRowDb[];
  alerts?: EmployeeAlertRowDb[];
  skills?: EmployeeSkillRowDb[];
  documents?: EmployeeDocumentRowDb[];
  activities?: EmployeeActivityRowDb[];
  leaveEntitlements?: EmployeeLeaveEntitlementRowDb[];
  leaveRequests?: EmployeeLeaveRequestRowDb[];
};

export type EmployeeLocationRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  name: string;
  address_type: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  mobile: string;
  email: string;
  primary_address: string;
  active: string;
  valid_from: string | null;
  valid_to: string | null;
  access_notes: string;
  description: string;
};

export type EmployeeEmergencyContactRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  contact_type: string;
  name: string;
  relationship: string;
  phone: string;
  mobile: string;
  email: string;
  call_order: number;
  primary_contact: string;
  notes: string;
};

export type EmployeeAlertRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  alert_type: string;
  show_as_alert: string;
  name: string;
  description: string;
  valid_from: string | null;
  valid_to: string | null;
  source: string;
};

export type EmployeeSkillRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  skill_type: string;
  name: string;
  proficiency: string;
  notes: string;
};

export type EmployeeDocumentRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  document_type: string;
  name: string;
  document_ref: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  notes: string;
  staff_visible?: boolean;
  requires_acknowledgement?: boolean;
};

export type EmployeeActivityRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  activity_date: string | null;
  activity_type: string;
  subject: string;
  description: string;
  created_by: string;
};

export type EmployeeLeaveEntitlementRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  leave_type: string;
  entitlement_days: number;
  balance_days: number;
  accrual_notes: string;
};

export type EmployeeLeaveRequestRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  leave_type: string;
  start_date: string | null;
  end_date: string | null;
  days_requested: number;
  status: string;
  notes: string;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string;
  decline_reason?: string;
};

export type EmployeeAvailabilityRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  availability: string;
  notes: string;
};

export type EmployeeDocumentAcknowledgementRowDb = {
  id: string;
  employee_id: string;
  document_id: string;
  acknowledged_at: string;
  acknowledged_by_user_id: string;
};

export type EmployeeCredentialRowDb = {
  id: string;
  employee_id: string;
  line_no: number;
  credential_type: string;
  credential_number: string;
  issuing_body: string;
  issue_date: string | null;
  expiry_date: string | null;
  status: string;
  document_ref: string;
  evidence_ref?: string;
  notes: string;
  staff_submitted?: boolean;
  submitted_at?: string | null;
  submitted_by_user_id?: string;
  reviewed_at?: string | null;
  reviewed_by?: string;
  review_notes?: string;
  created_by: string;
  updated_by: string;
};

export function employeeLocationFromRow(row: EmployeeLocationRowDb): EmployeeLocationRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    name: row.name,
    addressType: row.address_type,
    address1: row.address1,
    address2: row.address2,
    address3: row.address3,
    city: row.city,
    state: row.state,
    postcode: row.postcode,
    country: row.country,
    phone: row.phone,
    mobile: row.mobile,
    email: row.email,
    primaryAddress: row.primary_address,
    active: row.active,
    validFrom: strDate(row.valid_from),
    validTo: strDate(row.valid_to),
    accessNotes: row.access_notes,
    description: row.description,
  };
}

export function employeeEmergencyContactFromRow(row: EmployeeEmergencyContactRowDb): EmployeeEmergencyContactRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    contactType: row.contact_type,
    name: row.name,
    relationship: row.relationship,
    phone: row.phone,
    mobile: row.mobile,
    email: row.email,
    callOrder: row.call_order,
    primaryContact: row.primary_contact,
    notes: row.notes,
  };
}

export function employeeAlertFromRow(row: EmployeeAlertRowDb): EmployeeAlertRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    alertType: row.alert_type,
    showAsAlert: row.show_as_alert,
    name: row.name,
    description: row.description,
    validFrom: strDate(row.valid_from),
    validTo: strDate(row.valid_to),
    source: row.source,
  };
}

export function employeeSkillFromRow(row: EmployeeSkillRowDb): EmployeeSkillRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    skillType: row.skill_type,
    name: row.name,
    proficiency: row.proficiency,
    notes: row.notes,
  };
}

export function employeeDocumentFromRow(row: EmployeeDocumentRowDb): EmployeeDocumentRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    documentType: row.document_type,
    name: row.name,
    documentRef: row.document_ref,
    issueDate: strDate(row.issue_date),
    expiryDate: strDate(row.expiry_date),
    status: row.status,
    notes: row.notes,
    staffVisible: row.staff_visible !== false,
    requiresAcknowledgement: Boolean(row.requires_acknowledgement),
  };
}

export function employeeActivityFromRow(row: EmployeeActivityRowDb): EmployeeActivityRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    date: strDate(row.activity_date),
    activityType: row.activity_type,
    subject: row.subject,
    description: row.description,
    createdBy: row.created_by,
  };
}

export function employeeLeaveEntitlementFromRow(row: EmployeeLeaveEntitlementRowDb): EmployeeLeaveEntitlementRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    leaveType: row.leave_type,
    entitlementDays: Number(row.entitlement_days) || 0,
    balanceDays: Number(row.balance_days) || 0,
    accrualNotes: row.accrual_notes,
  };
}

export function employeeLeaveRequestFromRow(row: EmployeeLeaveRequestRowDb): EmployeeLeaveRequestRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    leaveType: row.leave_type,
    startDate: strDate(row.start_date),
    endDate: strDate(row.end_date),
    daysRequested: Number(row.days_requested) || 0,
    status: row.status,
    notes: row.notes,
    submittedAt: row.submitted_at ?? undefined,
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? "",
    declineReason: row.decline_reason ?? "",
  };
}

export function employeeAvailabilityFromRow(row: EmployeeAvailabilityRowDb): EmployeeAvailabilityRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    dayOfWeek: row.day_of_week,
    startTime: (row.start_time ?? "09:00").slice(0, 5),
    endTime: (row.end_time ?? "17:00").slice(0, 5),
    availability: row.availability,
    notes: row.notes,
  };
}

export function employeeDocumentAckFromRow(row: EmployeeDocumentAcknowledgementRowDb): EmployeeDocumentAcknowledgement {
  return {
    id: row.id,
    documentId: row.document_id,
    acknowledgedAt: row.acknowledged_at,
    acknowledgedByUserId: row.acknowledged_by_user_id,
  };
}

export function employeeCredentialFromRow(row: EmployeeCredentialRowDb): EmployeeCredentialRow {
  return {
    id: row.id,
    lineNo: row.line_no,
    credentialType: row.credential_type,
    credentialNumber: row.credential_number,
    issuingBody: row.issuing_body,
    issueDate: strDate(row.issue_date),
    expiryDate: strDate(row.expiry_date),
    status: row.status,
    documentRef: row.document_ref,
    evidenceRef: row.evidence_ref ?? "",
    notes: row.notes,
    staffSubmitted: row.staff_submitted ?? false,
    submittedAt: row.submitted_at ?? undefined,
    submittedByUserId: row.submitted_by_user_id ?? "",
    reviewedAt: row.reviewed_at ?? undefined,
    reviewedBy: row.reviewed_by ?? "",
    reviewNotes: row.review_notes ?? "",
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export function employeeFromRow(row: EmployeeRow, children: EmployeeChildRows = {}): EmployeeRecord {
  return {
    id: row.id,
    searchKey: row.search_key,
    businessPartnerGroup: row.business_partner_group,
    name: row.name,
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    middleName: row.middle_name,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    jobTitle: row.job_title,
    department: row.department,
    employmentStatus: row.employment_status,
    employmentType: row.employment_type ?? "",
    startDate: strDate(row.start_date),
    endDate: strDate(row.end_date),
    probationEndDate: strDate(row.probation_end_date),
    confirmationDate: strDate(row.confirmation_date),
    noticeDays: row.notice_days != null ? String(row.notice_days) : "",
    siteBranch: row.site_branch ?? "",
    costCentre: row.cost_centre ?? "",
    gender: row.gender,
    birthday: strDate(row.birthday),
    employeeNumber: row.employee_number,
    reportsToId: row.reports_to_id ?? "",
    driverLicenceClass: row.driver_licence_class ?? "",
    driverLicenceExpiry: strDate(row.driver_licence_expiry),
    visaSubclass: row.visa_subclass ?? "",
    visaExpiry: strDate(row.visa_expiry),
    workRightsNotes: row.work_rights_notes ?? "",
    bankName: row.bank_name ?? "",
    bankBsb: row.bank_bsb ?? "",
    bankAccountNumber: row.bank_account_number ?? "",
    payMethod: row.pay_method ?? "",
    tfn: row.tfn ?? "",
    taxDeclaration: row.tax_declaration ?? "",
    superFund: row.super_fund ?? "",
    superMemberNumber: row.super_member_number ?? "",
    standardHoursPerWeek: row.standard_hours_per_week != null ? String(row.standard_hours_per_week) : "",
    fte: row.fte != null ? String(row.fte) : "",
    leavePolicy: row.leave_policy ?? "",
    medicalRestrictionsNotes: row.medical_restrictions_notes ?? "",
    notes: row.notes,
    pictureUrl: row.picture_url ?? "",
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    credentials: (children.credentials ?? []).map(employeeCredentialFromRow),
    locations: (children.locations ?? []).map(employeeLocationFromRow),
    emergencyContacts: (children.emergencyContacts ?? []).map(employeeEmergencyContactFromRow),
    alerts: (children.alerts ?? []).map(employeeAlertFromRow),
    skills: (children.skills ?? []).map(employeeSkillFromRow),
    documents: (children.documents ?? []).map(employeeDocumentFromRow),
    activities: (children.activities ?? []).map(employeeActivityFromRow),
    leaveEntitlements: (children.leaveEntitlements ?? []).map(employeeLeaveEntitlementFromRow),
    leaveRequests: (children.leaveRequests ?? []).map(employeeLeaveRequestFromRow),
  };
}

export function employeeToRow(record: EmployeeRecord): EmployeeRow {
  return {
    id: record.id,
    search_key: record.searchKey,
    business_partner_group: record.businessPartnerGroup || "Employee",
    name: record.name,
    first_name: record.firstName,
    last_name: record.lastName,
    preferred_name: record.preferredName,
    middle_name: record.middleName,
    email: record.email,
    phone: record.phone,
    mobile: record.mobile,
    job_title: record.jobTitle,
    department: record.department,
    employment_status: record.employmentStatus,
    employment_type: record.employmentType,
    start_date: toDate(record.startDate),
    end_date: toDate(record.endDate),
    probation_end_date: toDate(record.probationEndDate),
    confirmation_date: toDate(record.confirmationDate),
    notice_days: record.noticeDays?.trim() ? Number(record.noticeDays) : null,
    site_branch: record.siteBranch,
    cost_centre: record.costCentre,
    gender: record.gender,
    birthday: toDate(record.birthday),
    employee_number: record.employeeNumber,
    reports_to_id: record.reportsToId?.trim() ? record.reportsToId : null,
    manager_name: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    driver_licence_class: record.driverLicenceClass,
    driver_licence_expiry: toDate(record.driverLicenceExpiry),
    visa_subclass: record.visaSubclass,
    visa_expiry: toDate(record.visaExpiry),
    work_rights_notes: record.workRightsNotes,
    bank_name: record.bankName,
    bank_bsb: record.bankBsb,
    bank_account_number: record.bankAccountNumber,
    pay_method: record.payMethod,
    tfn: record.tfn,
    tax_declaration: record.taxDeclaration,
    super_fund: record.superFund,
    super_member_number: record.superMemberNumber,
    standard_hours_per_week: record.standardHoursPerWeek?.trim() ? Number(record.standardHoursPerWeek) : null,
    fte: record.fte?.trim() ? Number(record.fte) : null,
    leave_policy: record.leavePolicy,
    medical_restrictions_notes: record.medicalRestrictionsNotes,
    notes: record.notes,
    picture_url: record.pictureUrl ?? "",
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

// --- Incident ---

export type IncidentRow = {
  id: string;
  document_no: string;
  title: string;
  status: string;
  severity: string;
  category: string;
  service_type: string;
  is_reportable: boolean;
  reportable_type: string;
  restrictive_practice_caused_harm: boolean;
  occurred_at: string | null;
  aware_at: string | null;
  reported_at: string | null;
  report_deadline_at: string | null;
  ndis_notified_at: string | null;
  ndis_notification_ref: string;
  primary_client_id: string | null;
  primary_employee_id: string | null;
  primary_location_id: string | null;
  linked_restrictive_practice_id: string | null;
  manager_reviewed_at: string | null;
  manager_reviewed_by: string;
  description: string;
  immediate_actions: string;
  investigation_summary: string;
  corrective_actions: string;
  lessons_learned: string;
  created_by: string;
  updated_by: string;
};

export type IncidentPartyRowDb = {
  id: string;
  incident_id: string;
  line_no: number;
  party_type: string;
  entity_id: string;
  party_name: string;
  role_in_incident: string;
  notes: string;
};

export type IncidentActionRowDb = {
  id: string;
  incident_id: string;
  line_no: number;
  action_date: string | null;
  action_type: string;
  description: string;
  evidence_ref: string;
  owner: string;
  outcome: string;
};

export type IncidentNotificationRowDb = {
  id: string;
  incident_id: string;
  line_no: number;
  notified_at: string | null;
  notify_target: string;
  method: string;
  notified_by: string;
  reference: string;
  notes: string;
};

export type IncidentEvidenceRowDb = {
  id: string;
  incident_id: string;
  line_no: number;
  action_id: string;
  file_name: string;
  file_url: string;
  storage_path: string;
  mime_type: string;
  uploaded_at: string | null;
  uploaded_by: string;
  notes: string;
};

export function incidentFromRow(
  row: IncidentRow,
  parties: IncidentPartyRowDb[] = [],
  actions: IncidentActionRowDb[] = [],
  notifications: IncidentNotificationRowDb[] = [],
  evidence: IncidentEvidenceRowDb[] = []
): IncidentRecord {
  return normalizeIncident({
    id: row.id,
    documentNo: row.document_no,
    title: row.title,
    status: row.status as IncidentRecord["status"],
    severity: row.severity as IncidentRecord["severity"],
    category: row.category,
    serviceType: row.service_type ?? "",
    isReportable: row.is_reportable,
    reportableType: row.reportable_type as IncidentRecord["reportableType"],
    restrictivePracticeCausedHarm: row.restrictive_practice_caused_harm,
    occurredAt: row.occurred_at ?? "",
    awareAt: row.aware_at ?? "",
    reportedAt: strDate(row.reported_at),
    reportDeadlineAt: row.report_deadline_at ?? "",
    ndisNotifiedAt: row.ndis_notified_at ?? "",
    ndisNotificationRef: row.ndis_notification_ref,
    primaryClientId: row.primary_client_id ?? "",
    primaryEmployeeId: row.primary_employee_id ?? "",
    primaryLocationId: row.primary_location_id ?? "",
    linkedRestrictivePracticeId: row.linked_restrictive_practice_id ?? "",
    managerReviewedAt: row.manager_reviewed_at ?? "",
    managerReviewedBy: row.manager_reviewed_by ?? "",
    description: row.description,
    immediateActions: row.immediate_actions,
    investigationSummary: row.investigation_summary,
    correctiveActions: row.corrective_actions,
    lessonsLearned: row.lessons_learned,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
    parties: parties.map(
      (p): IncidentPartyRow => ({
        id: p.id,
        lineNo: p.line_no,
        partyType: p.party_type as IncidentPartyRow["partyType"],
        entityId: p.entity_id,
        partyName: p.party_name,
        roleInIncident: p.role_in_incident,
        notes: p.notes,
      })
    ),
    actions: actions.map(
      (a): IncidentActionRow => ({
        id: a.id,
        lineNo: a.line_no,
        actionDate: strDate(a.action_date),
        actionType: a.action_type,
        description: a.description,
        evidenceRef: a.evidence_ref,
        owner: a.owner,
        outcome: a.outcome,
      })
    ),
    notifications: notifications.map(
      (n): IncidentNotificationRow => ({
        id: n.id,
        lineNo: n.line_no,
        notifiedAt: n.notified_at ?? "",
        notifyTarget: n.notify_target,
        method: n.method,
        notifiedBy: n.notified_by,
        reference: n.reference,
        notes: n.notes,
      })
    ),
    evidence: evidence.map(
      (e): IncidentEvidenceRow => ({
        id: e.id,
        lineNo: e.line_no,
        actionId: e.action_id,
        fileName: e.file_name,
        fileUrl: e.file_url,
        storagePath: e.storage_path,
        mimeType: e.mime_type,
        uploadedAt: e.uploaded_at ?? "",
        uploadedBy: e.uploaded_by,
        notes: e.notes,
      })
    ),
  });
}

export function incidentToRow(record: IncidentRecord): IncidentRow {
  const normalized = normalizeIncident(record);
  return {
    id: normalized.id,
    document_no: normalized.documentNo,
    title: normalized.title,
    status: normalized.status,
    severity: normalized.severity,
    category: normalized.category,
    service_type: normalized.serviceType?.trim() ?? "",
    is_reportable: normalized.isReportable,
    reportable_type: normalized.reportableType,
    restrictive_practice_caused_harm: normalized.restrictivePracticeCausedHarm,
    occurred_at: normalized.occurredAt || null,
    aware_at: normalized.awareAt || null,
    reported_at: toDate(normalized.reportedAt),
    report_deadline_at: normalized.reportDeadlineAt || null,
    ndis_notified_at: normalized.ndisNotifiedAt || null,
    ndis_notification_ref: normalized.ndisNotificationRef,
    primary_client_id: normalized.primaryClientId?.trim() ? normalized.primaryClientId : null,
    primary_employee_id: normalized.primaryEmployeeId?.trim() ? normalized.primaryEmployeeId : null,
    primary_location_id: normalized.primaryLocationId?.trim() ? normalized.primaryLocationId : null,
    linked_restrictive_practice_id: normalized.linkedRestrictivePracticeId?.trim()
      ? normalized.linkedRestrictivePracticeId
      : null,
    manager_reviewed_at: normalized.managerReviewedAt || null,
    manager_reviewed_by: normalized.managerReviewedBy,
    description: normalized.description,
    immediate_actions: normalized.immediateActions,
    investigation_summary: normalized.investigationSummary,
    corrective_actions: normalized.correctiveActions,
    lessons_learned: normalized.lessonsLearned,
    created_by: normalized.createdBy,
    updated_by: normalized.updatedBy,
  };
}

// --- Roster shift ---

export type RosterShiftRow = {
  id: string;
  shift_ref: string;
  client_id: string | null;
  employee_id: string | null;
  location_id: string | null;
  service_booking_id: string | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  status: string;
  notes: string;
  recurrence_group_id: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  check_in_notes: string;
  check_in_latitude: number | null;
  check_in_longitude: number | null;
  check_out_latitude: number | null;
  check_out_longitude: number | null;
  coverage_source: string;
  agency_worker_id: string | null;
  vendor_bp_id: string | null;
  agency_request_id: string | null;
  created_by: string;
  updated_by: string;
};

function geoFromRow(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "";
  return value.toFixed(6);
}

function geoToRow(value: string): number | null {
  if (!value?.trim()) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function rosterShiftFromRow(row: RosterShiftRow): RosterShiftRecord {
  return {
    id: row.id,
    shiftRef: row.shift_ref,
    clientId: row.client_id ?? "",
    employeeId: row.employee_id ?? "",
    locationId: row.location_id ?? "",
    serviceBookingId: row.service_booking_id ?? "",
    shiftDate: strDate(row.shift_date),
    startTime: String(row.start_time ?? "").slice(0, 5),
    endTime: String(row.end_time ?? "").slice(0, 5),
    shiftType: row.shift_type,
    status: row.status,
    notes: row.notes,
    recurrenceGroupId: row.recurrence_group_id ?? "",
    checkedInAt: row.checked_in_at ?? "",
    checkedOutAt: row.checked_out_at ?? "",
    checkInNotes: row.check_in_notes ?? "",
    checkInLatitude: geoFromRow(row.check_in_latitude),
    checkInLongitude: geoFromRow(row.check_in_longitude),
    checkOutLatitude: geoFromRow(row.check_out_latitude),
    checkOutLongitude: geoFromRow(row.check_out_longitude),
    coverageSource:
      row.coverage_source === "agency"
        ? "agency"
        : row.coverage_source === "internal"
          ? "internal"
          : row.agency_worker_id
            ? "agency"
            : "internal",
    agencyWorkerId: row.agency_worker_id ?? "",
    vendorBpId: row.vendor_bp_id ?? "",
    agencyRequestId: row.agency_request_id ?? "",
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export function rosterShiftToRow(record: RosterShiftRecord): RosterShiftRow {
  return {
    id: record.id,
    shift_ref: record.shiftRef,
    client_id: record.clientId?.trim() ? record.clientId : null,
    employee_id: record.employeeId?.trim() ? record.employeeId : null,
    location_id: record.locationId?.trim() ? record.locationId : null,
    service_booking_id: record.serviceBookingId?.trim() ? record.serviceBookingId : null,
    shift_date: toDate(record.shiftDate) ?? record.shiftDate,
    start_time: record.startTime?.slice(0, 5) || "09:00",
    end_time: record.endTime?.slice(0, 5) || "17:00",
    shift_type: record.shiftType,
    status: record.status,
    notes: record.notes,
    recurrence_group_id: record.recurrenceGroupId ?? "",
    checked_in_at: record.checkedInAt?.trim() ? record.checkedInAt : null,
    checked_out_at: record.checkedOutAt?.trim() ? record.checkedOutAt : null,
    check_in_notes: record.checkInNotes ?? "",
    check_in_latitude: geoToRow(record.checkInLatitude),
    check_in_longitude: geoToRow(record.checkInLongitude),
    check_out_latitude: geoToRow(record.checkOutLatitude),
    check_out_longitude: geoToRow(record.checkOutLongitude),
    coverage_source: record.coverageSource === "agency" ? "agency" : "internal",
    agency_worker_id: record.agencyWorkerId?.trim() ? record.agencyWorkerId : null,
    vendor_bp_id: record.vendorBpId?.trim() ? record.vendorBpId : null,
    agency_request_id: record.agencyRequestId?.trim() ? record.agencyRequestId : null,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

// --- Agency worker ---

export type AgencyWorkerRow = {
  id: string;
  search_key: string;
  vendor_bp_id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string;
  phone: string;
  qualifications: string;
  skills: string;
  tools_notes: string;
  active: boolean;
  notes: string;
  created_by: string;
  updated_by: string;
};

export function agencyWorkerFromRow(row: AgencyWorkerRow): AgencyWorkerRecord {
  return normalizeAgencyWorker({
    id: row.id,
    searchKey: row.search_key,
    vendorBpId: row.vendor_bp_id,
    firstName: row.first_name,
    lastName: row.last_name,
    name: row.name,
    email: row.email,
    phone: row.phone,
    qualifications: row.qualifications,
    skills: row.skills,
    toolsNotes: row.tools_notes,
    active: row.active !== false,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  });
}

export function agencyWorkerToRow(record: AgencyWorkerRecord): AgencyWorkerRow {
  const normalized = normalizeAgencyWorker(record);
  return {
    id: normalized.id,
    search_key: normalized.searchKey,
    vendor_bp_id: normalized.vendorBpId,
    first_name: normalized.firstName,
    last_name: normalized.lastName,
    name: normalized.name,
    email: normalized.email,
    phone: normalized.phone,
    qualifications: normalized.qualifications,
    skills: normalized.skills,
    tools_notes: normalized.toolsNotes,
    active: normalized.active,
    notes: normalized.notes,
    created_by: normalized.createdBy,
    updated_by: normalized.updatedBy,
  };
}

// --- Agency shift request ---

export type AgencyShiftRequestRow = {
  id: string;
  document_no: string;
  roster_shift_id: string;
  vendor_bp_id: string;
  agency_worker_id: string | null;
  status: string;
  skills_required: string;
  client_advised_at: string | null;
  sent_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  continuity_notes: string;
  vendor_invoice_ref: string;
  vendor_invoice_status: string;
  notes: string;
  created_by: string;
  updated_by: string;
};

export function agencyShiftRequestFromRow(row: AgencyShiftRequestRow): AgencyShiftRequestRecord {
  return normalizeAgencyShiftRequest({
    id: row.id,
    documentNo: row.document_no,
    rosterShiftId: row.roster_shift_id,
    vendorBpId: row.vendor_bp_id,
    agencyWorkerId: row.agency_worker_id ?? "",
    status: row.status as AgencyShiftRequestRecord["status"],
    skillsRequired: row.skills_required,
    clientAdvisedAt: row.client_advised_at ?? "",
    sentAt: row.sent_at ?? "",
    confirmedAt: row.confirmed_at ?? "",
    completedAt: row.completed_at ?? "",
    continuityNotes: row.continuity_notes,
    vendorInvoiceRef: row.vendor_invoice_ref,
    vendorInvoiceStatus: row.vendor_invoice_status,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  });
}

export function agencyShiftRequestToRow(record: AgencyShiftRequestRecord): AgencyShiftRequestRow {
  const normalized = normalizeAgencyShiftRequest(record);
  return {
    id: normalized.id,
    document_no: normalized.documentNo,
    roster_shift_id: normalized.rosterShiftId,
    vendor_bp_id: normalized.vendorBpId,
    agency_worker_id: normalized.agencyWorkerId?.trim() ? normalized.agencyWorkerId : null,
    status: normalized.status,
    skills_required: normalized.skillsRequired,
    client_advised_at: normalized.clientAdvisedAt?.trim() ? normalized.clientAdvisedAt : null,
    sent_at: normalized.sentAt?.trim() ? normalized.sentAt : null,
    confirmed_at: normalized.confirmedAt?.trim() ? normalized.confirmedAt : null,
    completed_at: normalized.completedAt?.trim() ? normalized.completedAt : null,
    continuity_notes: normalized.continuityNotes,
    vendor_invoice_ref: normalized.vendorInvoiceRef,
    vendor_invoice_status: normalized.vendorInvoiceStatus,
    notes: normalized.notes,
    created_by: normalized.createdBy,
    updated_by: normalized.updatedBy,
  };
}

// --- Site orientation ---

export type SiteOrientationRow = {
  id: string;
  worker_type: string;
  worker_id: string;
  location_id: string;
  oriented_at: string;
  expires_at: string | null;
  acknowledged_by: string;
  notes: string;
  created_by: string;
  updated_by: string;
};

export function siteOrientationFromRow(row: SiteOrientationRow): SiteOrientationRecord {
  return normalizeSiteOrientation({
    id: row.id,
    workerType: row.worker_type === "employee" ? "employee" : "agency",
    workerId: row.worker_id,
    locationId: row.location_id,
    orientedAt: strDate(row.oriented_at),
    expiresAt: row.expires_at ? strDate(row.expires_at) : "",
    acknowledgedBy: row.acknowledged_by,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  });
}

export function siteOrientationToRow(record: SiteOrientationRecord): SiteOrientationRow {
  const normalized = normalizeSiteOrientation(record);
  return {
    id: normalized.id,
    worker_type: normalized.workerType,
    worker_id: normalized.workerId,
    location_id: normalized.locationId,
    oriented_at: toDate(normalized.orientedAt) ?? normalized.orientedAt,
    expires_at: normalized.expiresAt?.trim() ? toDate(normalized.expiresAt) ?? normalized.expiresAt : null,
    acknowledged_by: normalized.acknowledgedBy,
    notes: normalized.notes,
    created_by: normalized.createdBy,
    updated_by: normalized.updatedBy,
  };
}

// --- Timesheet ---

export type TimesheetRow = {
  id: string;
  document_no: string;
  employee_id: string | null;
  period_start: string;
  period_end: string;
  status: string;
  total_hours: number;
  notes: string;
  payroll_export_status: string;
  payroll_exported_at: string | null;
  payroll_export_batch_ref: string;
  payroll_paid_hours: number | null;
  payroll_pay_run_ref: string;
  payroll_reconcile_status: string;
  payroll_reconciled_at: string | null;
  created_by: string;
  updated_by: string;
};

export type TimesheetLineRowDb = {
  id: string;
  timesheet_id: string;
  line_no: number;
  roster_shift_id: string | null;
  client_id: string | null;
  location_id: string | null;
  service_booking_id: string | null;
  shift_date: string | null;
  start_time: string | null;
  end_time: string | null;
  shift_type: string;
  hours: number;
  notes: string;
};

export function timesheetFromRow(row: TimesheetRow, lines: TimesheetLineRowDb[]): TimesheetRecord {
  return {
    id: row.id,
    documentNo: row.document_no,
    employeeId: row.employee_id ?? "",
    periodStart: strDate(row.period_start),
    periodEnd: strDate(row.period_end),
    status: row.status,
    totalHours: Number(row.total_hours) || 0,
    notes: row.notes,
    payrollExportStatus: row.payroll_export_status || "Not exported",
    payrollExportedAt: row.payroll_exported_at ?? "",
    payrollExportBatchRef: row.payroll_export_batch_ref ?? "",
    payrollPaidHours: row.payroll_paid_hours != null ? Number(row.payroll_paid_hours) : 0,
    payrollPayRunRef: row.payroll_pay_run_ref ?? "",
    payrollReconcileStatus: row.payroll_reconcile_status || "Pending",
    payrollReconciledAt: row.payroll_reconciled_at ?? "",
    lines: lines.map(timesheetLineFromRow),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function timesheetLineFromRow(row: TimesheetLineRowDb): TimesheetLine {
  return {
    id: row.id,
    lineNo: row.line_no,
    rosterShiftId: row.roster_shift_id ?? "",
    clientId: row.client_id ?? "",
    locationId: row.location_id ?? "",
    serviceBookingId: row.service_booking_id ?? "",
    shiftDate: row.shift_date ? strDate(row.shift_date) : "",
    startTime: String(row.start_time ?? "").slice(0, 5),
    endTime: String(row.end_time ?? "").slice(0, 5),
    shiftType: row.shift_type,
    hours: Number(row.hours) || 0,
    notes: row.notes,
  };
}

export function timesheetToRow(record: TimesheetRecord): TimesheetRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    employee_id: record.employeeId?.trim() ? record.employeeId : null,
    period_start: toDate(record.periodStart) ?? record.periodStart,
    period_end: toDate(record.periodEnd) ?? record.periodEnd,
    status: record.status,
    total_hours: record.totalHours,
    notes: record.notes,
    payroll_export_status: record.payrollExportStatus || "Not exported",
    payroll_exported_at: record.payrollExportedAt?.trim() ? record.payrollExportedAt : null,
    payroll_export_batch_ref: record.payrollExportBatchRef ?? "",
    payroll_paid_hours: record.payrollPaidHours > 0 ? record.payrollPaidHours : null,
    payroll_pay_run_ref: record.payrollPayRunRef ?? "",
    payroll_reconcile_status: record.payrollReconcileStatus || "Pending",
    payroll_reconciled_at: record.payrollReconciledAt?.trim() ? record.payrollReconciledAt : null,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function timesheetLineToRow(timesheetId: string, line: TimesheetLine): TimesheetLineRowDb {
  return {
    id: line.id,
    timesheet_id: timesheetId,
    line_no: line.lineNo,
    roster_shift_id: line.rosterShiftId?.trim() ? line.rosterShiftId : null,
    client_id: line.clientId?.trim() ? line.clientId : null,
    location_id: line.locationId?.trim() ? line.locationId : null,
    service_booking_id: line.serviceBookingId?.trim() ? line.serviceBookingId : null,
    shift_date: line.shiftDate ? toDate(line.shiftDate) : null,
    start_time: line.startTime?.slice(0, 5) || null,
    end_time: line.endTime?.slice(0, 5) || null,
    shift_type: line.shiftType,
    hours: line.hours,
    notes: line.notes,
  };
}

// --- Claim ---

export type ClaimRow = {
  id: string;
  document_no: string;
  client_id: string | null;
  period_start: string;
  period_end: string;
  status: string;
  plan_management_type: string;
  total_amount: number;
  gateway_status: string;
  gateway_ref: string;
  remittance_status: string;
  remittance_paid_amount: number;
  remittance_payment_ref: string;
  remittance_imported_at: string | null;
  notes: string;
  created_by: string;
  updated_by: string;
};

export type ClaimLineRowDb = {
  id: string;
  claim_id: string;
  line_no: number;
  timesheet_id: string | null;
  timesheet_line_id: string | null;
  roster_shift_id: string | null;
  client_id: string | null;
  employee_id: string | null;
  service_booking_id: string | null;
  product_id: string | null;
  ndis_support_item: string;
  support_category: string;
  service_date: string | null;
  quantity: number;
  unit_price: number;
  line_amount: number;
  claim_type: string;
  validation_status: string;
  validation_message: string;
};

export function claimFromRow(row: ClaimRow, lines: ClaimLineRowDb[]): ClaimRecord {
  return {
    id: row.id,
    documentNo: row.document_no,
    clientId: row.client_id ?? "",
    periodStart: strDate(row.period_start),
    periodEnd: strDate(row.period_end),
    status: row.status,
    planManagementType: row.plan_management_type,
    totalAmount: Number(row.total_amount) || 0,
    gatewayStatus: row.gateway_status || "Not submitted",
    gatewayRef: row.gateway_ref ?? "",
    remittanceStatus: row.remittance_status || "Not imported",
    remittancePaidAmount: Number(row.remittance_paid_amount) || 0,
    remittancePaymentRef: row.remittance_payment_ref ?? "",
    remittanceImportedAt: row.remittance_imported_at ?? "",
    notes: row.notes,
    lines: lines.map(claimLineFromRow),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function claimLineFromRow(row: ClaimLineRowDb): ClaimLine {
  return {
    id: row.id,
    lineNo: row.line_no,
    timesheetId: row.timesheet_id ?? "",
    timesheetLineId: row.timesheet_line_id ?? "",
    rosterShiftId: row.roster_shift_id ?? "",
    clientId: row.client_id ?? "",
    employeeId: row.employee_id ?? "",
    serviceBookingId: row.service_booking_id ?? "",
    productId: row.product_id ?? "",
    ndisSupportItem: row.ndis_support_item ?? "",
    supportCategory: row.support_category ?? "",
    serviceDate: row.service_date ? strDate(row.service_date) : "",
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unit_price) || 0,
    lineAmount: Number(row.line_amount) || 0,
    claimType: row.claim_type || "Standard",
    validationStatus: row.validation_status || "pass",
    validationMessage: row.validation_message ?? "",
  };
}

export function claimToRow(record: ClaimRecord): ClaimRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    client_id: record.clientId?.trim() ? record.clientId : null,
    period_start: toDate(record.periodStart) ?? record.periodStart,
    period_end: toDate(record.periodEnd) ?? record.periodEnd,
    status: record.status,
    plan_management_type: record.planManagementType || "Agency managed",
    total_amount: record.totalAmount,
    gateway_status: record.gatewayStatus || "Not submitted",
    gateway_ref: record.gatewayRef ?? "",
    remittance_status: record.remittanceStatus || "Not imported",
    remittance_paid_amount: record.remittancePaidAmount,
    remittance_payment_ref: record.remittancePaymentRef ?? "",
    remittance_imported_at: record.remittanceImportedAt?.trim() ? record.remittanceImportedAt : null,
    notes: record.notes,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function claimLineToRow(claimId: string, line: ClaimLine): ClaimLineRowDb {
  return {
    id: line.id,
    claim_id: claimId,
    line_no: line.lineNo,
    timesheet_id: line.timesheetId?.trim() ? line.timesheetId : null,
    timesheet_line_id: line.timesheetLineId?.trim() ? line.timesheetLineId : null,
    roster_shift_id: line.rosterShiftId?.trim() ? line.rosterShiftId : null,
    client_id: line.clientId?.trim() ? line.clientId : null,
    employee_id: line.employeeId?.trim() ? line.employeeId : null,
    service_booking_id: line.serviceBookingId?.trim() ? line.serviceBookingId : null,
    product_id: line.productId?.trim() ? line.productId : null,
    ndis_support_item: line.ndisSupportItem ?? "",
    support_category: line.supportCategory ?? "",
    service_date: line.serviceDate ? toDate(line.serviceDate) : null,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    line_amount: line.lineAmount,
    claim_type: line.claimType || "Standard",
    validation_status: line.validationStatus || "pass",
    validation_message: line.validationMessage ?? "",
  };
}

// --- Claim remittance ---

export type ClaimRemittanceRow = {
  id: string;
  document_no: string;
  source_filename: string;
  payment_reference: string;
  remittance_date: string | null;
  total_paid: number;
  matched_count: number;
  unmatched_count: number;
  variance_count: number;
  created_by: string;
  updated_by: string;
};

export type ClaimRemittanceLineRowDb = {
  id: string;
  remittance_id: string;
  line_no: number;
  participant_ndis_number: string;
  support_item_number: string;
  service_date: string | null;
  claimed_amount: number;
  paid_amount: number;
  gateway_claim_ref: string;
  match_status: string;
  match_message: string;
  claim_id: string | null;
  claim_line_id: string | null;
};

export function claimRemittanceFromRow(
  row: ClaimRemittanceRow,
  lines: ClaimRemittanceLineRowDb[]
): ClaimRemittanceRecord {
  return {
    id: row.id,
    documentNo: row.document_no,
    sourceFilename: row.source_filename ?? "",
    paymentReference: row.payment_reference ?? "",
    remittanceDate: row.remittance_date ? strDate(row.remittance_date) : "",
    totalPaid: Number(row.total_paid) || 0,
    matchedCount: row.matched_count ?? 0,
    unmatchedCount: row.unmatched_count ?? 0,
    varianceCount: row.variance_count ?? 0,
    lines: lines.map(claimRemittanceLineFromRow),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function claimRemittanceLineFromRow(row: ClaimRemittanceLineRowDb): ClaimRemittanceLine {
  return {
    id: row.id,
    lineNo: row.line_no,
    participantNdisNumber: row.participant_ndis_number ?? "",
    supportItemNumber: row.support_item_number ?? "",
    serviceDate: row.service_date ? strDate(row.service_date) : "",
    claimedAmount: Number(row.claimed_amount) || 0,
    paidAmount: Number(row.paid_amount) || 0,
    gatewayClaimRef: row.gateway_claim_ref ?? "",
    matchStatus: (row.match_status || "Pending") as ClaimRemittanceLine["matchStatus"],
    matchMessage: row.match_message ?? "",
    claimId: row.claim_id ?? "",
    claimLineId: row.claim_line_id ?? "",
  };
}

export function claimRemittanceToRow(record: ClaimRemittanceRecord): ClaimRemittanceRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    source_filename: record.sourceFilename ?? "",
    payment_reference: record.paymentReference ?? "",
    remittance_date: record.remittanceDate ? toDate(record.remittanceDate) : null,
    total_paid: record.totalPaid,
    matched_count: record.matchedCount,
    unmatched_count: record.unmatchedCount,
    variance_count: record.varianceCount,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function claimRemittanceLineToRow(
  remittanceId: string,
  line: ClaimRemittanceLine
): ClaimRemittanceLineRowDb {
  return {
    id: line.id,
    remittance_id: remittanceId,
    line_no: line.lineNo,
    participant_ndis_number: line.participantNdisNumber ?? "",
    support_item_number: line.supportItemNumber ?? "",
    service_date: line.serviceDate ? toDate(line.serviceDate) : null,
    claimed_amount: line.claimedAmount,
    paid_amount: line.paidAmount,
    gateway_claim_ref: line.gatewayClaimRef ?? "",
    match_status: line.matchStatus || "Pending",
    match_message: line.matchMessage ?? "",
    claim_id: line.claimId?.trim() ? line.claimId : null,
    claim_line_id: line.claimLineId?.trim() ? line.claimLineId : null,
  };
}

// --- Invoice ---

export type InvoiceRow = {
  id: string;
  document_no: string;
  client_id: string | null;
  period_start: string;
  period_end: string;
  status: string;
  plan_management_type: string;
  total_amount: number;
  invoice_to: string;
  invoice_to_email: string;
  due_date: string | null;
  sent_at: string | null;
  payment_status: string;
  paid_amount: number;
  payment_reference: string;
  notes: string;
  created_by: string;
  updated_by: string;
};

export type InvoiceLineRowDb = {
  id: string;
  invoice_id: string;
  line_no: number;
  timesheet_id: string | null;
  timesheet_line_id: string | null;
  roster_shift_id: string | null;
  client_id: string | null;
  employee_id: string | null;
  service_booking_id: string | null;
  product_id: string | null;
  ndis_support_item: string;
  support_category: string;
  service_date: string | null;
  quantity: number;
  unit_price: number;
  line_amount: number;
  line_description: string;
  validation_status: string;
  validation_message: string;
};

export function invoiceFromRow(row: InvoiceRow, lines: InvoiceLineRowDb[]): InvoiceRecord {
  return {
    id: row.id,
    documentNo: row.document_no,
    clientId: row.client_id ?? "",
    periodStart: strDate(row.period_start),
    periodEnd: strDate(row.period_end),
    status: row.status,
    planManagementType: row.plan_management_type,
    totalAmount: Number(row.total_amount) || 0,
    invoiceTo: row.invoice_to ?? "",
    invoiceToEmail: row.invoice_to_email ?? "",
    dueDate: row.due_date ? strDate(row.due_date) : "",
    sentAt: row.sent_at ?? "",
    paymentStatus: row.payment_status || "Unpaid",
    paidAmount: Number(row.paid_amount) || 0,
    paymentReference: row.payment_reference ?? "",
    notes: row.notes,
    lines: lines.map(invoiceLineFromRow),
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

function invoiceLineFromRow(row: InvoiceLineRowDb): InvoiceLine {
  return {
    id: row.id,
    lineNo: row.line_no,
    timesheetId: row.timesheet_id ?? "",
    timesheetLineId: row.timesheet_line_id ?? "",
    rosterShiftId: row.roster_shift_id ?? "",
    clientId: row.client_id ?? "",
    employeeId: row.employee_id ?? "",
    serviceBookingId: row.service_booking_id ?? "",
    productId: row.product_id ?? "",
    ndisSupportItem: row.ndis_support_item ?? "",
    supportCategory: row.support_category ?? "",
    serviceDate: row.service_date ? strDate(row.service_date) : "",
    quantity: Number(row.quantity) || 0,
    unitPrice: Number(row.unit_price) || 0,
    lineAmount: Number(row.line_amount) || 0,
    lineDescription: row.line_description ?? "",
    validationStatus: row.validation_status || "pass",
    validationMessage: row.validation_message ?? "",
  };
}

export function invoiceToRow(record: InvoiceRecord): InvoiceRow {
  return {
    id: record.id,
    document_no: record.documentNo,
    client_id: record.clientId?.trim() ? record.clientId : null,
    period_start: toDate(record.periodStart) ?? record.periodStart,
    period_end: toDate(record.periodEnd) ?? record.periodEnd,
    status: record.status,
    plan_management_type: record.planManagementType || "Plan managed",
    total_amount: record.totalAmount,
    invoice_to: record.invoiceTo ?? "",
    invoice_to_email: record.invoiceToEmail ?? "",
    due_date: record.dueDate ? toDate(record.dueDate) : null,
    sent_at: record.sentAt?.trim() ? record.sentAt : null,
    payment_status: record.paymentStatus || "Unpaid",
    paid_amount: record.paidAmount,
    payment_reference: record.paymentReference ?? "",
    notes: record.notes,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

export function invoiceLineToRow(invoiceId: string, line: InvoiceLine): InvoiceLineRowDb {
  return {
    id: line.id,
    invoice_id: invoiceId,
    line_no: line.lineNo,
    timesheet_id: line.timesheetId?.trim() ? line.timesheetId : null,
    timesheet_line_id: line.timesheetLineId?.trim() ? line.timesheetLineId : null,
    roster_shift_id: line.rosterShiftId?.trim() ? line.rosterShiftId : null,
    client_id: line.clientId?.trim() ? line.clientId : null,
    employee_id: line.employeeId?.trim() ? line.employeeId : null,
    service_booking_id: line.serviceBookingId?.trim() ? line.serviceBookingId : null,
    product_id: line.productId?.trim() ? line.productId : null,
    ndis_support_item: line.ndisSupportItem ?? "",
    support_category: line.supportCategory ?? "",
    service_date: line.serviceDate ? toDate(line.serviceDate) : null,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    line_amount: line.lineAmount,
    line_description: line.lineDescription ?? "",
    validation_status: line.validationStatus || "pass",
    validation_message: line.validationMessage ?? "",
  };
}

// --- Portal service request ---

export type PortalServiceRequestRow = {
  id: string;
  client_id: string;
  status: string;
  service_category: string;
  support_budget: string;
  description: string;
  preferred_schedule: string;
  task_id: string | null;
  variation_agreement_id: string | null;
  submitted_by_email: string;
  decline_reason: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
};

export function portalServiceRequestFromRow(row: PortalServiceRequestRow) {
  return {
    id: row.id,
    clientId: row.client_id,
    status: row.status as import("@/lib/portal/service-request").PortalServiceRequestStatus,
    serviceCategory: row.service_category ?? "",
    supportBudget: row.support_budget ?? "",
    description: row.description ?? "",
    preferredSchedule: row.preferred_schedule ?? "",
    taskId: row.task_id ?? "",
    variationAgreementId: row.variation_agreement_id ?? "",
    submittedByEmail: row.submitted_by_email ?? "",
    declineReason: row.decline_reason ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    createdBy: row.created_by ?? "",
    updatedBy: row.updated_by ?? "",
  };
}

export function portalServiceRequestToRow(
  record: import("@/lib/portal/service-request").PortalServiceRequestRecord
): PortalServiceRequestRow {
  return {
    id: record.id,
    client_id: record.clientId,
    status: record.status,
    service_category: record.serviceCategory,
    support_budget: record.supportBudget,
    description: record.description,
    preferred_schedule: record.preferredSchedule,
    task_id: record.taskId || null,
    variation_agreement_id: record.variationAgreementId || null,
    submitted_by_email: record.submittedByEmail,
    decline_reason: record.declineReason,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}

// --- Business partner (external orgs) ---

export type BusinessPartnerRow = {
  id: string;
  search_key: string;
  name: string;
  partner_type: string;
  status: string;
  email: string;
  phone: string;
  mobile: string;
  abn: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  preferred_communication_method: string;
  invoice_delivery_method: string;
  statement_delivery_method: string;
  payment_terms: string;
  bank_bsb: string;
  bank_account_number: string;
  bank_account_name: string;
  remittance_email: string;
  notes: string;
  created_by: string;
  updated_by: string;
};

export function businessPartnerFromRow(row: BusinessPartnerRow): BusinessPartnerRecord {
  return {
    id: row.id,
    searchKey: row.search_key,
    name: row.name,
    partnerType: row.partner_type,
    status: row.status,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    abn: row.abn,
    address1: row.address1,
    address2: row.address2,
    city: row.city,
    state: row.state,
    postcode: row.postcode,
    country: row.country,
    preferredCommunicationMethod: row.preferred_communication_method,
    invoiceDeliveryMethod: row.invoice_delivery_method,
    statementDeliveryMethod: row.statement_delivery_method,
    paymentTerms: row.payment_terms,
    bankBsb: row.bank_bsb,
    bankAccountNumber: row.bank_account_number,
    bankAccountName: row.bank_account_name,
    remittanceEmail: row.remittance_email,
    notes: row.notes,
    createdBy: row.created_by,
    updatedBy: row.updated_by,
  };
}

export function businessPartnerToRow(record: BusinessPartnerRecord): BusinessPartnerRow {
  return {
    id: record.id,
    search_key: record.searchKey,
    name: record.name,
    partner_type: record.partnerType,
    status: record.status,
    email: record.email,
    phone: record.phone,
    mobile: record.mobile,
    abn: record.abn,
    address1: record.address1,
    address2: record.address2,
    city: record.city,
    state: record.state,
    postcode: record.postcode,
    country: record.country,
    preferred_communication_method: record.preferredCommunicationMethod,
    invoice_delivery_method: record.invoiceDeliveryMethod,
    statement_delivery_method: record.statementDeliveryMethod,
    payment_terms: record.paymentTerms,
    bank_bsb: record.bankBsb,
    bank_account_number: record.bankAccountNumber,
    bank_account_name: record.bankAccountName,
    remittance_email: record.remittanceEmail,
    notes: record.notes,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}
