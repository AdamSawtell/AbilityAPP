"use client";

import type { CancellationPolicyOutcome } from "@/lib/booking-cancellation";

export function BookingCancellationPanel({
  outcome,
}: {
  outcome: CancellationPolicyOutcome | null;
}) {
  if (!outcome) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-slate-900">Cancellation policy</h3>
      <p className="mt-2 text-sm text-slate-700">{outcome.summary}</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Service start</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{outcome.serviceStartDate || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Notice given</dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            {outcome.noticeDaysGiven !== null
              ? `${outcome.noticeDaysGiven} days (required ${outcome.requiredNoticeDays})`
              : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Short notice</dt>
          <dd className="mt-0.5 font-medium text-slate-900">{outcome.isShortNotice ? "Yes" : "No"}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-slate-500">Est. claimable</dt>
          <dd className="mt-0.5 font-medium text-slate-900">
            {outcome.claimablePercent > 0
              ? `$${outcome.claimableAmount.toFixed(2)} (${outcome.claimablePercent}%)`
              : "Not claimable"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
