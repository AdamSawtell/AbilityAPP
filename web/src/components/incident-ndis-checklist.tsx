"use client";

import Link from "next/link";
import { ndisChecklistProgress, type NdisChecklistItem } from "@/lib/incident-ndis";
import type { IncidentRecord } from "@/lib/incident";

function ChecklistRow({ item }: { item: NdisChecklistItem }) {
  return (
    <li className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          item.done ? "bg-emerald-100 text-emerald-800" : item.required ? "bg-amber-100 text-amber-900" : "bg-slate-200 text-slate-600"
        }`}
        aria-hidden
      >
        {item.done ? "✓" : "·"}
      </span>
      <div className="min-w-0">
        <p className={`text-sm font-medium ${item.done ? "text-slate-700" : "text-slate-900"}`}>
          {item.label}
          {!item.required ? <span className="ml-1 text-xs font-normal text-slate-500">(if applicable)</span> : null}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">{item.detail}</p>
      </div>
    </li>
  );
}

export function IncidentNdisChecklist({
  incident,
  showHeading = true,
}: {
  incident: IncidentRecord;
  showHeading?: boolean;
}) {
  if (!incident.isReportable) {
    return (
      <p className="text-sm text-slate-500">
        This incident is not marked NDIS reportable. Enable the reportable flag on Overview if Commission notification is required.
      </p>
    );
  }

  const { items, doneRequired, totalRequired, complete } = ndisChecklistProgress(incident);

  return (
    <div className="space-y-4">
      {showHeading ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">NDIS submission checklist</h3>
            <p className="text-xs text-slate-600">
              Evidence-based steps for audit and Commission reporting. Portal submission is outside AbilityVua.
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
              complete
                ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                : "bg-amber-50 text-amber-900 ring-amber-200"
            }`}
          >
            {doneRequired}/{totalRequired} required
          </span>
        </div>
      ) : null}
      <ul className="space-y-2">
        {items.map((item) => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Log notifications on the Notifications tab. Export the register from{" "}
        <Link href="/incidents/compliance" className="font-medium text-[#b51266] hover:underline">
          NDIS compliance
        </Link>{" "}
        or Reports.
      </p>
    </div>
  );
}
