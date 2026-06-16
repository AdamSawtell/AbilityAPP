"use client";

import { useMemo, useState } from "react";
import { LineItemTable, type GenericTableConfig } from "@/components/line-item-table";
import { useReferenceData } from "@/lib/config-store";
import { newLineId } from "@/lib/client-line-tables";
import { useData } from "@/lib/data-store";
import type { SupportPlanGoalLine, SupportPlanProgressReviewLine, SupportPlanRecord } from "@/lib/support-plan";

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
  emptyMessage: "No goals on the active support plan yet.",
};

const progressReviewTableConfig: GenericTableConfig<SupportPlanProgressReviewLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "goalId", label: "Goal", type: "select", optionsKey: "clientGoalIds" },
    { key: "progressReviewType", label: "Review type", type: "select", optionsKey: "progressReviewType" },
    { key: "reviewDate", label: "Review date", type: "date" },
    { key: "goalProgress", label: "Goal progress", type: "select", optionsKey: "goalProgress" },
    { key: "progressTaken", label: "Progress taken", type: "textarea", className: "min-w-[160px]" },
    { key: "receiverFeeling", label: "How they feel", type: "textarea", className: "min-w-[160px]" },
    { key: "nextSteps", label: "Next steps", type: "textarea", className: "min-w-[160px]" },
    { key: "createdBy", label: "Created by", type: "text" },
  ],
  emptyRow: (lineNo) => ({
    id: newLineId("pr"),
    lineNo,
    goalId: "",
    goalName: "",
    progressReviewType: "Progress Review",
    reviewDate: new Date().toISOString().slice(0, 10),
    goalProgress: "",
    progressTaken: "",
    receiverFeeling: "",
    nextSteps: "",
    createdBy: "SuperUser",
    updatedBy: "SuperUser",
  }),
  addLabel: "Add progress review",
  emptyMessage: "No progress reviews recorded for this client's goals.",
};

function PlanSaveBar({
  dirty,
  onSave,
  onDiscard,
}: {
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  if (!dirty) return null;
  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onSave}
        className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]"
      >
        Save support plan
      </button>
      <button
        type="button"
        onClick={onDiscard}
        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Discard
      </button>
    </div>
  );
}

function useSupportPlanDraft(clientId: string) {
  const { getSupportPlanByClientId, upsertSupportPlan } = useData();
  const stored = getSupportPlanByClientId(clientId);
  const [draft, setDraft] = useState<SupportPlanRecord | null>(null);
  const plan = draft ?? stored ?? null;

  function onChange<K extends keyof SupportPlanRecord>(key: K, value: SupportPlanRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
  }

  function save() {
    if (!plan) return;
    upsertSupportPlan(plan);
    setDraft(null);
  }

  function discard() {
    setDraft(null);
  }

  return { plan, draft: Boolean(draft), onChange, save, discard };
}

export function ClientGoalsPanel({ clientId }: { clientId: string }) {
  const { getOptions } = useReferenceData();
  const { plan, draft, onChange, save, discard } = useSupportPlanDraft(clientId);

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
        <p className="mt-1 text-xs text-slate-500">Goals are stored on the active support plan. Create one under Plan and Assessment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Goals from support plan <span className="font-medium text-slate-900">{plan.documentNo}</span>
        </p>
        <PlanSaveBar dirty={draft} onSave={save} onDiscard={discard} />
      </div>
      <LineItemTable
        config={goalTableConfig}
        rows={plan.goals}
        dropdowns={referenceDropdowns}
        onChange={(rows) => onChange("goals", rows)}
      />
    </div>
  );
}

export function ClientProgressReviewPanel({ clientId }: { clientId: string }) {
  const { getOptions } = useReferenceData();
  const { plan, draft, onChange, save, discard } = useSupportPlanDraft(clientId);

  const goalDropdowns = useMemo(() => {
    if (!plan) return { clientGoalIds: [] as string[] };
    return { clientGoalIds: plan.goals.map((g) => g.id) };
  }, [plan]);

  const goalLabels = useMemo(() => {
    if (!plan) return {};
    return Object.fromEntries(plan.goals.map((g) => [g.id, g.name || g.goal || `Goal ${g.lineNo}`]));
  }, [plan]);

  const referenceDropdowns = useMemo(
    () => ({
      progressReviewType: getOptions("progressReviewType"),
      goalProgress: getOptions("goalProgress"),
    }),
    [getOptions]
  );

  if (!plan) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-10 text-center">
        <p className="text-sm text-slate-600">No support plan for this client yet.</p>
        <p className="mt-1 text-xs text-slate-500">Progress reviews link to goals on the active support plan.</p>
      </div>
    );
  }

  function onReviewsChange(rows: SupportPlanProgressReviewLine[]) {
    const synced = rows.map((row) => ({
      ...row,
      goalName: goalLabels[row.goalId] ?? row.goalName,
    }));
    onChange("progressReviews", synced);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">Progress reviews across all goals on plan {plan.documentNo}</p>
        <PlanSaveBar dirty={draft} onSave={save} onDiscard={discard} />
      </div>
      {plan.goals.length === 0 ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add goals first on the Goals tab or Support Plan panel.
        </p>
      ) : (
        <LineItemTable
          config={progressReviewTableConfig}
          rows={plan.progressReviews ?? []}
          dropdowns={{ ...referenceDropdowns, ...goalDropdowns }}
          optionLabels={goalLabels}
          onChange={onReviewsChange}
        />
      )}
    </div>
  );
}
