"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClientRecordLink } from "@/components/record-link";
import {
  RecordListDashboard,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
  recordListSelectClass,
} from "@/components/record-list-shell";
import { EmptyStateRow } from "@/components/ui/empty-state";
import { useAuth } from "@/lib/auth-store";
import { formatContractDate } from "@/lib/contract";
import {
  formatRecordMoneyCompact,
  isWithinDays,
  parseRecordMoney,
} from "@/lib/record-list-metrics";
import { lifecycleStatusTone } from "@/lib/service-agreement-lifecycle";
import { serviceAgreementDropdowns, type ServiceAgreementRecord } from "@/lib/service-agreement";
import type { ClientRecord } from "@/lib/client";

type ServiceAgreementListScope = "all" | "active" | "attention";

const TERMINAL_STATUSES = new Set(["Expired", "Terminated", "Cancelled"]);

function isActiveAgreement(record: ServiceAgreementRecord) {
  return ["Active", "Expiring", "Signed"].includes(record.status);
}

function needsAgreementUpdateWithin30Days(record: ServiceAgreementRecord) {
  if (TERMINAL_STATUSES.has(record.status)) return false;
  if (record.status === "Expiring") return true;
  if (isWithinDays(record.finishDate, 30)) return true;
  if (isWithinDays(record.reviewDate, 30)) return true;
  return false;
}

export function ServiceAgreementList({
  records,
  clients,
}: {
  records: ServiceAgreementRecord[];
  clients: ClientRecord[];
}) {
  const { canWriteWindow } = useAuth();
  const canCreateAgreement = canWriteWindow("service-agreements");
  const [scope, setScope] = useState<ServiceAgreementListScope>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const activeCount = useMemo(() => records.filter(isActiveAgreement).length, [records]);
  const attentionCount = useMemo(
    () => records.filter(needsAgreementUpdateWithin30Days).length,
    [records]
  );
  const activeValue = useMemo(
    () =>
      records
        .filter(isActiveAgreement)
        .reduce((sum, record) => sum + parseRecordMoney(record.totalPlannedAmount), 0),
    [records]
  );

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.searchKey.localeCompare(b.searchKey, "en-AU"));

    if (scope === "active") {
      rows = rows.filter(isActiveAgreement);
    } else if (scope === "attention") {
      rows = rows.filter(needsAgreementUpdateWithin30Days);
    }

    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => {
        const client = clients.find((c) => c.id === r.clientId);
        return (
          r.searchKey.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          (client?.name.toLowerCase().includes(q) ?? false) ||
          (client?.searchKey.toLowerCase().includes(q) ?? false)
        );
      });
    }

    return rows;
  }, [records, clients, scope, search, statusFilter]);

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    setScope("all");
  }

  const resultSummary =
    filtered.length === 1 ? "1 service agreement" : `${filtered.length} service agreements`;

  function onScopeChange(next: ServiceAgreementListScope) {
    setScope(next);
  }

  return (
    <RecordListSection>
      <RecordListDashboard className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RecordListStatCard
          label="All agreements"
          value={records.length}
          hint="Linked to clients"
          active={scope === "all"}
          onClick={() => onScopeChange("all")}
        />
        <RecordListStatCard
          label="Active"
          value={activeCount}
          hint="Signed, active, or expiring"
          active={scope === "active"}
          onClick={() => onScopeChange("active")}
        />
        <RecordListStatCard
          label="Active value"
          value={formatRecordMoneyCompact(activeValue)}
          hint="Total planned amount"
          active={scope === "active"}
          onClick={() => onScopeChange("active")}
        />
        <RecordListStatCard
          label="Due in 30 days"
          value={attentionCount}
          hint="Review, finish, or expiring"
          active={scope === "attention"}
          onClick={() => onScopeChange("attention")}
        />
      </RecordListDashboard>

      <RecordListTableCard
        hint="Click an agreement to open the full record. Use the dashboard cards to focus on active or upcoming renewals."
        searchPlaceholder="Search agreements…"
        search={search}
        onSearchChange={setSearch}
        resultSummary={resultSummary}
        filters={
          <select
            className={recordListSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="All">All statuses</option>
            {serviceAgreementDropdowns.status.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Search key</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Contract date</th>
                <th className="px-4 py-3 font-medium">Finish</th>
                <th className="px-4 py-3 font-medium">Planned amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                records.length === 0 ? (
                  <EmptyStateRow
                    colSpan={7}
                    variant="empty"
                    icon="handshake"
                    heading="No service agreements yet"
                    message="Create an agreement to link NDIS supports and pricing to a client."
                    action={canCreateAgreement ? { label: "Add agreement", href: "/service-agreements/new" } : undefined}
                  />
                ) : (
                  <EmptyStateRow
                    colSpan={7}
                    variant="no-results"
                    icon="search"
                    heading="No agreements match your search"
                    message="Try a different search term or clear your filters."
                    action={{ label: "Clear filters", onClick: clearFilters }}
                  />
                )
              ) : (
                filtered.map((sa) => {
                  const client = clients.find((c) => c.id === sa.clientId);
                  return (
                    <tr key={sa.id} className="group hover:bg-[#fdf2f8]/40">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/service-agreements/${sa.id}`} className="text-[#b51266] hover:underline">
                          {sa.searchKey}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-900">{sa.name}</td>
                      <td className="px-4 py-3">
                        {client ? (
                          <ClientRecordLink
                            id={client.id}
                            searchKey={client.searchKey}
                            name={client.name}
                            className="text-slate-700 hover:underline"
                          />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatContractDate(sa.contractDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatContractDate(sa.finishDate)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-800">${sa.totalPlannedAmount}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${lifecycleStatusTone(sa.status)}`}
                        >
                          {sa.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </RecordListTableCard>
    </RecordListSection>
  );
}
