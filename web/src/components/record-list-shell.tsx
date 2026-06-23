"use client";

import type { ReactNode } from "react";

const searchInputClass =
  "w-full min-w-[220px] rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20 sm:w-72";

export const recordListSelectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-[#d4147a]";

export function RecordListSection({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

export function RecordListDashboard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3"}>{children}</div>
  );
}

export function RecordListStatCard({
  label,
  value,
  hint,
  active = false,
  onClick,
}: {
  label: string;
  value: number | string;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const styles = active
    ? "border-[#f9a8d4] bg-[#fdf2f8] ring-1 ring-[#f9a8d4]/50"
    : "border-slate-200 bg-white hover:border-slate-300";

  const content = (
    <>
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`rounded-xl border p-4 text-left transition hover:shadow-sm ${styles}`}
      >
        {content}
      </button>
    );
  }

  return <div className={`rounded-xl border p-4 ${styles}`}>{content}</div>;
}

export function RecordListTableCard({
  hint,
  searchPlaceholder,
  search,
  onSearchChange,
  filters,
  resultSummary,
  children,
  footer,
}: {
  hint?: string;
  searchPlaceholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  filters?: ReactNode;
  resultSummary: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        {hint ? (
          <p className="text-xs text-slate-500 lg:order-last lg:max-w-sm lg:text-right">{hint}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <input
            className={searchInputClass}
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {filters}
        </div>
        <p className="shrink-0 text-sm text-slate-500">{resultSummary}</p>
      </div>
      {children}
      {footer}
    </div>
  );
}

export function RecordListPagination({
  page,
  pageCount,
  total,
  pageSize,
  onPrevious,
  onNext,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (total <= pageSize) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
      <button
        type="button"
        disabled={page === 0}
        onClick={onPrevious}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50"
      >
        Previous
      </button>
      <span className="text-xs text-slate-500">
        Showing {start}–{end} of {total} · page {page + 1} of {pageCount}
      </span>
      <button
        type="button"
        disabled={page >= pageCount - 1}
        onClick={onNext}
        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 disabled:opacity-40 hover:bg-slate-50"
      >
        Next
      </button>
    </div>
  );
}
