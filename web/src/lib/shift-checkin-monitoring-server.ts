import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllData, fetchTasks, saveTask } from "@/lib/supabase/data-api";
import { fetchUsers } from "@/lib/supabase/access-api";
import { getOrganizationTimezone, getSystemSettings } from "@/lib/session-audit/server";
import { automationDedupeKey } from "@/lib/task-automation";
import { createTask, describeAssignee, isActiveTask, logTaskUpdate } from "@/lib/task";
import {
  describeShiftEscalation,
  evaluateShiftCheckinEscalations,
  parseShiftCheckinMonitoringSettings,
  shiftEscalationLabel,
  SHIFT_ESCALATION_FALLBACK_ROLE_ID,
  type ShiftCheckinEscalation,
  type ShiftCheckinMonitoringSettings,
} from "@/lib/shift-checkin-monitoring";

export const SHIFT_CHECKIN_ESCALATION_RULE_ID = "shift-checkin-escalation";

export async function getShiftCheckinMonitoringSettings(): Promise<ShiftCheckinMonitoringSettings> {
  const settings = await getSystemSettings();
  return parseShiftCheckinMonitoringSettings(settings);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * Sweep recent active shifts and create dedup'd escalation tasks for late /
 * missed check-ins and missed check-outs. Assigns to the worker's reports-to
 * manager, falling back to the coordinator role. Intended for the scheduled
 * automation runner (cron or admin trigger).
 */
export async function runServerShiftCheckinEscalation(supabase: SupabaseClient): Promise<number> {
  const [settings, timeZone, data, users, tasks] = await Promise.all([
    getShiftCheckinMonitoringSettings(),
    getOrganizationTimezone(),
    fetchAllData(supabase),
    fetchUsers(supabase),
    fetchTasks(supabase),
  ]);

  const escalations = evaluateShiftCheckinEscalations({
    shifts: data.rosterShifts,
    settings,
    timeZone,
    fromDate: isoDaysAgo(2),
  });

  // Late check-ins are advisory only on Home; tasks are created for missed
  // check-in (no-show) and missed check-out so a manager actively follows up.
  const taskable = escalations.filter((e) => e.kind !== "late_checkin");
  if (!taskable.length) return 0;

  const employeeById = new Map(data.employees.map((e) => [e.id, e]));
  const userByEmployeeId = new Map(
    users.filter((u) => u.employeeBpId?.trim()).map((u) => [u.employeeBpId.trim(), u])
  );

  const openDedupeKeys = new Set(
    tasks.filter(isActiveTask).map((t) => t.automationDedupeKey?.trim()).filter(Boolean) as string[]
  );

  let working = [...tasks];
  let created = 0;

  for (const escalation of taskable) {
    const dedupeKey = automationDedupeKey(
      SHIFT_CHECKIN_ESCALATION_RULE_ID,
      "roster-shift",
      `${escalation.shiftId}:${escalation.employeeId}:${escalation.kind}`
    );
    if (openDedupeKeys.has(dedupeKey)) continue;

    const worker = employeeById.get(escalation.employeeId);
    const workerName = worker?.name ?? escalation.employeeId;
    const managerEmployeeId = worker?.reportsToId?.trim() ?? "";
    const managerUser = managerEmployeeId ? userByEmployeeId.get(managerEmployeeId) : undefined;

    const assignmentType = managerUser ? "user" : "role";
    const assigneeUserId = managerUser?.id ?? "";
    const assigneeRoleId = managerUser ? "" : SHIFT_ESCALATION_FALLBACK_ROLE_ID;

    const base = createTask(
      {
        title: `${shiftEscalationLabel(escalation.kind)} — ${escalation.shiftRef}`,
        description: describeShiftEscalation(escalation, workerName),
        status: "Open",
        taskTypeId: "tt-check",
        priority: escalation.kind === "missed_checkin" ? "High" : "Normal",
        dueDate: escalation.shiftDate,
        assignmentType,
        assigneeUserId,
        assigneeRoleId,
        entityType: "roster-shift",
        entityId: escalation.shiftId,
        entityLabel: escalation.shiftRef,
        createdByUserId: "",
        createdBy: "Shift monitoring",
        updatedBy: "Shift monitoring",
        completedBy: "",
        completedAt: "",
        resolutionNotes: "",
        updates: [],
        automationRuleId: SHIFT_CHECKIN_ESCALATION_RULE_ID,
        automationDedupeKey: dedupeKey,
      },
      working
    );
    const withLog = logTaskUpdate(base, {
      byUserId: "",
      byName: "Shift monitoring",
      action: "created",
      summary: `Created automatically and assigned to ${describeAssignee(base)}`,
      detail: describeShiftEscalation(escalation, workerName),
    });
    await saveTask(supabase, withLog);
    working = [...working, withLog];
    openDedupeKeys.add(dedupeKey);
    created += 1;
  }

  return created;
}

export type { ShiftCheckinEscalation };
