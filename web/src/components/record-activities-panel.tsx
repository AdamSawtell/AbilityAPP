"use client";

import { LineItemTable, type ActivityLineDeleteContext } from "@/components/line-item-table";
import { clientDropdowns } from "@/lib/client";
import { activityTableConfig, type ClientActivityRow } from "@/lib/client-line-tables";

export function RecordActivitiesPanel({
  rows,
  onChange,
  readOnly = false,
  activityDeleteContext,
}: {
  rows: ClientActivityRow[];
  onChange: (rows: ClientActivityRow[]) => void;
  readOnly?: boolean;
  activityDeleteContext?: ActivityLineDeleteContext;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Activities</h3>
        <p className="text-sm text-slate-500">
          Log calls, visits, emails, and notes. Click a row to open the full activity editor. Only administrators can
          remove activity lines — others can request deletion. Save the parent record to persist.
        </p>
      </div>
      <LineItemTable
        config={activityTableConfig}
        rows={rows}
        dropdowns={{ activityType: clientDropdowns.activityType }}
        onChange={onChange}
        readOnly={readOnly}
        activityDeleteContext={activityDeleteContext}
      />
    </div>
  );
}
