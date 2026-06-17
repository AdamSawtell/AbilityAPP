import type { SharedReferenceDataKey } from "@/lib/system/reference-data-sections";

/** Where a shared reference list appears in the workspace (module + page/tab). */
export type ReferenceDataUsageLocation = {
  area: string;
  pages: string[];
};

/**
 * Shared lists are edited once under System → Admin → Reference data.
 * This map shows every module and tab that reads each list.
 */
export const SHARED_REFERENCE_DATA_USAGE: Record<SharedReferenceDataKey, ReferenceDataUsageLocation[]> = {
  yesNo: [
    { area: "Clients", pages: ["Support plan — Yes/No fields", "Contacts — Primary contact"] },
    { area: "Locations", pages: ["Client assignments — Primary", "Employee assignments — Primary", "Services — Active"] },
  ],
  showAsAlert: [
    { area: "Clients", pages: ["Alerts", "Restrictive practices", "Consents", "Risks", "Need rules"] },
    { area: "Locations", pages: ["Alerts"] },
    { area: "People", pages: ["Alerts"] },
  ],
  gender: [
    { area: "Clients", pages: ["Full profile"] },
    { area: "People", pages: ["Profile"] },
    { area: "Enquiries", pages: ["Participant"] },
  ],
  fundingBody: [
    { area: "Clients", pages: ["Full profile"] },
    { area: "Enquiries", pages: ["Participant"] },
  ],
  disability: [
    { area: "Clients", pages: ["Full profile"] },
    { area: "Enquiries", pages: ["Support needs"] },
  ],
  addressType: [
    { area: "Clients", pages: ["Locations — Address lines"] },
    { area: "People", pages: ["Addresses"] },
  ],
  australianState: [
    { area: "Clients", pages: ["Locations — State"] },
    { area: "People", pages: ["Addresses — State"] },
    { area: "Locations", pages: ["Overview — Address"] },
  ],
  country: [
    { area: "Clients", pages: ["Locations — Country"] },
    { area: "People", pages: ["Addresses — Country"] },
    { area: "Locations", pages: ["Overview — Address"] },
  ],
  primaryLanguage: [
    { area: "Clients", pages: ["Support plan — Primary / preferred language"] },
  ],
  contactRelationship: [
    { area: "Clients", pages: ["Contacts — Relationship"] },
    { area: "People", pages: ["Emergency contacts — Relationship"] },
  ],
};

export function sharedReferenceDataUsage(key: string): ReferenceDataUsageLocation[] | null {
  if (!(key in SHARED_REFERENCE_DATA_USAGE)) return null;
  return SHARED_REFERENCE_DATA_USAGE[key as SharedReferenceDataKey];
}

export function formatSharedReferenceDataUsage(key: string): string[] {
  const usage = sharedReferenceDataUsage(key);
  if (!usage?.length) return [];
  return usage.flatMap(({ area, pages }) => pages.map((page) => `${area} — ${page}`));
}
