"use client";

import Link from "next/link";
import { ClientRecordLink } from "@/components/record-link";
import { StatusBadge } from "@/components/status-badge";
import { formatDisplayDate, type EnquiryRecord } from "@/lib/enquiry";
import { isEnquiryFollowUpOverdue, isEnquiryLost } from "@/lib/enquiry-pipeline";
import type { ClientRecord } from "@/lib/client";

function initials(firstName: string, lastName: string) {
  const parts = [firstName, lastName].filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function EnquiryCoreSummary({
  record,
  participantName,
  linkedClient,
  saved,
}: {
  record: EnquiryRecord;
  participantName: string;
  linkedClient?: ClientRecord | null;
  saved?: boolean;
}) {
  const activityTabHref = `/enquiries/${record.id}?tab=${encodeURIComponent("Activity")}`;
  const followUpOverdue = isEnquiryFollowUpOverdue(record.dateNextAction, record.status);
  const lost = isEnquiryLost(record.status);

  return (
    <div className="mb-6 space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-lg font-bold text-white shadow-md">
              {initials(record.firstName, record.lastName) || "?"}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                {participantName || "Enquiry participant"}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">Enquiry {record.documentNo}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {saved ? (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
                    Saved
                  </span>
                ) : null}
                <StatusBadge status={record.status} />
                {record.activity.length > 0 ? (
                  <Link
                    href={activityTabHref}
                    className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-900 ring-1 ring-sky-200 ring-inset hover:bg-sky-100"
                  >
                    {record.activity.length} activit{record.activity.length === 1 ? "y" : "ies"}
                  </Link>
                ) : null}
                {linkedClient ? (
                  <ClientRecordLink
                    id={linkedClient.id}
                    searchKey={linkedClient.searchKey}
                    name={linkedClient.name}
                    className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200 ring-inset hover:bg-emerald-100"
                  >
                    Client {linkedClient.searchKey}
                  </ClientRecordLink>
                ) : null}
              </div>
            </div>
          </div>

          <dl className="grid min-w-[220px] gap-3 text-sm sm:text-right">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Funding</dt>
              <dd className="mt-0.5 font-medium text-slate-800">{record.fundingBody || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Disability</dt>
              <dd className="mt-0.5 text-slate-700">{record.disability || "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="grid border-t border-slate-100 bg-slate-50/60 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Received</p>
            <p className="mt-0.5 text-sm text-slate-800">{formatDisplayDate(record.dateReceived)}</p>
          </div>
          <div className="border-b border-slate-100 px-5 py-3 sm:border-b-0 sm:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Next action</p>
            <p className={`mt-0.5 text-sm ${followUpOverdue ? "font-medium text-rose-700" : "text-slate-800"}`}>
              {formatDisplayDate(record.dateNextAction)}
              {followUpOverdue ? " (overdue)" : ""}
            </p>
          </div>
          {lost && record.lossReason ? (
            <div className="border-b border-slate-100 px-5 py-3 lg:border-b-0 lg:border-r">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Loss reason</p>
              <p className="mt-0.5 text-sm text-slate-800">{record.lossReason}</p>
            </div>
          ) : null}
          <div className="border-b border-slate-100 px-5 py-3 lg:border-b-0 lg:border-r">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone</p>
            <p className="mt-0.5 text-sm text-slate-800">{record.phone || "—"}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Email</p>
            <p className="mt-0.5 truncate text-sm text-slate-800">{record.email || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
