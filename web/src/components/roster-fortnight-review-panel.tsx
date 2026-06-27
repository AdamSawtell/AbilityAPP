"use client";

import { useMemo } from "react";
import { PayPeriodRangePicker } from "@/components/pay-period-admin-panel";
import { buildFortnightRosterReview, type FortnightReviewIssueType } from "@/lib/roster-fortnight-review";
import { formatDayHeading } from "@/lib/roster-shift";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { RosterOfCareRecord } from "@/lib/roster-of-care";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import { useData } from "@/lib/data-store";

const ISSUE_LABELS: Record<FortnightReviewIssueType, string> = {
  "missing-actual": "Missing actual",
  "extra-actual": "Extra actual",
  vacant: "Vacant",
  "worker-changed": "Worker changed",
  draft: "Draft",
};

const ISSUE_CLASSES: Record<FortnightReviewIssueType, string> = {
  "missing-actual": "bg-rose-50 text-rose-900 ring-rose-200",
  "extra-actual": "bg-sky-50 text-sky-900 ring-sky-200",
  vacant: "bg-amber-50 text-amber-900 ring-amber-200",
  "worker-changed": "bg-violet-50 text-violet-900 ring-violet-200",
  draft: "bg-slate-50 text-slate-800 ring-slate-200",
};

export function RosterFortnightReviewPanel({
  rosterOfCares,
  rosterShifts,
  clients,
  locations,
  payPeriodInstanceId,
  onPayPeriodChange,
  onOpenIssue,
}: {
  rosterOfCares: RosterOfCareRecord[];
  rosterShifts: RosterShiftRecord[];
  clients: ClientRecord[];
  locations: LocationRecord[];
  payPeriodInstanceId: string;
  onPayPeriodChange: (instanceId: string) => void;
  onOpenIssue?: (issue: { date: string; rosterShiftId?: string }) => void;
}) {
  const { payPeriodInstances } = useData();
  const payPeriod = payPeriodInstances.find((row) => row.id === payPeriodInstanceId);

  const review = useMemo(() => {
    if (!payPeriod) {
      return {
        rangeStart: "",
        rangeEnd: "",
        templateCount: 0,
        actualCount: 0,
        matchedCount: 0,
        issues: [],
      };
    }
    return buildFortnightRosterReview(
      rosterOfCares,
      rosterShifts,
      payPeriod.startDate,
      payPeriod.endDate
    );
  }, [rosterOfCares, rosterShifts, payPeriod]);

  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients]);
  const locationById = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);
  const issueCounts = useMemo(() => {
    const counts = new Map<FortnightReviewIssueType, number>();
    for (const issue of review.issues) counts.set(issue.type, (counts.get(issue.type) ?? 0) + 1);
    return counts;
  }, [review.issues]);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Fortnight command centre</h2>
            <p className="mt-1 text-sm text-slate-600">
              Compare active RoC templates with the live roster for the selected pay period before publishing or filling
              gaps.
            </p>
          </div>
          <PayPeriodRangePicker
            instanceId={payPeriodInstanceId}
            onInstanceIdChange={onPayPeriodChange}
            showNavigation
            showDates={false}
          />
        </div>
        {review.rangeStart ? (
          <p className="mt-3 text-sm font-medium text-slate-800">
            {formatDayHeading(review.rangeStart)} – {formatDayHeading(review.rangeEnd)}
          </p>
        ) : (
          <p className="mt-3 text-sm text-slate-600">Select a pay period to review the roster against RoC templates.</p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label="RoC template lines" value={review.templateCount} />
          <Metric label="Live shifts" value={review.actualCount} />
          <Metric label="Matched lines" value={review.matchedCount} />
          <Metric label="Issues" value={review.issues.length} tone={review.issues.length ? "warn" : "ok"} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {(Object.keys(ISSUE_LABELS) as FortnightReviewIssueType[]).map((type) => (
            <span key={type} className={`rounded-full px-2 py-1 font-medium ring-1 ${ISSUE_CLASSES[type]}`}>
              {ISSUE_LABELS[type]}: {issueCounts.get(type) ?? 0}
            </span>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Review actions</h3>
          <p className="mt-1 text-sm text-slate-500">
            Use missing/vacant/draft rows as the roster officer checklist before the pay period is final.
          </p>
        </div>
        {review.issues.length ? (
          <ul className="divide-y divide-slate-100">
            {review.issues.map((issue) => {
              const client = issue.clientId ? clientById.get(issue.clientId) : undefined;
              const location = issue.locationId ? locationById.get(issue.locationId) : undefined;
              return (
                <li key={issue.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{issue.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {issue.date}
                        {client ? ` · ${client.searchKey}` : ""}
                        {location ? ` · ${location.searchKey}` : ""}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{issue.detail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ring-1 ${ISSUE_CLASSES[issue.type]}`}>
                        {ISSUE_LABELS[issue.type]}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenIssue?.(issue)}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-[#b51266] hover:bg-slate-50"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : payPeriod ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            No issues in this pay period — live roster matches the active RoC templates.
          </p>
        ) : (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Choose a pay period to run the review.</p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone?: "ok" | "warn" }) {
  return (
    <div
      className={`rounded-xl border p-4 ${tone === "warn" ? "border-amber-200 bg-amber-50" : tone === "ok" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
