import type { ClientConsentRow } from "@/lib/client-line-tables";

/** Mandatory NDIS participant consents from scope (Stage 1). */
export const CORE_CONSENT_TYPES = [
  "Service delivery",
  "Information collection and sharing",
  "Photography and video",
] as const;

export type CoreConsentType = (typeof CORE_CONSENT_TYPES)[number];

export const CONSENT_STATUSES = ["Pending", "Granted", "Refused", "Not required", "Expired"] as const;

export type ConsentStatus = (typeof CONSENT_STATUSES)[number];

const LEGACY_CONSENT_TYPE_MAP: Record<string, CoreConsentType | string> = {
  "Photo / video": "Photography and video",
  "Information sharing": "Information collection and sharing",
};

export function normalizeConsentType(value: string): string {
  const trimmed = value.trim();
  return LEGACY_CONSENT_TYPE_MAP[trimmed] ?? trimmed;
}

export function normalizeConsentStatus(value: string | undefined | null): ConsentStatus {
  const trimmed = (value ?? "").trim();
  if ((CONSENT_STATUSES as readonly string[]).includes(trimmed)) return trimmed as ConsentStatus;
  return "Pending";
}

function consentSortKey(row: ClientConsentRow): string {
  return row.validFrom || "0000-00-00";
}

/** Most recent active line for a consent type (by valid from, then line no). */
export function currentConsentForType(
  consents: ClientConsentRow[],
  consentType: string
): ClientConsentRow | undefined {
  const target = normalizeConsentType(consentType);
  const today = new Date().toISOString().slice(0, 10);
  const matches = consents
    .filter((c) => normalizeConsentType(c.consentType) === target)
    .filter((c) => !c.validTo || c.validTo >= today)
    .sort((a, b) => {
      const dateCmp = consentSortKey(b).localeCompare(consentSortKey(a));
      if (dateCmp !== 0) return dateCmp;
      return b.lineNo - a.lineNo;
    });
  if (matches.length) return matches[0];
  return consents
    .filter((c) => normalizeConsentType(c.consentType) === target)
    .sort((a, b) => b.lineNo - a.lineNo)[0];
}

export type CoreConsentSummaryItem = {
  consentType: CoreConsentType;
  status: ConsentStatus | "Missing";
  record?: ClientConsentRow;
};

export function summarizeCoreConsents(consents: ClientConsentRow[]): CoreConsentSummaryItem[] {
  return CORE_CONSENT_TYPES.map((consentType) => {
    const record = currentConsentForType(consents, consentType);
    if (!record) return { consentType, status: "Missing" as const };
    return {
      consentType,
      status: normalizeConsentStatus(record.consentStatus),
      record,
    };
  });
}

export function coreConsentsComplete(consents: ClientConsentRow[]): boolean {
  return summarizeCoreConsents(consents).every(
    (item) => item.status === "Granted" || item.status === "Not required"
  );
}

export const CONSENT_STATUS_BADGE_CLASS: Record<ConsentStatus | "Missing", string> = {
  Granted: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Refused: "bg-rose-50 text-rose-900 ring-rose-200",
  Pending: "bg-amber-50 text-amber-900 ring-amber-200",
  "Not required": "bg-slate-100 text-slate-700 ring-slate-200",
  Expired: "bg-orange-50 text-orange-900 ring-orange-200",
  Missing: "bg-slate-100 text-slate-600 ring-slate-200",
};
