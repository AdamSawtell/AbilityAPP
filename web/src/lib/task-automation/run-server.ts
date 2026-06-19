import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchUsers } from "@/lib/supabase/access-api";
import { fetchOrganization } from "@/lib/supabase/organization-api";
import { fetchOrgStructure } from "@/lib/supabase/org-structure-api";
import { fetchTaskAutomations, fetchTasks, saveTask } from "@/lib/supabase/data-api";
import { investigationSlaDays } from "@/lib/incident-analytics";
import type { EmployeeRecord } from "@/lib/employee";
import type { OrgAutomationContext } from "@/lib/org-automation-context";
import type { AutomationEvent } from "@/lib/task-automation/events";
import { evaluateAutomationEvents } from "@/lib/task-automation/engine";
import { createTask, describeAssignee, logTaskUpdate } from "@/lib/task";

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
