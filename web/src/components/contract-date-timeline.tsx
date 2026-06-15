"use client";

import { contractStatus, formatContractDate, type ContractRecord } from "@/lib/contract";

function DateTile({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 ${
        highlight ? "border-[#f9a8d4] bg-[#fdf2f8]" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{formatContractDate(value)}</p>
    </div>
  );
}

const statusStyles = {
  active: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  review: "bg-amber-50 text-amber-900 ring-amber-200",
  expired: "bg-slate-100 text-slate-700 ring-slate-200",
  upcoming: "bg-sky-50 text-sky-900 ring-sky-200",
};

const statusLabel = {
  active: "Active",
  review: "Review due",
  expired: "Expired",
  upcoming: "Upcoming",
};

export function ContractDateTimeline({ contract }: { contract: ContractRecord }) {
  const status = contractStatus(contract);

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{contract.documentNo}</p>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{contract.name}</h2>
          <p className="mt-1 text-sm text-slate-600">{contract.businessPartnerName}</p>
        </div>
        <span
          className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
        >
          {statusLabel[status]}
        </span>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <DateTile label="Execution date" value={contract.executionDate} />
        <DateTile label="Start date" value={contract.startDate} highlight />
        <DateTile label="End date" value={contract.endDate} highlight />
        <DateTile label="Review date" value={contract.reviewDate} highlight={status === "review"} />
      </div>
    </div>
  );
}
