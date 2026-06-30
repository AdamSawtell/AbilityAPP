/** Organisation profile — provider identity used across NDIS documents and branding. */

import type { AuditStampable } from "@/lib/audit";
import { normalizeBuddyShiftPayPolicy, type BuddyShiftPayPolicy } from "@/lib/buddy-shift";
import { normalizeInvestigationSlaDays } from "@/lib/incident-management-settings";
import { normalizeHexColour } from "@/lib/org-theme";

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
  incidentInvestigationSlaDays: number;
  bankBsb: string;
  bankAccount: string;
  bankAccountName: string;
  remittanceEmail: string;
  documentFooterText: string;
  gstRegistered: boolean;
  /** Buddy/orientation shift pay default: always_pay | dont_pay | ask */
  buddyShiftPayPolicy: BuddyShiftPayPolicy;
  /** When enabled, RoC publish uses organisation rollover defaults to maintain a forward live roster. */
  rosterRolloverEnabled: boolean;
  /** Number of future weeks to create from active RoC templates during bulk rollover. */
  rosterRolloverLookaheadWeeks: number;
  /** Default live shift status created from RoC rollover. */
  rosterRolloverDefaultStatus: "Draft" | "Published";
  /** Skip already-created live shifts when rolling RoC templates forward. */
  rosterRolloverSkipExisting: boolean;
  /** App shell primary brand colour (#RRGGBB). Empty = system default (AB-0017). */
  themePrimaryColour: string;
  /** App shell accent / login gradient colour (#RRGGBB). Empty = default. */
  themeAccentColour: string;
  /** Optional workspace background colour (#RRGGBB). Empty = default. */
  themeBackgroundColour: string;
  /** Optional primary text colour (#RRGGBB). Empty = default. */
  themeTextColour: string;
  /** Idle workspace timeout in minutes before the 2-minute warning appears. */
  idleTimeoutMinutes: number;
  notes: string;
  createdBy: string;
  updatedBy: string;
};

export type OrganizationFieldDef = {
  key: keyof OrganizationRecord;
  label: string;
  type: "text" | "email" | "tel" | "url" | "textarea" | "number" | "checkbox" | "select";
  options?: { value: string; label: string }[];
  placeholder?: string;
  hint?: string;
};

export type OrganizationSection = {
  title: string;
  description?: string;
  fields: OrganizationFieldDef[];
};

export const ORGANIZATION_ID = "org-default";
export const ORGANIZATION_STORAGE_KEY = "abilityvua-organization";

