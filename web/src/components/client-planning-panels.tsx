"use client";

import { useMemo, useState } from "react";
import { LineItemTable, type GenericTableConfig, type LineItemSaveStatus } from "@/components/line-item-table";
import { useAuth } from "@/lib/auth-store";
import { useReferenceData } from "@/lib/config-store";
import { newLineId } from "@/lib/client-line-tables";
import { useData } from "@/lib/data-store";
import { countDirtyRows } from "@/lib/use-dirty-tracking";
import { showSuccessToast, SAVE_TOAST_MESSAGES } from "@/lib/toast";
import type { SupportPlanGoalLine, SupportPlanProgressReviewLine, SupportPlanRecord } from "@/lib/support-plan";

const goalTableConfig: GenericTableConfig<SupportPlanGoalLine> = {
  columns: [
    { key: "lineNo", label: "Line", type: "number", className: "w-14" },
    { key: "name", label: "Name", type: "text" },
    { key: "goalNumber", label: "Goal number", type: "select", optionsKey: "goalNumber" },
    { key: "goalTerm", label: "Goal term", type: "select", optionsKey: "goalTerm" },
    { key: "goalType", label: "Goal type", type: "select", optionsKey: "goalType" },
    { key: "goal", label: "Goal", type: "textarea", className: "min-w-[180px]" },
    { key: "ndisCategory", label: "NDIS category", type: "select", optionsKey: "ndisGoalCategory" },
    { key: "whyItMatters", label: "Why it matters", type: "textarea", className: "min-w-[160px]" },
    { key: "supportRequired", label: "Support activities", type: "textarea", className: "min-w-[180px]" },
    { key: "successMeasures", label: "Success measures", type: "textarea", className: "min-w-[160px]" },
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
    ndisCategory: "",
    whyItMatters: "",
    supportRequired: "",
    successMeasures: "",
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

function useSupportPlanDraft(clientId: string) {
  const { getSupportPlanByClientId, upsertSupportPlan } = useData();
  const stored = getSupportPlanByClientId(clientId);
  const [draft, setDraft] = useState<SupportPlanRecord | null>(null);
  const [saveStatus, setSaveStatus] = useState<LineItemSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | undefined>();
  const [lastSavedCount, setLastSavedCount] = useState(0);
  const plan = draft ?? stored ?? null;

  function onChange<K extends keyof SupportPlanRecord>(key: K, value: SupportPlanRecord[K]) {
    const base = draft ?? stored;
    if (!base) return;
    setSaveStatus("idle");
    setSaveError(undefined);
    setDraft({ ...base, [key]: value, updatedBy: "SuperUser" });
  }

  async function save(toastMessage: string, countRows: () => number) {
    if (!plan) return;
    const changedCount = countRows();
    setLastSavedCount(changedCount);
    setSaveStatus("saving");
    setSaveError(undefined);
    try {
      upsertSupportPlan(plan);
      setDraft(null);
      setSaveStatus("saved");
      showSuccessToast(toastMessage);
    } catch (error) {
      setSaveStatus("error");
      setSaveError(error instanceof Error ? error.message : "Save failed — try again.");
    }
  }

  function discard() {
    setDraft(null);
    setSaveStatus("idle");
    setSaveError(undefined);
  }

  function dismissSaveConfirmation() {
    setSaveStatus("idle");
  }

  return {
    plan,
    stored,
    draft: Boolean(draft),
    saveStatus,
    saveError,
    lastSavedCount,
    onChange,
    save,
    discard,
    dismissSaveConfirmation,
  };
}

export function ClientGoalsPanel({ clientId }: { clientId: string }) {
  const { getOptions } = useReferenceData();
  const {
    plan,
    stored,
    saveStatus,
    saveError,
    lastSavedCount,
    onChange,
    save,
    discard,
    dismissSaveConfirmation,
  } = useSupportPlanDraft(clientId);

  const referenceGoals = stored?.goals ?? [];
  const dirtyCount = useMemo(
    () => (plan && stored ? countDirtyRows(plan.goals, referenceGoals) : 0),
    [plan, stored, referenceGoals]
  );

  const referenceDropdowns = useMemo(
    () => ({
      goalNumber: getOptions("goalNumber"),
      goalTerm: getOptions("goalTerm"),
      goalType: getOptions("goalType"),
      ndisGoalCategory: getOptions("ndisGoalCategory"),
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
      <p className="text-sm text-slate-600">
        Goals from support plan <span className="font-medium text-slate-900">{plan.documentNo}</span>
      </p>
      <LineItemTable
        config={goalTableConfig}
        rows={plan.goals}
        dropdowns={referenceDropdowns}
        onChange={(rows) => onChange("goals", rows)}
        saveable
        referenceRows={referenceGoals}
        saveStatus={saveStatus}
        saveError={saveError}
        saveItemLabel="goal"
        saveConfirmation={{
          message: `Saved — ${lastSavedCount || dirtyCount} goal${(lastSavedCount || dirtyCount) === 1 ? "" : "s"} updated`,
          link: { label: "View on Goals tab", href: `/clients/${clientId}?tab=Goals` },
        }}
        onSave={() => save(SAVE_TOAST_MESSAGES.goals, () => dirtyCount)}
        onDiscard={discard}
        onSaveConfirmationDismiss={dismissSaveConfirmation}
      />
    </div>
  );
}

export function ClientProgressReviewPanel({ clientId }: { clientId: string }) {
  const { getOptions } = useReferenceData();
  const {
    plan,
    stored,
    saveStatus,
    saveError,
    lastSavedCount,
    onChange,
    save,
    discard,
    dismissSaveConfirmation,
  } = useSupportPlanDraft(clientId);

  const referenceReviews = stored?.progressReviews ?? [];
  const dirtyCount = useMemo(
    () => (plan && stored ? countDirtyRows(plan.progressReviews ?? [], referenceReviews) : 0),
    [plan, stored, referenceReviews]
  );

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
      <p className="text-sm text-slate-600">Progress reviews across all goals on plan {plan.documentNo}</p>
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
          saveable
          referenceRows={referenceReviews}
          saveStatus={saveStatus}
          saveError={saveError}
          saveItemLabel="progress review"
          saveConfirmation={{
            message: `Saved — ${lastSavedCount || dirtyCount} progress review${(lastSavedCount || dirtyCount) === 1 ? "" : "s"} updated`,
            link: { label: "View on Progress Review tab", href: `/clients/${clientId}?tab=Progress Review` },
          }}
          onSave={() => save(SAVE_TOAST_MESSAGES.progressReviews, () => dirtyCount)}
          onDiscard={discard}
          onSaveConfirmationDismiss={dismissSaveConfirmation}
        />
      )}
    </div>
  );
}
