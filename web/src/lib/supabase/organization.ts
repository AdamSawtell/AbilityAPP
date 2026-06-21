import type { OrganizationRecord } from "@/lib/organization";
import { ORGANIZATION_ID } from "@/lib/organization";

export type OrganizationRow = {
  id: string;
  trading_name: string;
  legal_name: string;
  search_key: string;
  abn: string;
  ndis_registration_number: string;
  ndis_provider_outcome_id: string;
  email: string;
  phone: string;
  website: string;
  logo_url: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
  registration_groups: string;
  incident_investigation_sla_days: number;
  bank_bsb: string;
  bank_account: string;
  bank_account_name: string;
  remittance_email: string;
  document_footer_text: string;
  gst_registered: boolean;
  notes: string;
  created_by: string;
  updated_by: string;
  created_at?: string;
  updated_at?: string;
};

export function organizationFromRow(row: OrganizationRow): OrganizationRecord {
  return {
    id: row.id,
    tradingName: row.trading_name ?? "",
    legalName: row.legal_name ?? "",
    searchKey: row.search_key ?? "",
    abn: row.abn ?? "",
    ndisRegistrationNumber: row.ndis_registration_number ?? "",
    ndisProviderOutcomeId: row.ndis_provider_outcome_id ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    website: row.website ?? "",
    logoUrl: row.logo_url ?? "",
    address1: row.address1 ?? "",
    address2: row.address2 ?? "",
    city: row.city ?? "",
    state: row.state ?? "",
    postcode: row.postcode ?? "",
    country: row.country ?? "Australia",
    primaryContactName: row.primary_contact_name ?? "",
    primaryContactEmail: row.primary_contact_email ?? "",
    primaryContactPhone: row.primary_contact_phone ?? "",
    registrationGroups: row.registration_groups ?? "",
    incidentInvestigationSlaDays: row.incident_investigation_sla_days ?? 14,
    bankBsb: row.bank_bsb ?? "",
    bankAccount: row.bank_account ?? "",
    bankAccountName: row.bank_account_name ?? "",
    remittanceEmail: row.remittance_email ?? "",
    documentFooterText: row.document_footer_text ?? "",
    gstRegistered: row.gst_registered ?? false,
    notes: row.notes ?? "",
    createdBy: row.created_by ?? "",
    updatedBy: row.updated_by ?? "",
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

export function organizationToRow(record: OrganizationRecord): OrganizationRow {
  return {
    id: record.id || ORGANIZATION_ID,
    trading_name: record.tradingName,
    legal_name: record.legalName,
    search_key: record.searchKey,
    abn: record.abn,
    ndis_registration_number: record.ndisRegistrationNumber,
    ndis_provider_outcome_id: record.ndisProviderOutcomeId,
    email: record.email,
    phone: record.phone,
    website: record.website,
    logo_url: record.logoUrl,
    address1: record.address1,
    address2: record.address2,
    city: record.city,
    state: record.state,
    postcode: record.postcode,
    country: record.country,
    primary_contact_name: record.primaryContactName,
    primary_contact_email: record.primaryContactEmail,
    primary_contact_phone: record.primaryContactPhone,
    registration_groups: record.registrationGroups,
    incident_investigation_sla_days: record.incidentInvestigationSlaDays > 0 ? record.incidentInvestigationSlaDays : 14,
    bank_bsb: record.bankBsb,
    bank_account: record.bankAccount,
    bank_account_name: record.bankAccountName,
    remittance_email: record.remittanceEmail,
    document_footer_text: record.documentFooterText,
    gst_registered: record.gstRegistered,
    notes: record.notes,
    created_by: record.createdBy,
    updated_by: record.updatedBy,
  };
}
