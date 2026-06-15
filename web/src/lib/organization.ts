/** Organisation profile — provider identity used across NDIS documents and branding. */

import type { AuditStampable } from "@/lib/audit";

export type OrganizationRecord = AuditStampable & {
  id: string;
  tradingName: string;
  legalName: string;
  searchKey: string;
  abn: string;
  ndisRegistrationNumber: string;
  ndisProviderOutcomeId: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  registrationGroups: string;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

export type OrganizationFieldDef = {
  key: keyof OrganizationRecord;
  label: string;
  type: "text" | "email" | "tel" | "url" | "textarea";
  placeholder?: string;
  hint?: string;
};

export type OrganizationSection = {
  title: string;
  description?: string;
  fields: OrganizationFieldDef[];
};

export const ORGANIZATION_ID = "org-default";

export const organizationSections: OrganizationSection[] = [
  {
    title: "Identity",
    description: "How your organisation appears on the sign-in page, documents, agreements, and in the app header.",
    fields: [
      { key: "tradingName", label: "Trading name", type: "text", placeholder: "AbilityAPP Community Services" },
      { key: "legalName", label: "Legal name", type: "text", placeholder: "AbilityAPP Pty Ltd" },
      { key: "searchKey", label: "Short code", type: "text", placeholder: "AbilityAPP", hint: "Used as a quick reference in lists and reports." },
      { key: "logoUrl", label: "Logo URL", type: "url", placeholder: "https://…/logo.png", hint: "Shown on the sign-in page and app header." },
    ],
  },
  {
    title: "NDIS & registration",
    description: "Provider identifiers required for NDIS claims and service agreements.",
    fields: [
      { key: "abn", label: "ABN", type: "text", placeholder: "12 345 678 901" },
      { key: "ndisRegistrationNumber", label: "NDIS registration number", type: "text", placeholder: "40500…" },
      { key: "ndisProviderOutcomeId", label: "NDIS provider outcome ID", type: "text", placeholder: "Optional portal identifier" },
      {
        key: "registrationGroups",
        label: "Registration groups",
        type: "textarea",
        placeholder: "One NDIS registration group per line",
        hint: "Groups your organisation is registered to deliver under.",
      },
    ],
  },
  {
    title: "Contact",
    fields: [
      { key: "email", label: "General email", type: "email" },
      { key: "phone", label: "General phone", type: "tel" },
      { key: "website", label: "Website", type: "url", placeholder: "https://…" },
      { key: "primaryContactName", label: "Primary contact name", type: "text" },
      { key: "primaryContactEmail", label: "Primary contact email", type: "email" },
      { key: "primaryContactPhone", label: "Primary contact phone", type: "tel" },
    ],
  },
  {
    title: "Address",
    fields: [
      { key: "address1", label: "Address line 1", type: "text" },
      { key: "address2", label: "Address line 2", type: "text" },
      { key: "city", label: "City / suburb", type: "text" },
      { key: "state", label: "State", type: "text", placeholder: "SA" },
      { key: "postcode", label: "Postcode", type: "text" },
      { key: "country", label: "Country", type: "text" },
    ],
  },
  {
    title: "Notes",
    fields: [
      { key: "notes", label: "Internal notes", type: "textarea", placeholder: "Optional context for administrators" },
    ],
  },
];

export function defaultOrganization(): OrganizationRecord {
  return {
    id: ORGANIZATION_ID,
    tradingName: "AbilityAPP Community Services",
    legalName: "AbilityAPP Pty Ltd",
    searchKey: "AbilityAPP",
    abn: "",
    ndisRegistrationNumber: "",
    ndisProviderOutcomeId: "",
    email: "admin@abilityapp.local",
    phone: "08 8294 1100",
    website: "",
    logoUrl: "",
    address1: "100 King William Street",
    address2: "",
    city: "Adelaide",
    state: "SA",
    postcode: "5000",
    country: "Australia",
    primaryContactName: "Super User",
    primaryContactEmail: "superuser@abilityapp.local",
    primaryContactPhone: "",
    registrationGroups: [
      "Assistance With Daily Life Tasks In A Group Or Shared Living",
      "Participation In Community And Social And Civic Activities",
      "Support Coordination",
    ].join("\n"),
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function normalizeOrganization(record: OrganizationRecord): OrganizationRecord {
  return {
    ...defaultOrganization(),
    ...record,
    id: ORGANIZATION_ID,
    registrationGroups: (record.registrationGroups ?? "").trim(),
  };
}

export function organizationDisplayName(record: OrganizationRecord) {
  return record.tradingName.trim() || record.legalName.trim() || record.searchKey.trim() || "AbilityAPP";
}

export function formatOrganizationAddress(record: OrganizationRecord): string {
  const lines = [
    record.address1,
    record.address2,
    [record.city, record.state, record.postcode].filter(Boolean).join(" "),
    record.country,
  ].filter((line) => line?.trim());
  return lines.join("\n");
}

export function organizationAddressLine(record: OrganizationRecord): string {
  const cityLine = [record.city, record.state, record.postcode].filter(Boolean).join(" ");
  return [record.address1, cityLine].filter((line) => line?.trim()).join(", ");
}

export function organizationRegistrationGroups(record: OrganizationRecord): string[] {
  return record.registrationGroups
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
