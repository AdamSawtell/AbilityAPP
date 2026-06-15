"use client";

import { LineItemTable } from "@/components/line-item-table";
import { clientDropdowns } from "@/lib/client";
import { activityTableConfig, type ClientActivityRow } from "@/lib/client-line-tables";

export function RecordActivitiesPanel({
  rows,
  onChange,
}: {
  rows: ClientActivityRow[];
  onChange: (rows: ClientActivityRow[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Activities</h3>
        <p className="text-sm text-slate-500">Log calls, visits, emails, and notes. These carry over when the enquiry is converted to a client.</p>
      </div>
      <LineItemTable
        config={activityTableConfig}
        rows={rows}
        dropdowns={{ activityType: clientDropdowns.activityType }}
        onChange={onChange}
      />
    </div>
  );
}
