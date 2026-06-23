"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  RecordListDashboard,
  RecordListSection,
  RecordListStatCard,
  RecordListTableCard,
  recordListSelectClass,
} from "@/components/record-list-shell";
import { useAuth } from "@/lib/auth-store";
import { businessPartnerStatusOptions, businessPartnerTypeOptions, type BusinessPartnerRecord } from "@/lib/business-partner";

type BusinessPartnerListScope = "all" | "active" | "planManagers" | "inactive";

function isActivePartner(record: BusinessPartnerRecord) {
  return record.status === "Active";
}

export function BusinessPartnerList({ records }: { records: BusinessPartnerRecord[] }) {
  const { canWriteWindow } = useAuth();
  const canCreate = canWriteWindow("business-partners");
  const [scope, setScope] = useState<BusinessPartnerListScope>("all");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const activeCount = useMemo(() => records.filter(isActivePartner).length, [records]);
  const planManagerCount = useMemo(
    () => records.filter((r) => r.partnerType === "Plan manager").length,
    [records]
  );
  const inactiveCount = useMemo(() => records.filter((r) => r.status === "Inactive").length, [records]);

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => a.name.localeCompare(b.name, "en-AU"));

    if (scope === "active") {
      rows = rows.filter(isActivePartner);
    } else if (scope === "planManagers") {
      rows = rows.filter((r) => r.partnerType === "Plan manager");
    } else if (scope === "inactive") {
      rows = rows.filter((r) => r.status === "Inactive");
    }

    if (typeFilter !== "All") {
      rows = rows.filter((r) => r.partnerType === typeFilter);
    }
    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.searchKey.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.partnerType.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q) ||
          r.abn.includes(q)
      );
    }

    return rows;
  }, [records, scope, search, typeFilter, statusFilter]);

  const resultSummary =
    filtered.length === 1 ? "1 business partner" : `${filtered.length} business partners`;

  return (
    <RecordListSection>
      {canCreate ? (
        <div className="flex justify-end">
          <Link
            href="/business-partners/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            New business partner
          </Link>
        </div>
      ) : null}

      <RecordListDashboard className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RecordListStatCard
          label="All partners"
          value={records.length}
          hint="Plan managers, vendors, referrers"
          active={scope === "all"}
          onClick={() => setScope("all")}
        />
        <RecordListStatCard
          label="Active"
          value={activeCount}
          hint="Available for billing and links"
          active={scope === "active"}
          onClick={() => setScope("active")}
        />
        <RecordListStatCard
          label="Plan managers"
          value={planManagerCount}
          hint="Invoice and plan-managed partners"
          active={scope === "planManagers"}
          onClick={() => setScope("planManagers")}
        />
        <RecordListStatCard
          label="Inactive"
          value={inactiveCount}
          hint="Archived or not in use"
          active={scope === "inactive"}
          onClick={() => setScope("inactive")}
        />
      </RecordListDashboard>

      <RecordListTableCard
        hint="Business partners used for plan management, invoicing, and client associations."
        searchPlaceholder="Search partners…"
        search={search}
        onSearchChange={setSearch}
        resultSummary={resultSummary}
        filters={
          <>
            <select
              className={recordListSelectClass}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by partner type"
            >
              <option value="All">All types</option>
              {businessPartnerTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              className={recordListSelectClass}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="All">All statuses</option>
              {businessPartnerStatusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Search key</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Payment terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No business partners match your search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="group hover:bg-[#fdf2f8]/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/business-partners/${p.id}`} className="text-[#b51266] hover:underline">
                        {p.searchKey}
                      </Link>
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-3 text-slate-900">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.partnerType || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.status || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.email || "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.paymentTerms || "—"}</td>
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