export const organizationSections: OrganizationSection[] = [
  {
    title: "Identity",
    description: "How your organisation appears on the sign-in page, documents, agreements, and in the app header.",
    fields: [
      { key: "tradingName", label: "Trading name", type: "text", placeholder: "AbilityVua Community Services" },
      { key: "legalName", label: "Legal name", type: "text", placeholder: "AbilityVua Pty Ltd" },
      { key: "searchKey", label: "Short code", type: "text", placeholder: "AbilityVua", hint: "Used as a quick reference in lists and reports." },
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
    title: "Document branding",
    description: "Header, footer, and payment details used on invoices and other generated documents.",
    fields: [
      { key: "bankBsb", label: "Bank BSB", type: "text", placeholder: "000-000" },
      { key: "bankAccount", label: "Bank account number", type: "text" },
      { key: "bankAccountName", label: "Bank account name", type: "text" },
      { key: "remittanceEmail", label: "Remittance email", type: "email" },
      {
        key: "gstRegistered",
        label: "GST registered",
        type: "checkbox",
        hint: "When checked, invoice templates use Tax Invoice and show GST lines.",
      },
      {
        key: "documentFooterText",
        label: "Document footer",
        type: "textarea",
        placeholder: "Optional footer text on all generated documents.",
      },
    ],
  },
  {
    title: "Roster rollover",
    description: "Defaults for creating live roster sessions from master roster-of-care templates.",
    fields: [
      {
        key: "rosterRolloverEnabled",
        label: "Use rollover defaults",
        type: "checkbox",
        hint: "Manual publish still requires a Rostering Officer; these values prefill the bulk rollover controls.",
      },
      {
        key: "rosterRolloverLookaheadWeeks",
        label: "Maintain roster ahead (weeks)",
        type: "number",
        hint: "How far forward RoC templates should be rolled into live roster sessions. Default is 2 weeks (one fortnight).",
      },
      {
        key: "rosterRolloverDefaultStatus",
        label: "Default rollover status",
        type: "select",
        options: [
          { value: "Draft", label: "Draft (review before publish)" },
          { value: "Published", label: "Published (worker required)" },
        ],
      },
      {
        key: "rosterRolloverSkipExisting",
        label: "Skip existing live shifts",
        type: "checkbox",
        hint: "Prevents duplicate live shifts when the same master period is rolled more than once.",
      },
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
    tradingName: "AbilityVua Community Services",
    legalName: "AbilityVua Pty Ltd",
    searchKey: "AbilityVua",
    abn: "12 345 678 901",
    ndisRegistrationNumber: "4050012345",
    ndisProviderOutcomeId: "",
    email: "admin@abilityvua.local",
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
    primaryContactEmail: "superuser@abilityvua.local",
    primaryContactPhone: "",
    registrationGroups: [
      "Assistance With Daily Life Tasks In A Group Or Shared Living",
      "Participation In Community And Social And Civic Activities",
      "Support Coordination",
    ].join("\n"),
    incidentInvestigationSlaDays: 14,
    bankBsb: "",
    bankAccount: "",
    bankAccountName: "",
    remittanceEmail: "",
    documentFooterText: "",
    gstRegistered: false,
    buddyShiftPayPolicy: "ask",
    rosterRolloverEnabled: true,
    rosterRolloverLookaheadWeeks: 2,
    rosterRolloverDefaultStatus: "Draft",
    rosterRolloverSkipExisting: true,
    themePrimaryColour: "",
    themeAccentColour: "",
    themeBackgroundColour: "",
    themeTextColour: "",
    idleTimeoutMinutes: 15,
    notes: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  };
}

export function normalizeIdleTimeoutMinutes(value: unknown): number {
  const minutes = Number(value);
  if (!Number.isFinite(minutes)) return 15;
  return Math.max(5, Math.min(120, Math.round(minutes)));
}

export function normalizeOrganization(record: OrganizationRecord): OrganizationRecord {
  const sla = Number(record.incidentInvestigationSlaDays);
  return {
    ...defaultOrganization(),
    ...record,
    id: ORGANIZATION_ID,
    registrationGroups: (record.registrationGroups ?? "").trim(),
    incidentInvestigationSlaDays: normalizeInvestigationSlaDays(sla),
    gstRegistered: Boolean(record.gstRegistered),
    buddyShiftPayPolicy: normalizeBuddyShiftPayPolicy(record.buddyShiftPayPolicy),
    rosterRolloverEnabled: Boolean(record.rosterRolloverEnabled),
    rosterRolloverLookaheadWeeks: Math.max(
      1,
      Math.min(12, Number(record.rosterRolloverLookaheadWeeks) || 2)
    ),
    rosterRolloverDefaultStatus:
      record.rosterRolloverDefaultStatus === "Published" ? "Published" : "Draft",
    rosterRolloverSkipExisting: record.rosterRolloverSkipExisting !== false,
    bankBsb: (record.bankBsb ?? "").trim(),
    bankAccount: (record.bankAccount ?? "").trim(),
    bankAccountName: (record.bankAccountName ?? "").trim(),
    remittanceEmail: (record.remittanceEmail ?? "").trim(),
    documentFooterText: (record.documentFooterText ?? "").trim(),
    themePrimaryColour: normalizeHexColour(record.themePrimaryColour),
    themeAccentColour: normalizeHexColour(record.themeAccentColour),
    themeBackgroundColour: normalizeHexColour(record.themeBackgroundColour),
    themeTextColour: normalizeHexColour(record.themeTextColour),
    idleTimeoutMinutes: normalizeIdleTimeoutMinutes(record.idleTimeoutMinutes),
  };
}

/** Organisation profile from browser storage — used when scoring enquiries outside React context. */
export function readStoredOrganization(): OrganizationRecord {
  if (typeof window === "undefined") return defaultOrganization();
  try {
    const raw = localStorage.getItem(ORGANIZATION_STORAGE_KEY);
    if (!raw?.trim()) return defaultOrganization();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return defaultOrganization();
    return normalizeOrganization(parsed as OrganizationRecord);
  } catch {
    return defaultOrganization();
  }
}

export function organizationDisplayName(record: OrganizationRecord) {
  return record.tradingName.trim() || record.legalName.trim() || record.searchKey.trim() || "AbilityVua";
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
