"use client";

import { useState } from "react";
import type { ClientRecord } from "@/lib/client";
import {
  animalShiftAlerts,
  animalSummaryForShift,
  animalsAtSupportLocation,
} from "@/lib/client-animal";

export function MobileShiftAnimalSummary({
  client,
  shiftLocationId,
}: {
  client: ClientRecord;
  shiftLocationId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const summary = animalSummaryForShift(client.animals ?? [], client.animalAllergyAlert ?? "", shiftLocationId);
  const alerts = animalShiftAlerts(client.animals ?? [], client.animalAllergyAlert ?? "", shiftLocationId);
  if (!summary) return null;

  const active = animalsAtSupportLocation(client.animals ?? [], shiftLocationId);

  return (
    <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/60 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-900/70">Animals & pets</p>
          <p className="mt-1 text-sm font-medium text-amber-950">{summary}</p>
          {alerts.length ? (
            <ul className="mt-2 space-y-1">
              {alerts.map((alert) => (
                <li
                  key={alert}
                  className="rounded-lg border border-amber-300/60 bg-white/80 px-2.5 py-1.5 text-xs font-medium text-amber-950"
                >
                  {alert}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {active.length ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="shrink-0 text-xs font-semibold text-[#b51266]"
          >
            {expanded ? "Hide" : "Details"}
          </button>
        ) : null}
      </div>
      {expanded ? (
        <ul className="mt-3 space-y-2 border-t border-amber-200/60 pt-3 text-sm text-amber-950">
          {active.map((animal) => (
            <li key={animal.id}>
              <span className="font-semibold">{animal.name || animal.animalType}</span>
              {" · "}
              {animal.role}
              {animal.careResponsibility ? ` · ${animal.careResponsibility}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
