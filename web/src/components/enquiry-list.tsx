"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { EnquiryRecordLink } from "@/components/record-link";
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

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setScope("active")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
            scope === "active"
              ? "border-[#f9a8d4] bg-[#fdf2f8] ring-1 ring-[#f9a8d4]/50"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">Active enquiries</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{activeCount}</p>
          <p className="mt-1 text-xs text-slate-500">Not yet converted to a client</p>
        </button>
        <button
          type="button"
          onClick={() => setScope("all")}
          className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${
            scope === "all"
              ? "border-slate-300 bg-slate-50 ring-1 ring-slate-200"
              : "border-slate-200 bg-white hover:border-slate-300"
          }`}
        >
          <p className="text-sm font-medium text-slate-600">All enquiries</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{records.length}</p>
          <p className="mt-1 text-xs text-slate-500">
            Includes {convertedCount} converted {convertedCount === 1 ? "record" : "records"}
          </p>
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {scope === "active"
              ? "Showing active enquiries only. Use All enquiries to include converted records."
              : "Showing every enquiry, including converted."}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              className="w-full min-w-[220px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 sm:w-64"
              placeholder="Search name, funding, disability…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <p className="text-sm text-slate-500">{filtered.length} records</p>
          </div>
        </div>

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
      </div>
    </div>
  );
}
