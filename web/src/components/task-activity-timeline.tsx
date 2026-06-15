"use client";

import { taskUpdateActionLabels, type TaskUpdate } from "@/lib/task";

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function TaskActivityTimeline({ updates }: { updates: TaskUpdate[] }) {
  const sorted = [...updates].sort((a, b) => b.at.localeCompare(a.at));

  if (!sorted.length) {
    return (
      <p className="text-sm text-slate-500">No activity recorded yet.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {sorted.map((update, index) => (
        <li key={update.id} className="relative pl-6">
          {index < sorted.length - 1 ? (
            <span className="absolute left-[7px] top-6 bottom-[-16px] w-px bg-slate-200" aria-hidden />
          ) : null}
          <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#d4147a] ring-1 ring-[#f9a8d4]/60" />
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-900">{update.summary}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                {taskUpdateActionLabels[update.action]}
              </span>
            </div>
            {update.detail ? <p className="mt-2 text-sm text-slate-600">{update.detail}</p> : null}
            <p className="mt-2 text-xs text-slate-400">
              {update.byName} · {formatWhen(update.at)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
