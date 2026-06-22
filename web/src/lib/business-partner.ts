import { defaultReferenceData } from "@/lib/reference-data";

export type BusinessPartnerRecord = {
  id: string;
  searchKey: string;
  name: string;
  partnerType: string;
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
  preferredCommunicationMethod: string;
  invoiceDeliveryMethod: string;
  statementDeliveryMethod: string;
  paymentTerms: string;
  bankBsb: string;
  bankAccountNumber: string;
  bankAccountName: string;
  remittanceEmail: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

export type BusinessPartnerFieldDef = {
  key: keyof BusinessPartnerRecord;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select";
  optionsKey?: string;
  readOnly?: boolean;
};

export const businessPartnerTypeOptions = defaultReferenceData.businessPartnerType;
export const businessPartnerStatusOptions = defaultReferenceData.businessPartnerStatus;
export const invoiceDeliveryMethodOptions = defaultReferenceData.invoiceDeliveryMethod;
export const statementDeliveryMethodOptions = defaultReferenceData.statementDeliveryMethod;
export const paymentTermsOptions = defaultReferenceData.paymentTerms;

export const businessPartnerSections: { title: string; fields: BusinessPartnerFieldDef[] }[] = [
  {
    title: "Identity",
    fields: [
      { key: "searchKey", label: "Search key", type: "text" },
      { key: "name", label: "Name", type: "text" },
      { key: "partnerType", label: "Partner type", type: "select", optionsKey: "businessPartnerType" },
      { key: "status", label: "Status", type: "select", optionsKey: "businessPartnerStatus" },
      { key: "abn", label: "ABN", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "tel" },
      { key: "mobile", label: "Mobile", type: "tel" },
      { key: "address1", label: "Address line 1", type: "text" },
      { key: "address2", label: "Address line 2", type: "text" },
      { key: "city", label: "City / suburb", type: "text" },
      { key: "state", label: "State", type: "select", optionsKey: "australianState" },
      { key: "postcode", label: "Postcode", type: "text" },
      { key: "country", label: "Country", type: "select", optionsKey: "country" },
    ],
  },
  {
    title: "Communication preferences",
    fields: [
      {
        key: "preferredCommunicationMethod",
        label: "Preferred communication",
        type: "select",
        optionsKey: "preferredCommunicationMethod",
      },
      { key: "invoiceDeliveryMethod", label: "Invoice delivery", type: "select", optionsKey: "invoiceDeliveryMethod" },
      {
        key: "statementDeliveryMethod",
        label: "Statement delivery",
        type: "select",
        optionsKey: "statementDeliveryMethod",
      },
    ],
  },
  {
    title: "Payment details",
    fields: [
      { key: "paymentTerms", label: "Payment terms", type: "select", optionsKey: "paymentTerms" },
      { key: "bankBsb", label: "Bank BSB", type: "text" },
      { key: "bankAccountNumber", label: "Bank account number", type: "text" },
      { key: "bankAccountName", label: "Bank account name", type: "text" },
      { key: "remittanceEmail", label: "Remittance email", type: "email" },
    ],
  },
  {
    title: "System",
    fields: [
      { key: "createdBy", label: "Created by", type: "text", readOnly: true },
      { key: "updatedBy", label: "Updated by", type: "text", readOnly: true },
    ],
  },
];

export const initialBusinessPartners: BusinessPartnerRecord[] = [
  {
    id: "bp-myplan-manager",
    searchKey: "MyPlan Manager",
    name: "MyPlan Manager Pty Ltd",
    partnerType: "Plan manager",
    status: "Active",
    email: "invoices@myplanmanager.example",
    phone: "08 8100 1100",
    mobile: "",
    abn: "12 345 678 901",
    address1: "100 King William Street",
    address2: "",
    city: "Adelaide",
    state: "SA",
    postcode: "5000",
    country: "Australia",
    preferredCommunicationMethod: "Email",
    invoiceDeliveryMethod: "Email",
    statementDeliveryMethod: "Email",
    paymentTerms: "14 days",
    bankBsb: "",
    bankAccountNumber: "",
    bankAccountName: "",
    remittanceEmail: "invoices@myplanmanager.example",
    notes: "Default plan manager for plan-managed participants.",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  },
  {
    id: "bp-ndis-hub",
    searchKey: "NDIS Hub SA",
    name: "NDIS Hub South Australia",
    partnerType: "Referrer",
    status: "Active",
    email: "referrals@ndishub.example",
    phone: "08 8200 2200",
    mobile: "",
    abn: "",
    address1: "",
    address2: "",
    city: "Adelaide",
    state: "SA",
    postcode: "5000",
    country: "Australia",
    preferredCommunicationMethod: "Phone Call",
    invoiceDeliveryMethod: "Email",
    statementDeliveryMethod: "Email",
    paymentTerms: "",
    bankBsb: "",
    bankAccountNumber: "",
    bankAccountName: "",
    remittanceEmail: "",
    notes: "Community referral partner.",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  },
  {
    id: "bp-adelaide-clean",
    searchKey: "Adelaide Clean Co",
    name: "Adelaide Cleaning Cooperative",
    partnerType: "Vendor",
    status: "Active",
    email: "accounts@adelclean.example",
    phone: "08 8300 3300",
    mobile: "",
    abn: "98 765 432 109",
    address1: "",
    address2: "",
    city: "Adelaide",
    state: "SA",
    postcode: "5000",
    country: "Australia",
    preferredCommunicationMethod: "Email",
    invoiceDeliveryMethod: "Email",
    statementDeliveryMethod: "Post",
    paymentTerms: "30 days",
    bankBsb: "",
    bankAccountNumber: "",
    bankAccountName: "",
    remittanceEmail: "accounts@adelclean.example",
    notes: "Facility cleaning vendor.",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  },
];

export function normalizeBusinessPartner(record: BusinessPartnerRecord): BusinessPartnerRecord {
  return {
    ...record,
    searchKey: record.searchKey?.trim() || record.name?.trim() || "",
    name: record.name?.trim() || "",
    partnerType: record.partnerType || "",
    status: record.status || "Active",
    country: record.country?.trim() || "Australia",
  };
}

export function createBusinessPartner(
  partial: Partial<BusinessPartnerRecord> & Pick<BusinessPartnerRecord, "searchKey" | "name" | "partnerType">,
  existing: BusinessPartnerRecord[] = []
): BusinessPartnerRecord {
  const id = partial.id?.trim() || `bp-${Date.now().toString(36)}`;
  const searchKey = partial.searchKey.trim();
  if (existing.some((p) => p.id !== id && p.searchKey.toLowerCase() === searchKey.toLowerCase())) {
    throw new Error(`Search key "${searchKey}" is already used by another business partner.`);
  }
  const draft = normalizeBusinessPartner({
    id,
    searchKey,
    name: partial.name.trim(),
    partnerType: partial.partnerType,
    status: partial.status ?? "Active",
    email: partial.email ?? "",
    phone: partial.phone ?? "",
    mobile: partial.mobile ?? "",
    abn: partial.abn ?? "",
    address1: partial.address1 ?? "",
    address2: partial.address2 ?? "",
    city: partial.city ?? "",
    state: partial.state ?? "",
    postcode: partial.postcode ?? "",
    country: partial.country ?? "Australia",
    preferredCommunicationMethod: partial.preferredCommunicationMethod ?? "",
    invoiceDeliveryMethod: partial.invoiceDeliveryMethod ?? "",
    statementDeliveryMethod: partial.statementDeliveryMethod ?? "",
    paymentTerms: partial.paymentTerms ?? "",
    bankBsb: partial.bankBsb ?? "",
    bankAccountNumber: partial.bankAccountNumber ?? "",
    bankAccountName: partial.bankAccountName ?? "",
    remittanceEmail: partial.remittanceEmail ?? "",
    notes: partial.notes ?? "",
    createdBy: partial.createdBy ?? "SuperUser",
    updatedBy: partial.updatedBy ?? "SuperUser",
  });
  return draft;
}

export function findBusinessPartnerById(
  partners: BusinessPartnerRecord[],
  id: string | undefined
): BusinessPartnerRecord | undefined {
  if (!id?.trim()) return undefined;
  return partners.find((p) => p.id === id.trim());
}

export function assertUniqueBusinessPartnerSearchKey(
  record: BusinessPartnerRecord,
  existing: BusinessPartnerRecord[] = []
): void {
  const key = record.searchKey.trim().toLowerCase();
  if (!key) return;
  if (existing.some((p) => p.id !== record.id && p.searchKey.trim().toLowerCase() === key)) {
    throw new Error(`Search key "${record.searchKey}" is already used by another business partner.`);
  }
}

export function businessPartnerDirectoryOptions(
  partners: BusinessPartnerRecord[],
  includeIds: string[] = []
): string[] {
  const include = new Set(includeIds.filter(Boolean));
  return partners.filter((p) => p.status === "Active" || include.has(p.id)).map((p) => p.id);
}

export function businessPartnerOptionLabels(partners: BusinessPartnerRecord[]): Record<string, string> {
  return Object.fromEntries(partners.map((p) => [p.id, `${p.searchKey} — ${p.partnerType}`]));
}
