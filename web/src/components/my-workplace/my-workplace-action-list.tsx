"use client";

import Link from "next/link";
import type { MyActionItem, MyActionItemSeverity } from "@/lib/my-workplace/compliance-dashboard";

const severityStyles: Record<MyActionItemSeverity, string> = {
  overdue: "border-rose-200 bg-rose-50/80 text-rose-900",
  due_soon: "border-amber-200 bg-amber-50/80 text-amber-900",
  action: "border-slate-200 bg-white text-slate-900",
  review: "border-sky-200 bg-sky-50/80 text-sky-900",
};

const severityLabels: Record<MyActionItemSeverity, string> = {
  overdue: "Overdue",
  due_soon: "Due soon",
  action: "Action needed",
  review: "Awaiting review",
};

export function MyWorkplaceActionList({
  items,
  limit,
  emptyMessage = "You're up to date — nothing needs attention right now.",
}: {
  items: MyActionItem[];
  limit?: number;
  emptyMessage?: string;
}) {
  const visible = limit ? items.slice(0, limit) : items;

  if (!visible.length) {
    return <p className="text-sm text-slate-500">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {visible.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-3 transition hover:shadow-sm ${severityStyles[item.severity]}`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-0.5 text-xs opacity-80">{item.description}</p>
            </div>
            <span className="shrink-0 rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-black/5">
              {severityLabels[item.severity]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
