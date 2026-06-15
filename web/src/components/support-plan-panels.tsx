"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LineItemTable, type GenericTableConfig } from "@/components/line-item-table";
import { useReferenceData } from "@/lib/config-store";
import { formatContractDate } from "@/lib/contract";
import { newLineId } from "@/lib/client-line-tables";
import { useData } from "@/lib/data-store";
import {
  supportPlanSections,
  type SupportPlanGoalLine,
  type SupportPlanRecord,
} from "@/lib/support-plan";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const goalTableConfig: GenericTableConfig<SupportPlanGoalLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "name", label: "Name", type: "text" },
    { key: "goalNumber", label: "Goal number", type: "select", optionsKey: "goalNumber" },
    { key: "goalTerm", label: "Goal term", type: "select", optionsKey: "goalTerm" },
    { key: "goalType", label: "Goal type", type: "select", optionsKey: "goalType" },
    { key: "goal", label: "Goal", type: "textarea", className: "min-w-[180px]" },
    { key: "supportRequired", label: "Support required", type: "textarea", className: "min-w-[180px]" },
    { key: "startDate", label: "Start", type: "date" },
    { key: "endDate", label: "End", type: "date" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("goal"),
    lineNo,
    name: "",
    goalNumber: "",
    goalTerm: "",
    goalType: "NDIS Goal",
    goal: "",
    supportRequired: "",
    startDate: "",
    endDate: "",
  }),
  addLabel: "Add goal",
  emptyMessage: "No goals on this support plan yet.",
};

function SupportPlanField({
  field,
  plan,
  onChange,
  getOptions,
}: {
  field: (typeof supportPlanSections)[number]["fields"][number];
  plan: SupportPlanRecord;
  onChange: (key: keyof SupportPlanRecord, value: SupportPlanRecord[keyof SupportPlanRecord]) => void;
  getOptions: (key: string) => string[];
}) {
  const value = plan[field.key];

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(field.key, e.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "select" && field.optionsKey) {
    return (
      <label>
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
        <select
          className={inputClass}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.key, e.target.value)}
        >
          <option value="">Select…</option>
          {getOptions(field.optionsKey).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="sm:col-span-2">
        <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
        <textarea
          className={`${inputClass} min-h-[72px] resize-y`}
          value={String(value ?? "")}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      </label>
    );
  }

  return (
    <label>
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{field.label}</span>
      <input
        className={inputClass}
        type={field.type === "date" ? "date" : "text"}
        value={String(value ?? "")}
        onChange={(e) => onChange(field.key, e.target.value)}
      />
    </label>
  );
}

export function ClientSupportPlanPanel({
  clientId,
  onDirty,
}: {
  clientId: string;
  onDirty?: (dirty: boolean) => void;
}) {
  const { getSupportPlanByClientId, upsertSupportPlan } = useData();
  const { getOptions } = useReferenceData();
  const stored = getSupportPlanByClientId(clientId);
  const [draft, setDraft] = useState<SupportPlanRecord | null>(null);
  const [section, setSection] = useState(supportPlanSections[0]?.id ?? "about");
  const plan = draft ?? stored ?? null;
  const activeSection = supportPlanSections.find((s) => s.id === section) ?? supportPlanSections[0];

  const referenceDropdowns = useMemo(
    () => ({
      goalNumber: getOptions("goalNumber"),
      goalTerm: getOptions("goalTerm"),
      goalType: getOptions("goalType"),
    }),
    [getOptions]
  );

  if (!plan) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
        <p className="text-sm text-slate-600">No support plan for this client yet.</p>
        <p className="mt-1 text-xs text-slate-500">Create one from Plan &amp; Assessment or add sample data.</p>
      </div>
    );
  }

  function onChange<K extends keyof SupportPlanRecord>(key: K, value: SupportPlanRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
    onDirty?.(true);
  }

  function save() {
    if (!plan) return;
    upsertSupportPlan(plan);
    setDraft(null);
    onDirty?.(false);
  }

  function discard() {
    setDraft(null);
    onDirty?.(false);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#f9a8d4]/60 bg-gradient-to-br from-[#fdf2f8] to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">Support plan</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">Document {plan.documentNo}</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{plan.description}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>Provided {formatContractDate(plan.providedToReceiver)}</p>
            <p>{plan.active ? "Active" : "Inactive"}</p>
          </div>
        </div>
        {draft ? (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={save}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              Save support plan
            </button>
            <button
              type="button"
              onClick={discard}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Discard
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <nav className="flex shrink-0 flex-wrap gap-1 lg:w-52 lg:flex-col">
          {supportPlanSections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`rounded-lg px-3 py-2 text-left text-sm transition ${
                section === s.id
                  ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                  : "text-slate-600 hover:bg-white/80"
              }`}
            >
              {s.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSection("goals")}
            className={`rounded-lg px-3 py-2 text-left text-sm transition ${
              section === "goals"
                ? "bg-white font-medium text-[#b51266] shadow-sm ring-1 ring-[#f9a8d4]/60"
                : "text-slate-600 hover:bg-white/80"
            }`}
          >
            Goals
          </button>
        </nav>

        <div className="min-w-0 flex-1">
          {section === "goals" ? (
            <LineItemTable
              config={goalTableConfig}
              rows={plan.goals}
              dropdowns={referenceDropdowns}
              onChange={(rows) => onChange("goals", rows)}
            />
          ) : (
            <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
              {activeSection?.fields.map((field) => (
                <SupportPlanField key={field.key} field={field} plan={plan} onChange={onChange} getOptions={getOptions} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ClientPlanAssessmentPanel({ clientId }: { clientId: string }) {
  const { getPlanDocumentsByClientId, getSupportPlanByClientId } = useData();
  const documents = getPlanDocumentsByClientId(clientId);

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Plan and assessment documents for this client. Support plans open from here.
      </p>
      {documents.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Document no</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Plan type</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => {
                const plan = doc.supportPlanId ? getSupportPlanByClientId(clientId) : null;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium">{doc.documentNo}</td>
                    <td className="px-4 py-3">{doc.documentType}</td>
                    <td className="px-4 py-3">
                      {doc.planType === "Support Plan" && plan ? (
                        <Link
                          href={`/clients/${clientId}?tab=Support%20Plan`}
                          className="text-[#b51266] hover:underline"
                        >
                          {doc.planType} ({plan.documentNo})
                        </Link>
                      ) : (
                        doc.planType
                      )}
                    </td>
                    <td className="px-4 py-3">{formatContractDate(doc.reviewDate)}</td>
                    <td className="px-4 py-3">{doc.documentStatus}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center text-sm text-slate-600">
          No plan documents yet.
        </div>
      )}
    </div>
  );
}
