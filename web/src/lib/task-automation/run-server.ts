import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchUsers } from "@/lib/supabase/access-api";
import { fetchAllData, fetchIncidents, fetchTaskAutomations, fetchTasks, saveTask } from "@/lib/supabase/data-api";
import { fetchOrganization } from "@/lib/supabase/organization-api";
import { fetchOrgStructure } from "@/lib/supabase/org-structure-api";
import { investigationSlaDays } from "@/lib/incident-analytics";
import type { EmployeeRecord } from "@/lib/employee";
import type { OrgAutomationContext } from "@/lib/org-automation-context";
import { automationDedupeKey } from "@/lib/task-automation";
import type { AutomationEvent } from "@/lib/task-automation/events";
import { evaluateAutomationEvents, evaluateScheduledAutomations } from "@/lib/task-automation/engine";
import {
  createTask,
  describeAssignee,
  isActiveTask,
  logTaskUpdate,
  WORKFORCE_CREDENTIAL_AUTOMATION_RULE,
  WORKFORCE_LEAVE_AUTOMATION_RULE,
} from "@/lib/task";
import type { AutomationTaskDraft } from "@/lib/task-automation/engine";

async function loadOrgAutomationContext(supabase: SupabaseClient): Promise<OrgAutomationContext> {
  const [structure, users, empRes] = await Promise.all([
    fetchOrgStructure(supabase),
    fetchUsers(supabase),
    supabase.from("employee").select("id, search_key, name, job_title, employment_status, reports_to_id"),
  ]);
  if (empRes.error) throw empRes.error;

  const employees = (empRes.data ?? []).map(
    (row) =>
      ({
        id: row.id,
        searchKey: row.search_key ?? row.id,
        name: row.name ?? row.id,
        jobTitle: row.job_title ?? "",
        employmentStatus: row.employment_status ?? "Active",
        reportsToId: row.reports_to_id ?? "",
      }) as EmployeeRecord
  );

  return {
    positions: structure.positions,
    assignments: structure.assignments,
    employees,
    users: users.map((user) => ({ id: user.id, employeeBpId: user.employeeBpId })),
  };
}

async function readInvestigationSlaDays(supabase: SupabaseClient): Promise<number> {
  try {
    const org = await fetchOrganization(supabase);
    return investigationSlaDays(org?.incidentInvestigationSlaDays);
  } catch {
    return investigationSlaDays(14);
  }
}

async function persistAutomationDrafts(
  supabase: SupabaseClient,
  drafts: AutomationTaskDraft[],
  tasks: Awaited<ReturnType<typeof fetchTasks>>
): Promise<number> {
  if (!drafts.length) return 0;

  let working = [...tasks];
  for (const draft of drafts) {
    const base = createTask({ ...draft, updates: [] }, working);
    const created = logTaskUpdate(base, {
      byUserId: "",
      byName: draft.createdBy,
      action: "created",
      summary: `Created automatically and assigned to ${describeAssignee(base)}`,
      detail: draft.entityLabel ? `Linked to ${draft.entityLabel}.` : draft.description || "",
    });
    await saveTask(supabase, created);
    working = [...working, created];
  }

  return drafts.length;
}

/** Evaluate automation rules server-side and persist created tasks (My Workplace API paths). */
export async function runServerAutomationEvents(
  supabase: SupabaseClient,
  events: AutomationEvent[]
): Promise<number> {
  if (!events.length) return 0;

  const [rules, tasks, org, slaDays] = await Promise.all([
    fetchTaskAutomations(supabase),
    fetchTasks(supabase),
    loadOrgAutomationContext(supabase),
    readInvestigationSlaDays(supabase),
  ]);

  if (!rules.some((rule) => rule.active)) return 0;

  const { drafts } = evaluateAutomationEvents({
    events,
    rules,
    tasks,
    investigationSlaDays: slaDays,
    org,
  });

  return persistAutomationDrafts(supabase, drafts, tasks);
}

/** Scheduled credential expiry and incident SLA automations — for cron or admin trigger. */
export async function runServerScheduledAutomations(supabase: SupabaseClient): Promise<number> {
  const [rules, tasks, org, slaDays, incidents, data] = await Promise.all([
    fetchTaskAutomations(supabase),
    fetchTasks(supabase),
    loadOrgAutomationContext(supabase),
    readInvestigationSlaDays(supabase),
    fetchIncidents(supabase),
    fetchAllData(supabase),
  ]);

  if (!rules.some((rule) => rule.active)) return 0;

  const { drafts } = evaluateScheduledAutomations({
    incidents,
    employees: data.employees,
    serviceAgreements: data.serviceAgreements,
    clients: data.clients,
    rules,
    tasks,
    investigationSlaDays: slaDays,
    org,
  });

  return persistAutomationDrafts(supabase, drafts, tasks);
}

export type WorkforceAutomationCloseInput =
  | { type: "leave"; employeeId: string; requestId: string; summary: string; reviewerName: string }
  | { type: "credential"; employeeId: string; credentialId: string; summary: string; reviewerName: string };

/** Close open automation tasks when a workforce review action completes the loop. */
export async function closeWorkforceAutomationTasks(
  supabase: SupabaseClient,
  input: WorkforceAutomationCloseInput
): Promise<number> {
  const ruleId =
    input.type === "leave" ? WORKFORCE_LEAVE_AUTOMATION_RULE : WORKFORCE_CREDENTIAL_AUTOMATION_RULE;
  const lineId = input.type === "leave" ? input.requestId : input.credentialId;
  const dedupeKey = automationDedupeKey(ruleId, "employee", `${input.employeeId}:${lineId}`);

  const tasks = await fetchTasks(supabase);
  let closed = 0;
  const now = new Date().toISOString();

  for (const task of tasks) {
    if (!isActiveTask(task)) continue;
    if (task.automationDedupeKey !== dedupeKey) continue;

    const completed = logTaskUpdate(
      {
        ...task,
        status: "Completed",
        completedBy: input.reviewerName,
        completedAt: now,
        resolutionNotes: input.summary,
      },
      {
        byUserId: "",
        byName: input.reviewerName,
        action: "closed",
        summary: "Closed — workforce review completed",
        detail: input.summary,
      }
    );
    await saveTask(supabase, completed);
    closed += 1;
  }

  return closed;
}
