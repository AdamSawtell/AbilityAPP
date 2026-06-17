"use client";

import { useEffect, useRef } from "react";
import { useData } from "@/lib/data-store";
import { useOrganization } from "@/lib/organization-store";
import { evaluateScheduledAutomations } from "@/lib/task-automation/engine";
import { markScheduledAutomationsRan, shouldRunScheduledAutomations } from "@/lib/task-automation/scheduled";

/**
 * Runs overdue incident and credential-expiry automations at most once per browser session day.
 * Event-driven automations fire from data-store on record save.
 */
export function TaskAutomationRunner() {
  const { hydrated, incidents, employees, tasks, taskAutomations, addAutomationTasks } = useData();
  const { organization } = useOrganization();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (!hydrated || attemptedRef.current) return;
    attemptedRef.current = true;

    if (!shouldRunScheduledAutomations()) return;
    if (!taskAutomations.some((r) => r.active)) return;

    const { drafts } = evaluateScheduledAutomations({
      incidents,
      employees,
      rules: taskAutomations,
      tasks,
      investigationSlaDays: organization.incidentInvestigationSlaDays,
    });

    if (drafts.length) {
      addAutomationTasks(drafts);
    }

    markScheduledAutomationsRan();
  }, [
    hydrated,
    incidents,
    employees,
    tasks,
    taskAutomations,
    organization.incidentInvestigationSlaDays,
    addAutomationTasks,
  ]);

  return null;
}
