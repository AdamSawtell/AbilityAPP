"use client";

import { useDeferredValue, useEffect, useId, useMemo, useState } from "react";
import { TaskEntitySearchPicker } from "@/components/task-entity-search";
import {
  computeNdisReportDeadline,
  emptyIncident,
  formatDisplayDateTime,
  incidentCategoryOptions,
  incidentServiceTypeOptions,
  incidentSeverityOptions,
  ndisReportableTypeOptions,
  type IncidentRecord,
} from "@/lib/incident";
import type { TaskEntityOption } from "@/lib/task-entities";
import { useTaskEntityIndex } from "@/lib/task-entities";
import { useData } from "@/lib/data-store";
import { serviceTypeForIncident } from "@/lib/incident-analytics";
import { withDraftHighlight } from "@/lib/ai/draft-field-highlight";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

const STEPS = ["What happened", "Who was involved", "Safeguards"] as const;
type Step = (typeof STEPS)[number];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}

function toDatetimeLocal(iso: string) {
  if (!iso?.trim()) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toISOString();
}

function LocationQuickPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { locations } = useData();
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const selected = locations.find((l) => l.id === value);

  const results = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return locations.filter((l) => `${l.searchKey} ${l.name}`.toLowerCase().includes(q)).slice(0, 6);
  }, [deferredQuery, locations]);

  if (selected) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <div className="min-w-0 flex-1 text-sm font-medium text-slate-900">
          {selected.searchKey} — {selected.name}
        </div>
        <button type="button" className="text-xs text-slate-500 hover:text-slate-800" onClick={() => onChange("")}>
          Clear
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        className={inputClass}
        type="search"
        placeholder="Search location (min. 2 characters)…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.length > 0 ? (
        <ul className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          {results.map((loc) => (
            <li key={loc.id}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                onClick={() => {
                  onChange(loc.id);
                  setQuery("");
                }}
              >
                {loc.searchKey} — {loc.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export type IncidentQuickReportValues = IncidentRecord;

type IncidentQuickReportWizardProps = {
  initialEmployeeId?: string;
  reporterName?: string;
  onSubmit: (record: IncidentRecord, mode: "draft" | "submit") => void;
  onCancel?: () => void;
};

export function IncidentQuickReportWizard({
  initialEmployeeId = "",
  reporterName = "",
  initialRecord,
  highlightFields,
  onSubmit,
  onCancel,
}: IncidentQuickReportWizardProps & {
  initialRecord?: Partial<IncidentRecord>;
  highlightFields?: Set<string>;
}) {
  const entityIndex = useTaskEntityIndex();
  const { clients, employees, locations, products } = useData();
  const [step, setStep] = useState<Step>("What happened");
  const [error, setError] = useState("");
  const [record, setRecord] = useState<IncidentRecord>(() => {
    const base = emptyIncident();
    return {
      ...base,
      ...initialRecord,
      primaryEmployeeId: initialRecord?.primaryEmployeeId || initialEmployeeId,
      awareAt: initialRecord?.awareAt ?? base.awareAt,
    };
  });

  const stepIndex = STEPS.indexOf(step);

  function patch(partial: Partial<IncidentRecord>) {
    setRecord((prev) => ({ ...prev, ...partial }));
    setError("");
  }

  function clientOption(): TaskEntityOption | null {
    if (!record.primaryClientId) return null;
    const client = clients.find((c) => c.id === record.primaryClientId);
    if (!client) return null;
    return { entityType: "client", entityId: client.id, label: `${client.searchKey} — ${client.name}` };
  }

  function employeeOption(): TaskEntityOption | null {
    if (!record.primaryEmployeeId) return null;
    const employee = employees.find((e) => e.id === record.primaryEmployeeId);
    if (!employee) return null;
    return {
      entityType: "employee",
      entityId: employee.id,
      label: `${employee.searchKey} — ${employee.name}`,
    };
  }

  function validateStep(current: Step): string | null {
    if (current === "What happened") {
      if (!record.title.trim()) return "Add a short title so others can find this report.";
      if (!record.description.trim()) return "Describe what happened — even a brief summary is enough to start.";
      return null;
    }
    if (current === "Safeguards") {
      if (record.isReportable && !record.reportableType) {
        return "Select the NDIS reportable incident type.";
      }
      return null;
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
    setError("");
  }

  function finalize(mode: "draft" | "submit") {
    const message = validateStep("What happened") ?? validateStep("Safeguards");
    if (message) {
      setError(message);
      if (step !== "Safeguards" && record.isReportable) setStep("Safeguards");
      else if (step !== "What happened") setStep("What happened");
      return;
    }

    const parties = [...record.parties];
    if (record.primaryClientId && !parties.some((p) => p.entityId === record.primaryClientId)) {
      parties.push({
        id: `ip-${Date.now()}-c`,
        lineNo: parties.length + 1,
        partyType: "Client",
        entityId: record.primaryClientId,
        partyName: "",
        roleInIncident: "Affected person",
        notes: "",
      });
    }
    if (record.primaryEmployeeId && !parties.some((p) => p.entityId === record.primaryEmployeeId)) {
      parties.push({
        id: `ip-${Date.now()}-e`,
        lineNo: parties.length + 1,
        partyType: "Employee",
        entityId: record.primaryEmployeeId,
        partyName: "",
        roleInIncident: "Staff involved",
        notes: "",
      });
    }

    const actions = [...record.actions];
    if (record.immediateActions.trim() && !actions.some((a) => a.actionType === "Immediate response")) {
      actions.push({
        id: `ia-${Date.now()}`,
        lineNo: actions.length + 1,
        actionDate: new Date().toISOString().slice(0, 10),
        actionType: "Immediate response",
        description: record.immediateActions.trim(),
        evidenceRef: "",
        owner: reporterName,
        outcome: "",
      });
    }

    const reportDeadlineAt =
      record.isReportable && record.reportableType
        ? computeNdisReportDeadline(record.awareAt, record.reportableType, record.restrictivePracticeCausedHarm)
        : "";

    onSubmit(
      {
        ...record,
        status: mode === "draft" ? "Draft" : "Submitted",
        reportDeadlineAt,
        parties,
        actions,
      },
      mode
    );
  }

  const deadlinePreview =
    record.isReportable && record.reportableType && record.awareAt
      ? computeNdisReportDeadline(record.awareAt, record.reportableType, record.restrictivePracticeCausedHarm)
      : "";

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-500">
          {STEPS.map((label, index) => (
            <div key={label} className={`flex-1 ${index <= stepIndex ? "text-[#b51266]" : ""}`}>
              <div
                className={`mb-1 h-1 rounded-full ${index <= stepIndex ? "bg-[#d4147a]" : "bg-slate-200"}`}
              />
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{index + 1}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Step {stepIndex + 1} of {STEPS.length}: <span className="font-medium text-slate-900">{step}</span>
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      {step === "What happened" ? (
        <div className="space-y-4">
          <Field label="Short title">
            <input
              className={withDraftHighlight(inputClass, "title", highlightFields)}
              value={record.title}
              onChange={(e) => patch({ title: e.target.value })}
              placeholder="e.g. Participant slip in kitchen"
              autoFocus
            />
          </Field>
          <Field label="What happened?">
            <textarea
              className={`${withDraftHighlight(inputClass, "description", highlightFields)} min-h-[120px]`}
              value={record.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Describe the incident — what occurred, where, and any immediate concerns."
              rows={5}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="When did it occur?">
              <input
                className={inputClass}
                type="datetime-local"
                value={toDatetimeLocal(record.occurredAt)}
                onChange={(e) => {
                  const occurredAt = fromDatetimeLocal(e.target.value);
                  patch({ occurredAt, awareAt: record.awareAt || occurredAt });
                }}
              />
            </Field>
            <Field label="Category">
              <select
                className={withDraftHighlight(inputClass, "category", highlightFields)}
                value={record.category}
                onChange={(e) => patch({ category: e.target.value })}
              >
                {incidentCategoryOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Severity">
              <select
                className={withDraftHighlight(inputClass, "severity", highlightFields)}
                value={record.severity}
                onChange={(e) => patch({ severity: e.target.value as IncidentRecord["severity"] })}
              >
                {incidentSeverityOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      ) : null}

      {step === "Who was involved" ? (
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Link the people and place involved. You can skip this step and add details later.
          </p>
          <TaskEntitySearchPicker
            index={entityIndex}
            value={clientOption()}
            onChange={(opt) => patch({ primaryClientId: opt?.entityId ?? "" })}
            entityTypeFilter="client"
            showTypeFilter={false}
            label="Client (if applicable)"
          />
          <TaskEntitySearchPicker
            index={entityIndex}
            value={employeeOption()}
            onChange={(opt) => patch({ primaryEmployeeId: opt?.entityId ?? "" })}
            entityTypeFilter="employee"
            showTypeFilter={false}
            label="Staff member involved"
          />
          <Field label="Location">
            <LocationQuickPicker
              value={record.primaryLocationId}
              onChange={(id) => {
                const loc = locations.find((l) => l.id === id);
                const derived = loc
                  ? serviceTypeForIncident(
                      { ...record, primaryLocationId: id, serviceType: "" },
                      locations,
                      products
                    )
                  : "";
                patch({
                  primaryLocationId: id,
                  serviceType: record.serviceType || (derived !== "Unassigned" && derived !== "No linked service" ? derived : ""),
                });
              }}
            />
          </Field>
          <Field label="Service type">
            <select
              className={inputClass}
              value={record.serviceType}
              onChange={(e) => patch({ serviceType: e.target.value })}
            >
              <option value="">Select service type…</option>
              {incidentServiceTypeOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          {record.primaryLocationId ? (
            <p className="text-xs text-slate-500">
              {locations.find((l) => l.id === record.primaryLocationId)?.name ?? ""}
            </p>
          ) : null}
        </div>
      ) : null}

      {step === "Safeguards" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={record.isReportable}
                onChange={(e) =>
                  patch({
                    isReportable: e.target.checked,
                    reportableType: e.target.checked ? record.reportableType : "",
                  })
                }
                className="mt-0.5 rounded border-amber-300 text-[#d4147a] focus:ring-[#d4147a]"
              />
              <span>
                <span className="block text-sm font-medium text-amber-950">NDIS reportable incident</span>
                <span className="mt-0.5 block text-xs text-amber-900/80">
                  Check this if the incident must be reported to the NDIS Quality and Safeguards Commission.
                </span>
              </span>
            </label>
          </div>

          {record.isReportable ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Reportable type">
                <select
                  className={inputClass}
                  value={record.reportableType}
                  onChange={(e) =>
                    patch({
                      reportableType: e.target.value as IncidentRecord["reportableType"],
                      reportDeadlineAt: computeNdisReportDeadline(
                        record.awareAt,
                        e.target.value as IncidentRecord["reportableType"],
                        record.restrictivePracticeCausedHarm
                      ),
                    })
                  }
                >
                  <option value="">Select type…</option>
                  {ndisReportableTypeOptions
                    .filter((o) => o)
                    .map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Restrictive practice caused harm?">
                <select
                  className={inputClass}
                  value={record.restrictivePracticeCausedHarm ? "Yes" : "No"}
                  onChange={(e) => {
                    const harm = e.target.value === "Yes";
                    patch({
                      restrictivePracticeCausedHarm: harm,
                      reportDeadlineAt: record.reportableType
                        ? computeNdisReportDeadline(record.awareAt, record.reportableType, harm)
                        : "",
                    });
                  }}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
              {deadlinePreview ? (
                <p className="sm:col-span-2 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900">
                  NDIS notification deadline: <strong>{formatDisplayDateTime(deadlinePreview)}</strong>
                </p>
              ) : null}
            </div>
          ) : null}

          <Field label="Immediate actions taken">
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={record.immediateActions}
              onChange={(e) => patch({ immediateActions: e.target.value })}
              placeholder="What was done straight away to keep people safe?"
              rows={3}
            />
          </Field>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {stepIndex > 0 ? (
            <button
              type="button"
              onClick={goBack}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
          ) : null}
          {stepIndex < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
            >
              Continue
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => finalize("draft")}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Save draft
              </button>
              <button
                type="button"
                onClick={() => finalize("submit")}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
              >
                Submit report
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type IncidentQuickReportDialogProps = {
  open: boolean;
  onClose: () => void;
  onSubmitted: (incidentId: string) => void;
  initialEmployeeId?: string;
  reporterName?: string;
};

export function IncidentQuickReportDialog({
  open,
  onClose,
  onSubmitted,
  initialEmployeeId,
  reporterName,
}: IncidentQuickReportDialogProps) {
  const titleId = useId();
  const { addIncident } = useData();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  if (!open) return null;

  function handleSubmit(record: IncidentRecord) {
    setSubmitting(true);
    const created = addIncident(record);
    onSubmitted(created.id);
    setSubmitting(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="Close"
        onClick={() => !submitting && onClose()}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900">
            Report an incident
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quick capture for staff — add investigation detail on the full record after submitting.
          </p>
        </div>
        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <IncidentQuickReportWizard
            initialEmployeeId={initialEmployeeId}
            reporterName={reporterName}
            onSubmit={(record) => handleSubmit(record)}
            onCancel={() => !submitting && onClose()}
          />
        </div>
      </div>
    </div>
  );
}
