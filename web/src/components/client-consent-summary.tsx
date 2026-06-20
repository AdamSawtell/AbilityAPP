"use client";

import type { ClientConsentRow } from "@/lib/client-line-tables";
import {
  CONSENT_STATUS_BADGE_CLASS,
  summarizeCoreConsents,
  type ConsentStatus,
} from "@/lib/client-consent";

function statusLabel(status: ConsentStatus | "Missing"): string {
  return status;
}

export function ClientConsentSummary({ consents }: { consents: ClientConsentRow[] }) {
  const items = summarizeCoreConsents(consents);
  const incomplete = items.filter((i) => i.status !== "Granted" && i.status !== "Not required");

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-3">
        {items.map((item) => {
          const tone = CONSENT_STATUS_BADGE_CLASS[item.status];
          return (
            <div key={item.consentType} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <p className="text-xs font-medium text-slate-500">{item.consentType}</p>
              <p className="mt-1 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${tone}`}>
                  {statusLabel(item.status)}
                </span>
                {item.record?.name ? (
                  <span className="truncate text-xs text-slate-600" title={item.record.name}>
                    {item.record.name}
                  </span>
                ) : null}
              </p>
            </div>
          );
        })}
      </div>
      {incomplete.length > 0 ? (
        <p className="text-sm text-amber-900">
          {incomplete.length} core consent{incomplete.length === 1 ? "" : "s"} need attention before service delivery.
        </p>
      ) : (
        <p className="text-sm text-emerald-800">All core consents are recorded.</p>
      )}
    </div>
  );
}
