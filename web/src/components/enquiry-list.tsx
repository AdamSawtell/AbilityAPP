"use client";

import { useMemo, useState } from "react";
import { EnquiryRecordLink } from "@/components/record-link";
import {
  formatDisplayDate,
  queryNames,
  type EnquiryRecord,
} from "@/lib/enquiry";
import { StatusBadge } from "./status-badge";

export function EnquiryList({ records }: { records: EnquiryRecord[] }) {
  const [queryName, setQueryName] = useState(queryNames[0]);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    let rows = [...records];

    if (queryName === "Closed Enquiries") {
      rows = rows.filter((r) => r.status.startsWith("4_") || r.status.startsWith("5_"));
    } else {
      rows = rows.filter((r) => !r.status.startsWith("5_"));
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
  }, [records, queryName, search]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500 sm:order-last">
          Open multiple records from the workspace bar above.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-slate-600">
            <span className="mr-2 font-medium">Query name</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20"
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
            >
              {queryNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <input
            className="w-full min-w-[220px] rounded-lg border border-slate-200 px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 sm:w-64"
            placeholder="Search name, funding, disability…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <p className="text-sm text-slate-500">{filtered.length} records</p>
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
            {filtered.map((record) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
