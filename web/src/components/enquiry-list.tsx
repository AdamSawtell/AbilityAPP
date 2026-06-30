"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EnquiryRecordLink } from "@/components/record-link";
import {
  RecordListDashboard,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
} from "@/components/record-list-shell";
import { EmptyStateRow } from "@/components/ui/empty-state";
import { formatDisplayDate, type EnquiryRecord } from "@/lib/enquiry";
import {
  ENQUIRY_PIPELINE_LABELS,
  ENQUIRY_PIPELINE_STATUSES,
  isEnquiryClosed,
  isEnquiryFollowUpOverdue,
  normalizeEnquiryStatus,
} from "@/lib/enquiry-pipeline";
import { ENQUIRY_QUALIFICATION_TIERS } from "@/lib/enquiry-qualification";
import { EnquiryQualificationBadge } from "@/components/enquiry-qualification-badge";
import { StatusBadge } from "./status-badge";

export type EnquiryListScope = "active" | "all" | "overdue";

export function EnquiryList({ records, canCreate = false }: { records: EnquiryRecord[]; canCreate?: boolean }) {
  const searchParams = useSearchParams();
  const initialScope =
    searchParams.get("scope") === "all"
      ? "all"
      : searchParams.get("scope") === "overdue"
        ? "overdue"
        : "active";
  const [scope, setScope] = useState<EnquiryListScope>(initialScope);
  const [stageFilter, setStageFilter] = useState<string>("");
  const [tierFilter, setTierFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const activeCount = useMemo(
    () => records.filter((r) => !isEnquiryClosed(r.status)).length,
    [records]
  );
  const convertedCount = useMemo(
    () => records.filter((r) => normalizeEnquiryStatus(r.status) === "4_Converted").length,
    [records]
  );
  const overdueCount = useMemo(
    () =>
      records.filter(
        (r) => !isEnquiryClosed(r.status) && isEnquiryFollowUpOverdue(r.dateNextAction, r.status)
      ).length,
    [records]
  );

  const filtered = useMemo(() => {
    let rows = [...records];

    if (scope === "active") {
      rows = rows.filter((r) => !isEnquiryClosed(r.status));
    } else if (scope === "overdue") {
      rows = rows.filter(
        (r) => !isEnquiryClosed(r.status) && isEnquiryFollowUpOverdue(r.dateNextAction, r.status)
      );
    }

    if (stageFilter) {
      rows = rows.filter((r) => normalizeEnquiryStatus(r.status) === stageFilter);
    }

    if (tierFilter) {
      rows = rows.filter((r) => (r.qualificationTier || "Not qualified") === tierFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          r.documentNo.includes(q) ||
          r.fundingBody.toLowerCase().includes(q) ||
          r.disability.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [records, scope, stageFilter, tierFilter, search]);

  function clearFilters() {
    setSearch("");
    setStageFilter("");
    setTierFilter("");
    setScope("all");
  }

  const hasSearchOrFilter = search.trim() !== "" || stageFilter !== "" || tierFilter !== "";
  const isScopeOnlyEmpty = records.length > 0 && filtered.length === 0 && !hasSearchOrFilter && scope !== "all";

  const resultSummary = filtered.length === 1 ? "1 record" : `${filtered.length} records`;

  return (
    <RecordListSection>
      <RecordListDashboard>
        <RecordListStatCard
          label="Active enquiries"
          value={activeCount}
          hint="Not yet converted to a client"
          active={scope === "active"}
          onClick={() => setScope("active")}
        />
        <RecordListStatCard
          label="Overdue follow-ups"
          value={overdueCount}
          hint="Open enquiries past next action date"
          active={scope === "overdue"}
          onClick={() => setScope("overdue")}
        />
        <RecordListStatCard
          label="All enquiries"
          value={records.length}
          hint={`Includes ${convertedCount} converted ${convertedCount === 1 ? "record" : "records"}`}
          active={scope === "all"}
          onClick={() => setScope("all")}
        />
      </RecordListDashboard>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStageFilter("")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !stageFilter ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
          }`}
        >
          All stages
        </button>
        {ENQUIRY_PIPELINE_STATUSES.map((stage) => (
          <button
            key={stage}
            type="button"
            onClick={() => setStageFilter(stageFilter === stage ? "" : stage)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              stageFilter === stage ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
            }`}
          >
            {ENQUIRY_PIPELINE_LABELS[stage]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTierFilter("")}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            !tierFilter ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
          }`}
        >
          All tiers
        </button>
        {ENQUIRY_QUALIFICATION_TIERS.map((tier) => (
          <button
            key={tier}
            type="button"
            onClick={() => setTierFilter(tierFilter === tier ? "" : tier)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              tierFilter === tier ? "bg-[#fdf2f8] text-[#b51266]" : "bg-slate-100 text-slate-600"
            }`}
          >
            {tier}
          </button>
        ))}
      </div>

      <RecordListTableCard
        hint={
          scope === "active"
            ? "Showing open enquiries in the pipeline. Choose All enquiries to include converted and lost records."
            : scope === "overdue"
              ? "Showing open enquiries with a next action date in the past."
              : "Showing every enquiry, including converted and lost."
        }
        searchPlaceholder="Search name, document no., funding…"
        search={search}
        onSearchChange={setSearch}
        resultSummary={resultSummary}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Qualification</th>
                <th className="px-4 py-3 font-medium">Date next action</th>
                <th className="px-4 py-3 font-medium">First name</th>
                <th className="px-4 py-3 font-medium">Last name</th>
                <th className="px-4 py-3 font-medium">Funding body</th>
                <th className="px-4 py-3 font-medium">Disability</th>
                <th className="px-4 py-3 font-medium">Services</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length ? (
                filtered.map((record) => (
                  <tr key={record.id} className="group hover:bg-[#fdf2f8]/40">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <EnquiryQualificationBadge
                        tier={record.qualificationTier}
                        score={record.qualificationScore}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      <span
                        className={
                          isEnquiryFollowUpOverdue(record.dateNextAction, record.status)
                            ? "font-medium text-rose-700"
                            : undefined
                        }
                      >
                        {formatDisplayDate(record.dateNextAction)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <EnquiryRecordLink
                        id={record.id}
                        documentNo={record.documentNo}
                        name={`${record.firstName} ${record.lastName}`.trim()}
                        className="text-[#b51266] hover:underline"
                      >
                        {record.firstName || "—"}
                      </EnquiryRecordLink>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{record.lastName || "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-slate-600" title={record.fundingBody}>
                      {record.fundingBody || "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-600" title={record.disability}>
                      {record.disability || "—"}
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-slate-600" title={record.services}>
                      {record.services || "—"}
                    </td>
                  </tr>
                ))
              ) : records.length === 0 ? (
                <EmptyStateRow
                  colSpan={8}
                  variant="empty"
                  icon="inbox"
                  heading="No enquiries yet"
                  message="Capture your first intake to start the pipeline toward a client record."
                  action={canCreate ? { label: "Add enquiry", href: "/enquiries/new" } : undefined}
                />
              ) : isScopeOnlyEmpty ? (
                <EmptyStateRow
                  colSpan={8}
                  variant="empty"
                  icon="inbox"
                  heading={scope === "active" ? "No active enquiries" : "No overdue follow-ups"}
                  message={
                    scope === "active"
                      ? "All enquiries in this view are closed or converted. View all enquiries to see the full register."
                      : "There are no open enquiries past their next action date."
                  }
                  action={{ label: "View all enquiries", onClick: clearFilters }}
                />
              ) : (
                <EmptyStateRow
                  colSpan={8}
                  variant="no-results"
                  icon="search"
                  heading="No enquiries match your search"
                  message="Try a different search term or clear your filters."
                  action={{ label: "Clear filters", onClick: clearFilters }}
                />
              )}
            </tbody>
          </table>
        </div>
      </RecordListTableCard>
    </RecordListSection>
  );
}
