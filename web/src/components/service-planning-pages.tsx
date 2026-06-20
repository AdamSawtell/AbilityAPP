"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { LineItemTable } from "@/components/line-item-table";
import { ClientRecordLink } from "@/components/record-link";
import { auditMetaFrom } from "@/lib/audit";
import { useAuth } from "@/lib/auth-store";
import { useReferenceData } from "@/lib/config-store";
import { useData } from "@/lib/data-store";
import { formatPlanBudgetCurrency } from "@/lib/client-plan-budget";
import { monthlyServicePlanLineTableConfig } from "@/lib/monthly-service-plan-line-tables";
import {
  createMonthlyServicePlan,
  currentPlanMonthIso,
  formatPlanMonthLabel,
  generateMonthlyPlanFromBudget,
  monthlyServicePlanDropdowns,
  normalizeMonthlyServicePlan,
  summarizeMonthlyServicePlan,
  type MonthlyServicePlanRecord,
} from "@/lib/monthly-service-plan";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export function MonthlyServicePlanEditor({
  plan,
  readOnly = false,
  onSaved,
}: {
  plan: MonthlyServicePlanRecord;
  readOnly?: boolean;
  onSaved?: () => void;
}) {
  const { clients, upsertMonthlyServicePlan } = useData();
  const { session } = useAuth();
  const { getOptions } = useReferenceData();
  const actor = session?.displayName || "SuperUser";

  const client = clients.find((c) => c.id === plan.clientId);
  const [draft, setDraft] = useState(() => normalizeMonthlyServicePlan(plan));
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setDraft(normalizeMonthlyServicePlan(plan));
    setMessage("");
    setError("");
  }, [plan.id, plan.planMonth, plan.status, plan.notes, plan.lines, plan.updatedBy]);

  const totals = useMemo(() => summarizeMonthlyServicePlan(draft.lines), [draft.lines]);
  const budgetTotals = useMemo(
    () =>
      client?.planBudgets?.reduce(
        (acc, row) => {
          acc.allocated += Number(row.allocatedAmount) || 0;
          acc.claimed += Number(row.claimedAmount) || 0;
          return acc;
        },
        { allocated: 0, claimed: 0 }
      ) ?? { allocated: 0, claimed: 0 },
    [client]
  );

  function onChange<K extends keyof MonthlyServicePlanRecord>(key: K, value: MonthlyServicePlanRecord[K]) {
    setDraft((prev) => normalizeMonthlyServicePlan({ ...prev, [key]: value, updatedBy: actor }));
  }

  function save() {
    setError("");
    setMessage("");
    if (!draft.clientId || !draft.planMonth) {
      setError("Client and plan month are required.");
      return;
    }
    try {
      const err = upsertMonthlyServicePlan(draft);
      if (err) {
        setError(err);
        return;
      }
      setMessage("Monthly service plan saved.");
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save plan.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned hours</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{totals.plannedHours.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Planned spend</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatPlanBudgetCurrency(totals.plannedAmount)}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Plan budget allocated</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{formatPlanBudgetCurrency(budgetTotals.allocated)}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Budget remaining</p>
          <p className="mt-1 text-lg font-semibold text-emerald-900">
            {formatPlanBudgetCurrency(Math.max(0, budgetTotals.allocated - budgetTotals.claimed))}
          </p>
        </div>
      </div>

      <fieldset disabled={readOnly} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Plan month</span>
          <input
            className={inputClass}
            type="month"
            value={draft.planMonth}
            onChange={(e) => onChange("planMonth", e.target.value)}
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Status</span>
          <select className={inputClass} value={draft.status} onChange={(e) => onChange("status", e.target.value)}>
            {monthlyServicePlanDropdowns.status.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-2">
          <span className="mb-1.5 block text-xs font-medium text-slate-600">Notes</span>
          <textarea
            className={inputClass}
            rows={2}
            value={draft.notes}
            onChange={(e) => onChange("notes", e.target.value)}
          />
        </label>
      </fieldset>

      <LineItemTable
        config={monthlyServicePlanLineTableConfig}
        rows={draft.lines}
        dropdowns={{
          ndisSupportBudget: getOptions("ndisSupportBudget"),
          ndisSupportCategory: getOptions("ndisSupportCategory"),
        }}
        readOnly={readOnly}
        onChange={(rows) => onChange("lines", rows)}
      />

      {error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">{message}</p>
      ) : null}

      {!readOnly ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266]"
          >
            Save plan
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function ServicePlanningListView() {
  const { clients, monthlyServicePlans, upsertMonthlyServicePlan } = useData();
  const { session, canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("service-planning");
  const actor = session?.displayName || "SuperUser";

  const [newClientId, setNewClientId] = useState("");
  const [newPlanMonth, setNewPlanMonth] = useState(currentPlanMonthIso());
  const [error, setError] = useState("");

  const rows = useMemo(
    () =>
      [...monthlyServicePlans]
        .map(normalizeMonthlyServicePlan)
        .sort((a, b) => b.planMonth.localeCompare(a.planMonth) || a.clientId.localeCompare(b.clientId)),
    [monthlyServicePlans]
  );

  function createPlan(fromBudget: boolean) {
    setError("");
    const client = clients.find((c) => c.id === newClientId);
    if (!client) {
      setError("Select a client.");
      return;
    }
    try {
      const record = fromBudget
        ? generateMonthlyPlanFromBudget(client, newPlanMonth, monthlyServicePlans, actor)
        : createMonthlyServicePlan({ clientId: client.id, planMonth: newPlanMonth }, monthlyServicePlans, actor);
      const err = upsertMonthlyServicePlan(record);
      if (err) {
        setError(err);
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create plan.");
    }
  }

  return (
    <AppShell
      title="Service planning"
      subtitle="Monthly service plans — planned hours and spend from NDIS plan budget."
      audit={{ moduleLabel: "Service planning" }}
    >
      {canEdit ? (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">New monthly plan</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Client</span>
              <select
                className={inputClass}
                value={newClientId}
                onChange={(e) => setNewClientId(e.target.value)}
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.searchKey} — {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Plan month</span>
              <input
                className={inputClass}
                type="month"
                value={newPlanMonth}
                onChange={(e) => setNewPlanMonth(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button
                type="button"
                onClick={() => createPlan(true)}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
              >
                From plan budget
              </button>
              <button
                type="button"
                onClick={() => createPlan(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Empty plan
              </button>
            </div>
          </div>
          {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        </section>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Month</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Planned hours</th>
              <th className="px-4 py-3 font-medium">Planned spend</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((plan) => {
                const client = clients.find((c) => c.id === plan.clientId);
                const totals = summarizeMonthlyServicePlan(plan.lines);
                return (
                  <tr key={plan.id}>
                    <td className="px-4 py-3">
                      {client ? (
                        <ClientRecordLink
                          id={client.id}
                          searchKey={client.searchKey}
                          name={client.name}
                          className="font-medium text-[#b51266] hover:underline"
                        />
                      ) : (
                        plan.clientId
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatPlanMonthLabel(plan.planMonth)}</td>
                    <td className="px-4 py-3 text-slate-700">{plan.status}</td>
                    <td className="px-4 py-3 text-slate-700">{totals.plannedHours.toFixed(1)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatPlanBudgetCurrency(totals.plannedAmount)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/service-planning/${plan.id}`} className="font-medium text-[#b51266] hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No monthly service plans yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

export function ServicePlanningDetailView({ id }: { id: string }) {
  const { clients, monthlyServicePlans } = useData();
  const { canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("service-planning");

  const plan = monthlyServicePlans.find((p) => p.id === id);
  const client = plan ? clients.find((c) => c.id === plan.clientId) : undefined;

  if (!plan) {
    return (
      <AppShell title="Service plan not found" audit={{ moduleLabel: "Service planning" }}>
        <p className="text-sm text-slate-600">
          <Link href="/service-planning" className="font-medium text-[#b51266] hover:underline">
            Back to service planning
          </Link>
        </p>
      </AppShell>
    );
  }

  const normalized = normalizeMonthlyServicePlan(plan);

  return (
    <AppShell
      title={`${client?.searchKey ?? "Client"} — ${formatPlanMonthLabel(normalized.planMonth)}`}
      subtitle="Monthly service plan"
      breadcrumbs={[
        { label: "Service planning", href: "/service-planning" },
        { label: formatPlanMonthLabel(normalized.planMonth) },
      ]}
      audit={{
        entityType: "monthly-service-plan",
        entityId: normalized.id,
        meta: auditMetaFrom(normalized),
      }}
    >
      <MonthlyServicePlanEditor plan={normalized} readOnly={!canEdit} />
    </AppShell>
  );
}

export function ClientMonthlyServicePlanPanel({ clientId }: { clientId: string }) {
  const { clients, monthlyServicePlans, upsertMonthlyServicePlan } = useData();
  const { session, canWriteWindow } = useAuth();
  const canEdit = canWriteWindow("client-monthly-service-plan") || canWriteWindow("service-planning");
  const actor = session?.displayName || "SuperUser";

  const client = clients.find((c) => c.id === clientId);
  const plans = useMemo(
    () =>
      monthlyServicePlans
        .filter((p) => p.clientId === clientId)
        .map(normalizeMonthlyServicePlan)
        .sort((a, b) => b.planMonth.localeCompare(a.planMonth)),
    [clientId, monthlyServicePlans]
  );
  const [selectedId, setSelectedId] = useState(plans[0]?.id ?? "");
  const selected = plans.find((p) => p.id === selectedId) ?? plans[0];
  const [planMonth, setPlanMonth] = useState(currentPlanMonthIso());
  const [error, setError] = useState("");

  function createFromBudget() {
    setError("");
    if (!client) return;
    try {
      const record = generateMonthlyPlanFromBudget(client, planMonth, monthlyServicePlans, actor);
      const err = upsertMonthlyServicePlan(record);
      if (err) {
        setError(err);
        return;
      }
      setSelectedId(record.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create plan.");
    }
  }

  if (!client) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Plan monthly hours and spend against {client.searchKey}&apos;s NDIS plan budget. Open the full list on{" "}
        <Link href="/service-planning" className="font-medium text-[#b51266] hover:underline">
          Service planning
        </Link>
        .
      </p>

      {canEdit ? (
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">New plan month</span>
            <input
              className={`${inputClass} w-44`}
              type="month"
              value={planMonth}
              onChange={(e) => setPlanMonth(e.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={createFromBudget}
            className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
          >
            Generate from plan budget
          </button>
        </div>
      ) : null}
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {plans.length ? (
        <>
          <label className="block text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Select plan</span>
            <select
              className={`${inputClass} max-w-md`}
              value={selected?.id ?? ""}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatPlanMonthLabel(p.planMonth)} — {p.status}
                </option>
              ))}
            </select>
          </label>
          {selected ? (
            <>
              <MonthlyServicePlanEditor key={selected.id} plan={selected} readOnly={!canEdit} />
              <p className="text-sm text-slate-500">
                <Link href={`/service-planning/${selected.id}`} className="font-medium text-[#b51266] hover:underline">
                  Open full plan view
                </Link>
              </p>
            </>
          ) : null}
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-4 py-6 text-sm text-slate-600">
          No monthly plans for this client yet. Add plan budget lines first, then generate a monthly plan.
        </p>
      )}
    </div>
  );
}
