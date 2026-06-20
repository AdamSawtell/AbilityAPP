import type { OrganizationRecord } from "@/lib/organization";
import type { EnquiryRecord } from "@/lib/enquiry";

export const ENQUIRY_QUALIFICATION_TIERS = ["Hot", "Warm", "Cold", "Not qualified"] as const;

export type EnquiryQualificationTier = (typeof ENQUIRY_QUALIFICATION_TIERS)[number];

export type QualificationFactor = {
  code: string;
  label: string;
  points: number;
  maxPoints: number;
  detail: string;
};

export type EnquiryQualificationResult = {
  score: number;
  tier: EnquiryQualificationTier;
  factors: QualificationFactor[];
  summary: string;
};

export const QUALIFICATION_TIER_BADGE_CLASS: Record<EnquiryQualificationTier, string> = {
  Hot: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Warm: "bg-amber-50 text-amber-900 ring-amber-200",
  Cold: "bg-sky-50 text-sky-900 ring-sky-200",
  "Not qualified": "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

function parsePostcode(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return null;
  const n = Number.parseInt(digits.slice(0, 4), 10);
  return Number.isFinite(n) ? n : null;
}

function fundingBodyPoints(fundingBody: string): QualificationFactor {
  const maxPoints = 25;
  const body = fundingBody.trim().toLowerCase();
  if (body.includes("ndis")) {
    return {
      code: "FUNDING_NDIS",
      label: "Funding body",
      points: 25,
      maxPoints,
      detail: "NDIS-funded enquiry — core intake fit.",
    };
  }
  if (body.includes("dsoa")) {
    return {
      code: "FUNDING_DSOA",
      label: "Funding body",
      points: 12,
      maxPoints,
      detail: "DSOA funding — confirm service eligibility.",
    };
  }
  if (body.includes("self")) {
    return {
      code: "FUNDING_SELF",
      label: "Funding body",
      points: 8,
      maxPoints,
      detail: "Self-funded — confirm fee-for-service pathway.",
    };
  }
  if (!body) {
    return {
      code: "FUNDING_MISSING",
      label: "Funding body",
      points: 0,
      maxPoints,
      detail: "Funding body not recorded.",
    };
  }
  return {
    code: "FUNDING_OTHER",
    label: "Funding body",
    points: 5,
    maxPoints,
    detail: "Non-NDIS funding — confirm scope before proposal.",
  };
}

function planStatusPoints(planStatus: string): QualificationFactor {
  const maxPoints = 20;
  const status = planStatus.trim().toLowerCase();
  if (status.includes("active")) {
    return { code: "PLAN_ACTIVE", label: "Plan status", points: 20, maxPoints, detail: "Active NDIS plan." };
  }
  if (status.includes("review")) {
    return {
      code: "PLAN_REVIEW",
      label: "Plan status",
      points: 15,
      maxPoints,
      detail: "Plan review approaching — good nurture timing.",
    };
  }
  if (status.includes("pending") || status.includes("new")) {
    return {
      code: "PLAN_PENDING",
      label: "Plan status",
      points: 8,
      maxPoints,
      detail: "Plan pending — confirm access date before proposal.",
    };
  }
  if (status.includes("ended")) {
    return {
      code: "PLAN_ENDED",
      label: "Plan status",
      points: 0,
      maxPoints,
      detail: "Plan ended — unlikely to proceed without renewal.",
    };
  }
  return {
    code: "PLAN_UNKNOWN",
    label: "Plan status",
    points: 3,
    maxPoints,
    detail: "Plan status not confirmed.",
  };
}

function planManagementPoints(planManagementType: string): QualificationFactor {
  const maxPoints = 15;
  const type = planManagementType.trim().toLowerCase();
  if (type.includes("agency")) {
    return {
      code: "PLAN_MGMT_AGENCY",
      label: "Plan management",
      points: 15,
      maxPoints,
      detail: "Agency managed — direct claiming pathway.",
    };
  }
  if (type.includes("plan")) {
    return {
      code: "PLAN_MGMT_PLAN",
      label: "Plan management",
      points: 10,
      maxPoints,
      detail: "Plan managed — invoice plan manager after delivery.",
    };
  }
  if (type.includes("self")) {
    return {
      code: "PLAN_MGMT_SELF",
      label: "Plan management",
      points: 8,
      maxPoints,
      detail: "Self managed — participant invoices directly.",
    };
  }
  return {
    code: "PLAN_MGMT_UNKNOWN",
    label: "Plan management",
    points: 0,
    maxPoints,
    detail: "Plan management type not recorded.",
  };
}

function locationPoints(postcode: string, org?: OrganizationRecord | null): QualificationFactor {
  const maxPoints = 20;
  const parsed = parsePostcode(postcode);
  if (parsed === null) {
    return {
      code: "LOCATION_MISSING",
      label: "Service area",
      points: 0,
      maxPoints,
      detail: "Participant postcode not recorded.",
    };
  }

  const orgPostcode = parsePostcode(org?.postcode ?? "");
  const sameMetro =
    parsed >= 5000 &&
    parsed <= 5199 &&
    (orgPostcode === null || (orgPostcode >= 5000 && orgPostcode <= 5199));
  const regionalSa = parsed >= 5200 && parsed <= 5999;

  if (sameMetro) {
    return {
      code: "LOCATION_METRO",
      label: "Service area",
      points: 20,
      maxPoints,
      detail: `Postcode ${parsed} — within Adelaide metro service area.`,
    };
  }
  if (regionalSa) {
    return {
      code: "LOCATION_REGIONAL",
      label: "Service area",
      points: 12,
      maxPoints,
      detail: `Postcode ${parsed} — regional SA; confirm travel coverage.`,
    };
  }
  return {
    code: "LOCATION_OUTSIDE",
    label: "Service area",
    points: 3,
    maxPoints,
    detail: `Postcode ${parsed} — outside default SA service area.`,
  };
}

function supportCategoryPoints(supportCategories: string, services: string): QualificationFactor {
  const maxPoints = 15;
  const combined = `${supportCategories}\n${services}`.trim();
  if (!combined) {
    return {
      code: "CATEGORIES_MISSING",
      label: "Support categories",
      points: 0,
      maxPoints,
      detail: "Support categories or services not described.",
    };
  }
  const tokens = combined.split(/[,;\n]+/).map((t) => t.trim()).filter(Boolean);
  const points = Math.min(maxPoints, 5 + tokens.length * 3);
  return {
    code: "CATEGORIES_MATCH",
    label: "Support categories",
    points,
    maxPoints,
    detail: `${tokens.length} support need${tokens.length === 1 ? "" : "s"} captured.`,
  };
}

function urgencyPoints(urgency: string): QualificationFactor {
  const maxPoints = 15;
  const value = urgency.trim().toLowerCase();
  if (value.includes("high")) {
    return {
      code: "URGENCY_HIGH",
      label: "Urgency",
      points: 15,
      maxPoints,
      detail: "High urgency — prioritise intake contact.",
    };
  }
  if (value.includes("normal")) {
    return {
      code: "URGENCY_NORMAL",
      label: "Urgency",
      points: 8,
      maxPoints,
      detail: "Normal urgency — standard intake timeline.",
    };
  }
  if (value.includes("low")) {
    return {
      code: "URGENCY_LOW",
      label: "Urgency",
      points: 3,
      maxPoints,
      detail: "Low urgency — nurture and follow up at plan review.",
    };
  }
  return {
    code: "URGENCY_UNKNOWN",
    label: "Urgency",
    points: 0,
    maxPoints,
    detail: "Urgency not recorded.",
  };
}

function contactPoints(record: EnquiryRecord): QualificationFactor {
  const maxPoints = 5;
  const hasContact = Boolean(record.phone?.trim() || record.email?.trim());
  return {
    code: "CONTACT",
    label: "Contact details",
    points: hasContact ? 5 : 0,
    maxPoints,
    detail: hasContact ? "Phone or email on file." : "Add phone or email for intake follow-up.",
  };
}

export function tierForScore(score: number): EnquiryQualificationTier {
  if (score >= 70) return "Hot";
  if (score >= 45) return "Warm";
  if (score >= 25) return "Cold";
  return "Not qualified";
}

export function summarizeQualificationTier(tier: EnquiryQualificationTier): string {
  switch (tier) {
    case "Hot":
      return "Strong NDIS fit — fast-track to proposal and service design.";
    case "Warm":
      return "Promising lead — complete qualification and confirm plan details.";
    case "Cold":
      return "Limited fit today — nurture with plan review follow-up.";
    default:
      return "Poor fit or missing data — review before investing intake effort.";
  }
}

export function scoreEnquiryQualification(
  record: EnquiryRecord,
  org?: OrganizationRecord | null
): EnquiryQualificationResult {
  const factors = [
    fundingBodyPoints(record.fundingBody),
    planStatusPoints(record.planStatus),
    planManagementPoints(record.planManagementType),
    locationPoints(record.postcode, org),
    supportCategoryPoints(record.supportCategories, record.services),
    urgencyPoints(record.urgency),
    contactPoints(record),
  ];

  const score = factors.reduce((sum, factor) => sum + factor.points, 0);
  const tier = tierForScore(score);
  return {
    score,
    tier,
    factors,
    summary: summarizeQualificationTier(tier),
  };
}

export function applyEnquiryQualification(
  record: EnquiryRecord,
  org?: OrganizationRecord | null
): EnquiryRecord {
  const result = scoreEnquiryQualification(record, org);
  return {
    ...record,
    qualificationScore: result.score,
    qualificationTier: result.tier,
    qualificationSummary: result.summary,
  };
}

export function normalizeEnquiryQualification(record: EnquiryRecord): EnquiryRecord {
  return applyEnquiryQualification({
    ...record,
    ndisNumber: record.ndisNumber ?? "",
    planStatus: record.planStatus ?? "",
    planManagementType: record.planManagementType ?? "",
    postcode: record.postcode ?? "",
    supportCategories: record.supportCategories ?? "",
    urgency: record.urgency ?? "",
    qualificationScore: record.qualificationScore ?? 0,
    qualificationTier: record.qualificationTier ?? "Not qualified",
    qualificationSummary: record.qualificationSummary ?? "",
  });
}
