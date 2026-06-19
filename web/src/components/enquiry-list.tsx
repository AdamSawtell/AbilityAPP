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
import { formatDisplayDate, type EnquiryRecord } from "@/lib/enquiry";
import { StatusBadge } from "./status-badge";

export type EnquiryListScope = "active" | "all";

function isConvertedEnquiry(record: EnquiryRecord) {
  return record.status.startsWith("4_");
}

export function EnquiryList({ records }: { records: EnquiryRecord[] }) {
  const searchParams = useSearchParams();
  const initialScope = searchParams.get("scope") === "all" ? "all" : "active";
  const [scope, setScope] = useState<EnquiryListScope>(initialScope);
  const [search, setSearch] = useState("");

  const activeCount = useMemo(() => records.filter((r) => !isConvertedEnquiry(r)).length, [records]);
  const convertedCount = useMemo(() => records.filter((r) => isConvertedEnquiry(r)).length, [records]);

  const filtered = useMemo(() => {
    let rows = [...records];

    if (scope === "active") {
      rows = rows.filter((r) => !isConvertedEnquiry(r));
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
  }, [records, scope, search]);

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
          label="All enquiries"
          value={records.length}
          hint={`Includes ${convertedCount} converted ${convertedCount === 1 ? "record" : "records"}`}
          active={scope === "all"}
          onClick={() => setScope("all")}
        />
      </RecordListDashboard>

      <RecordListTableCard
        hint={
          scope === "active"
            ? "Showing active enquiries only. Choose All enquiries to include converted records."
            : "Showing every enquiry, including converted."
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
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      {formatDisplayDate(record.dateNextAction)}
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
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    {scope === "active" ? "No active enquiries match your search." : "No enquiries match your search."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </RecordListTableCard>
    </RecordListSection>
  );
}
