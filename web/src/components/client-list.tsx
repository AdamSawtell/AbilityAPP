"use client";

import { useMemo, useState } from "react";
import { ClientRecordLink, EnquiryRecordLink } from "@/components/record-link";
import {
  RecordListDashboard,
  RecordListPagination,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
  recordListSelectClass,
} from "@/components/record-list-shell";
import { clientDropdowns, type ClientRecord } from "@/lib/client";

const PAGE_SIZE = 50;

type ClientListScope = "all" | "active" | "alerts";

function ClientStatusBadge({ status }: { status: string }) {
  const label = status.replace(/^\d+_/, "").replace(/_/g, " ");
  return (
    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 ring-inset">
      {label}
    </span>
  );
}

function isActiveClient(client: ClientRecord) {
  return client.status.includes("Active");
}

function hasActiveAlert(client: ClientRecord) {
  return client.alerts.some((a) => a.showAsAlert === "Yes");
}

export function ClientList({ records }: { records: ClientRecord[] }) {
  const [scope, setScope] = useState<ClientListScope>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(0);

  const activeCount = useMemo(() => records.filter(isActiveClient).length, [records]);
  const alertCount = useMemo(() => records.filter(hasActiveAlert).length, [records]);

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));

    if (scope === "active") {
      rows = rows.filter(isActiveClient);
    } else if (scope === "alerts") {
      rows = rows.filter(hasActiveAlert);
    }

    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.searchKey.toLowerCase().includes(q) ||
          r.fundingBody.toLowerCase().includes(q) ||
          r.disability.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.phone.includes(q)
      );
    }

    return rows;
  }, [records, scope, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  function onScopeChange(next: ClientListScope) {
    setScope(next);
    setPage(0);
  }

  function onSearchChange(value: string) {
    setSearch(value);
    setPage(0);
  }

  function onStatusChange(value: string) {
    setStatusFilter(value);
    setPage(0);
  }

  const resultSummary =
    filtered.length === 1
      ? "1 client"
      : `${filtered.length} clients` +
        (filtered.length > PAGE_SIZE ? ` · page ${safePage + 1} of ${pageCount}` : "");

  return (
    <RecordListSection>
      <RecordListDashboard>
        <RecordListStatCard
          label="All clients"
          value={records.length}
          hint="People receiving support"
          active={scope === "all"}
          onClick={() => onScopeChange("all")}
        />
        <RecordListStatCard
          label="Active"
          value={activeCount}
          hint="Currently receiving support"
          active={scope === "active"}
          onClick={() => onScopeChange("active")}
        />
        <RecordListStatCard
          label="Active alerts"
          value={alertCount}
          hint="Clients with header alerts"
          active={scope === "alerts"}
          onClick={() => onScopeChange("alerts")}
        />
      </RecordListDashboard>

      <RecordListTableCard
        hint="Click a client to open them in the workspace. You can keep several open at once."
        searchPlaceholder="Search clients…"
        search={search}
        onSearchChange={onSearchChange}
        resultSummary={resultSummary}
        filters={
          <select
            className={recordListSelectClass}
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="All">All statuses</option>
            {clientDropdowns.status.map((s) => (
              <option key={s} value={s}>
                {s.replace(/^\d+_/, "").replace(/_/g, " ")}
              </option>
            ))}
          </select>
        }
        footer={
          <RecordListPagination
            page={safePage}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPrevious={() => setPage((p) => Math.max(0, p - 1))}
            onNext={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Search key</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Funding body</th>
                <th className="px-4 py-3 font-medium">Disability</th>
                <th className="px-4 py-3 font-medium">Enquiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No clients match your search or filters.
                  </td>
                </tr>
              ) : (
                pageRows.map((client) => (
                  <tr key={client.id} className="group hover:bg-[#fdf2f8]/40">
                    <td className="px-4 py-3 font-medium">
                      <ClientRecordLink
                        id={client.id}
                        searchKey={client.searchKey}
                        name={client.name}
                        className="text-[#b51266] hover:underline"
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-900">{client.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ClientStatusBadge status={client.status} />
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-slate-600" title={client.fundingBody}>
                      {client.fundingBody || "—"}
                    </td>
                    <td className="max-w-[180px] truncate px-4 py-3 text-slate-600" title={client.disability}>
                      {client.disability || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {client.enquiryId ? (
                        <EnquiryRecordLink
                          id={client.enquiryId}
                          documentNo={client.enquiryId}
                          className="text-slate-600 hover:underline"
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </RecordListTableCard>
    </RecordListSection>
  );
}
