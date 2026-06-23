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
import { useAuth } from "@/lib/auth-store";
import type { ClientRecord } from "@/lib/client";
import {
  daysUntilIsoDate,
  formatRecordMoneyCompact,
  parseRecordMoney,
} from "@/lib/record-list-metrics";
import {
  formatServiceBookingDate,
  serviceBookingDropdowns,
  type ServiceBookingRecord,
} from "@/lib/service-booking";

type ServiceBookingListScope = "all" | "inProgress" | "completed" | "dueSoon";

const statusTone: Record<string, string> = {
  Drafted: "bg-slate-100 text-slate-700",
  "In progress": "bg-amber-100 text-amber-900",
  Completed: "bg-emerald-100 text-emerald-800",
  Cancelled: "bg-red-100 text-red-800",
};

function isInProgressBooking(record: ServiceBookingRecord) {
  return record.documentStatus === "In progress";
}

function isDueSoonBooking(record: ServiceBookingRecord) {
  if (record.documentStatus === "Completed" || record.documentStatus === "Cancelled") return false;
  const promisedDays = daysUntilIsoDate(record.datePromised);
  const endDays = daysUntilIsoDate(record.endDate);
  if (promisedDays !== null && promisedDays >= -7 && promisedDays <= 7) return true;
  if (endDays !== null && endDays >= -7 && endDays <= 7) return true;
  return false;
}

export function ServiceBookingList({
  records,
  clients,
}: {
  records: ServiceBookingRecord[];
  clients: ClientRecord[];
}) {
  const { canWriteWindow } = useAuth();
  const canCreateBooking = canWriteWindow("service-bookings");
  const [scope, setScope] = useState<ServiceBookingListScope>("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const inProgressCount = useMemo(() => records.filter(isInProgressBooking).length, [records]);
  const completedCount = useMemo(
    () => records.filter((r) => r.documentStatus === "Completed").length,
    [records]
  );
  const dueSoonCount = useMemo(() => records.filter(isDueSoonBooking).length, [records]);
  const openValue = useMemo(
    () =>
      records
        .filter(isInProgressBooking)
        .reduce((sum, record) => sum + parseRecordMoney(record.grandTotal), 0),
    [records]
  );

  const filtered = useMemo(() => {
    let rows = [...records].sort((a, b) => (b.datePromised || "").localeCompare(a.datePromised || ""));

    if (scope === "inProgress") {
      rows = rows.filter(isInProgressBooking);
    } else if (scope === "completed") {
      rows = rows.filter((r) => r.documentStatus === "Completed");
    } else if (scope === "dueSoon") {
      rows = rows.filter(isDueSoonBooking);
    }

    if (statusFilter !== "All") {
      rows = rows.filter((r) => r.documentStatus === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => {
        const client = clients.find((c) => c.id === r.clientId);
        return (
          r.documentNo.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.documentStatus.toLowerCase().includes(q) ||
          r.bookingGeneratorRef.toLowerCase().includes(q) ||
          (client?.name.toLowerCase().includes(q) ?? false) ||
          (client?.searchKey.toLowerCase().includes(q) ?? false)
        );
      });
    }

    return rows;
  }, [records, clients, scope, search, statusFilter]);

  const resultSummary =
    filtered.length === 1 ? "1 service booking" : `${filtered.length} service bookings`;

  return (
    <RecordListSection>
      {canCreateBooking ? (
        <div className="flex justify-end">
          <Link
            href="/service-bookings/new"
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            New service booking
          </Link>
        </div>
      ) : null}

      <RecordListDashboard className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <RecordListStatCard
          label="All bookings"
          value={records.length}
          hint="Scheduled and delivered services"
          active={scope === "all"}
          onClick={() => setScope("all")}
        />
        <RecordListStatCard
          label="In progress"
          value={inProgressCount}
          hint={`${formatRecordMoneyCompact(openValue)} open value`}
          active={scope === "inProgress"}
          onClick={() => setScope("inProgress")}
        />
        <RecordListStatCard
          label="Completed"
          value={completedCount}
          hint="Ready for claiming review"
          active={scope === "completed"}
          onClick={() => setScope("completed")}
        />
        <RecordListStatCard
          label="Due soon"
          value={dueSoonCount}
          hint="Promised or ending within 7 days"
          active={scope === "dueSoon"}
          onClick={() => setScope("dueSoon")}
        />
      </RecordListDashboard>

      <RecordListTableCard
        hint="Service bookings link clients, agreements, and claim lines. Use the dashboard to focus open or due work."
        searchPlaceholder="Search bookings…"
        search={search}
        onSearchChange={setSearch}
        resultSummary={resultSummary}
        filters={
          <select
            className={recordListSelectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by document status"
          >
            <option value="All">All statuses</option>
            {serviceBookingDropdowns.documentStatus.map((s) => (
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
                <th className="px-4 py-3 font-medium">Document no.</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Date promised</th>
                <th className="px-4 py-3 font-medium">Period</th>
                <th className="px-4 py-3 font-medium">Lines</th>
                <th className="px-4 py-3 font-medium">Grand total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No service bookings match your search or filters.
                  </td>
                </tr>
              ) : (
                filtered.map((booking) => {
                  const client = clients.find((c) => c.id === booking.clientId);
                  return (
                    <tr key={booking.id} className="group hover:bg-[#fdf2f8]/40">
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/service-bookings/${booking.id}`} className="text-[#b51266] hover:underline">
                          {booking.documentNo}
                        </Link>
                        {booking.bookingGeneratorRef ? (
                          <p className="text-xs font-normal text-slate-500">{booking.bookingGeneratorRef}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-900">{booking.description || "—"}</td>
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
                        {formatServiceBookingDate(booking.datePromised)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatServiceBookingDate(booking.startDate)} – {formatServiceBookingDate(booking.endDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{booking.lines.length}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-800">${booking.grandTotal}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone[booking.documentStatus] ?? "bg-slate-100 text-slate-700"}`}
                        >
                          {booking.documentStatus}
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
