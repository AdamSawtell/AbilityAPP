"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  PAY_PERIOD_FREQUENCY_OPTIONS,
  PAY_PERIOD_START_DAY_LABELS,
  formatPayPeriodLabel,
  generatePayPeriodInstances,
  normalizePayPeriodDefinition,
  type PayPeriodDefinitionRecord,
  type PayPeriodInstanceRecord,
} from "@/lib/pay-period";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function PayPeriodSelector({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (instanceId: string) => void;
  className?: string;
}) {
  const { payPeriodInstances, payPeriodDefinitions } = useData();
  const definition = payPeriodDefinitions.find((row) => row.isActive) ?? payPeriodDefinitions[0];

  const options = useMemo(() => {
    if (!definition) return [];
    return payPeriodInstances
      .filter((row) => row.definitionId === definition.id)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }, [payPeriodInstances, definition]);

  if (!options.length) {
    return <span className="text-xs text-slate-500">No pay periods configured</span>;
  }

  return (
    <select
      value={value || options.find((row) => row.status === "open")?.id || options[0]?.id || ""}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-lg border border-slate-200 px-3 py-2 text-sm ${className}`}
    >
      {options.map((row) => (
        <option key={row.id} value={row.id}>
          {formatPayPeriodLabel(definition!, row.startDate, row.endDate)} ({row.status})
        </option>
      ))}
    </select>
  );
}

export function PayPeriodAdminPanel() {
  const { payPeriodDefinitions, payPeriodInstances, upsertPayPeriodDefinition, updatePayPeriodInstance } =
    useData();
  const { session } = useAuth();
  const actor = session?.displayName || "SuperUser";

  const active = payPeriodDefinitions.find((row) => row.isActive) ?? payPeriodDefinitions[0];
  const [draft, setDraft] = useState<PayPeriodDefinitionRecord | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const definition = draft ?? active ?? normalizePayPeriodDefinition({
    id: `ppd-${Date.now()}`,
    organizationId: "org-default",
    name: "Fortnightly pay period (Mon start)",
    frequency: "fortnightly",
    periodLengthDays: 14,
    startDay: 0,
    anchorDate: "2026-06-22",
    labelPattern: "PP {start}–{end}",
    editGraceDays: 3,
    isActive: true,
    createdBy: actor,
    updatedBy: actor,
  });

  const instances = useMemo(
    () =>
      payPeriodInstances
        .filter((row) => row.definitionId === definition.id)
        .sort((a, b) => b.startDate.localeCompare(a.startDate)),
    [payPeriodInstances, definition.id]
  );

  const previewInstances = useMemo(
    () => generatePayPeriodInstances(definition, { pastCount: 4, futureCount: 8 }),
    [definition]
  );

  function patchDefinition(update: Partial<PayPeriodDefinitionRecord>) {
    setDraft((current) => normalizePayPeriodDefinition({ ...(current ?? definition), ...update, updatedBy: actor }));
  }

  function handleSaveDefinition() {
    setError("");
    setMessage("");
    upsertPayPeriodDefinition(normalizePayPeriodDefinition({ ...definition, updatedBy: actor }));
    setDraft(null);
    setMessage("Pay period definition saved and periods regenerated.");
  }

  function handleCloseInstance(instance: PayPeriodInstanceRecord) {
    updatePayPeriodInstance({
      ...instance,
      status: "closed",
      closedAt: new Date().toISOString(),
      closedBy: actor,
      closeNotes: instance.closeNotes || "Closed from admin",
    });
    setMessage(`Pay period ${instance.periodNumber} closed for edits.`);
  }

  function handleReopenInstance(instance: PayPeriodInstanceRecord) {
    updatePayPeriodInstance({
      ...instance,
      status: "open",
      closedAt: "",
      closedBy: "",
    });
    setMessage(`Pay period ${instance.periodNumber} reopened.`);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-600">
        Define how pay periods are calculated for rostering, contracted hours, timesheets, and financial close. Fortnightly
        cycles starting on a Monday are common for SCHADS-aligned providers.
      </p>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Pay period definition</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Name</span>
            <input
              className={inputClass}
              value={definition.name}
              onChange={(e) => patchDefinition({ name: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Frequency</span>
            <select
              className={inputClass}
              value={definition.frequency}
              onChange={(e) => {
                const frequency = e.target.value as PayPeriodDefinitionRecord["frequency"];
                const days = PAY_PERIOD_FREQUENCY_OPTIONS.find((row) => row.value === frequency)?.days ?? 14;
                patchDefinition({ frequency, periodLengthDays: days });
              }}
            >
              {PAY_PERIOD_FREQUENCY_OPTIONS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Period starts on</span>
            <select
              className={inputClass}
              value={String(definition.startDay)}
              onChange={(e) => patchDefinition({ startDay: Number(e.target.value) })}
            >
              {PAY_PERIOD_START_DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Anchor start date</span>
            <input
              type="date"
              className={inputClass}
              value={definition.anchorDate}
              onChange={(e) => patchDefinition({ anchorDate: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Edit grace (days after period end)</span>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={definition.editGraceDays}
              onChange={(e) => patchDefinition({ editGraceDays: Number(e.target.value) })}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Label pattern</span>
            <input
              className={inputClass}
              value={definition.labelPattern}
              onChange={(e) => patchDefinition({ labelPattern: e.target.value })}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveDefinition}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Save and regenerate periods
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="mt-2 text-sm text-emerald-800">{message}</p> : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Generated periods (preview)</h2>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {previewInstances.slice(0, 6).map((row) => (
            <li key={row.id}>
              {formatPayPeriodLabel(definition, row.startDate, row.endDate)} — {row.startDate} to {row.endDate}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Period open / close</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Period</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {instances.slice(0, 12).map((row) => (
                <tr key={row.id} className="border-b border-slate-50">
                  <td className="py-2 pr-4 font-medium">{row.periodNumber}</td>
                  <td className="py-2 pr-4">
                    {row.startDate} → {row.endDate}
                  </td>
                  <td className="py-2 pr-4 capitalize">{row.status}</td>
                  <td className="py-2">
                    {row.status === "closed" ? (
                      <button
                        type="button"
                        className="text-[#b51266] hover:underline"
                        onClick={() => handleReopenInstance(row)}
                      >
                        Reopen
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="text-[#b51266] hover:underline"
                        onClick={() => handleCloseInstance(row)}
                      >
                        Close period
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
