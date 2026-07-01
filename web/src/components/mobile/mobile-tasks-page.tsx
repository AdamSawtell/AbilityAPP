"use client";

import Link from "next/link";
import { useMemo } from "react";
import { MobileAuthGuard } from "@/components/mobile/mobile-auth-guard";
import { MobileEmployeeShell } from "@/components/mobile/mobile-employee-shell";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { filterTasksForView } from "@/lib/task-access";
import { sortTasks, taskUrgency } from "@/lib/task-hub";
import { useTaskTypes } from "@/lib/task-type-store";
import type { TaskRecord } from "@/lib/task";

function urgencyClass(task: TaskRecord): string {
  const u = taskUrgency(task);
  if (u === "overdue") return "border-l-rose-500";
  if (u === "today") return "border-l-amber-400";
  if (task.priority === "High") return "border-l-[#b51266]";
  return "border-l-transparent";
}

export function MobileTasksPage() {
  const { session } = useAuth();
  const { tasks } = useData();
  const { getTaskTypeName } = useTaskTypes();

  const assigned = useMemo(() => {
    if (!session) return [];
    return sortTasks(filterTasksForView(tasks, "assigned-to-me", session), "due");
  }, [tasks, session]);

  return (
    <MobileAuthGuard windowKey="tasks-assigned-to-me">
      <MobileEmployeeShell title="My tasks" subtitle="Assigned to you — open to update or complete">
        {assigned.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No open tasks assigned to you.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {assigned.map((task) => (
              <li key={task.id} className={`border-l-4 ${urgencyClass(task)}`}>
                <Link href={`/tasks/${task.id}?from=/m/tasks`} className="block px-4 py-4 active:bg-slate-50">
                  <p className="font-medium text-slate-900">{task.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {task.documentNo} · {getTaskTypeName(task.taskTypeId)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
                      {task.status}
                    </span>
                    {task.dueDate ? (
                      <span className="text-xs text-slate-500">Due {task.dueDate}</span>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-center text-xs text-slate-500">
          Tap a task to add updates or mark it complete.
        </p>
      </MobileEmployeeShell>
    </MobileAuthGuard>
  );
}
