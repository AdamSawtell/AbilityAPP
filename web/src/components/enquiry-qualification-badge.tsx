"use client";

import {
  QUALIFICATION_TIER_BADGE_CLASS,
  type EnquiryQualificationTier,
} from "@/lib/enquiry-qualification";

export function EnquiryQualificationBadge({ tier, score }: { tier: string; score?: number }) {
  const key = (tier || "Not qualified") as EnquiryQualificationTier;
  const tone = QUALIFICATION_TIER_BADGE_CLASS[key] ?? QUALIFICATION_TIER_BADGE_CLASS["Not qualified"];
  const label = score && score > 0 ? `${tier} (${score})` : tier || "Not qualified";

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
      {label}
    </span>
  );
}
