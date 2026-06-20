"use client";

import {
  QUALIFICATION_TIER_BADGE_CLASS,
  scoreEnquiryQualification,
  type EnquiryQualificationTier,
} from "@/lib/enquiry-qualification";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { OrganizationRecord } from "@/lib/organization";

export function EnquiryQualificationPanel({
  record,
  organization,
}: {
  record: EnquiryRecord;
  organization?: OrganizationRecord | null;
}) {
  const result = scoreEnquiryQualification(record, organization);
  const tierClass = QUALIFICATION_TIER_BADGE_CLASS[result.tier as EnquiryQualificationTier];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">NDIS qualification score</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{result.score}</p>
            <p className="text-sm text-slate-500">out of 100 points</p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${tierClass}`}>
            {result.tier}
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-700">{result.summary}</p>
        {result.tier === "Hot" && record.status.startsWith("1_") ? (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Strong fit — consider moving this enquiry to <strong>Qualification</strong> or <strong>Proposal</strong> in
            the pipeline.
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
          <h3 className="text-sm font-semibold text-slate-800">Score breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Factor</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.factors.map((factor) => (
                <tr key={factor.code}>
                  <td className="px-4 py-3 font-medium text-slate-800">{factor.label}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {factor.points}/{factor.maxPoints}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{factor.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
