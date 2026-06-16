"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  DEFAULT_TASK_HUB_PREFERENCES,
  loadTaskHubPreferences,
  saveTaskHubPreferences,
  type TaskHubPreferences,
} from "@/lib/task-hub-preferences";
import {
  criticalTasksForSession,
  groupTasks,
  parseTaskScope,
  sortTasks,
  taskDashboardStats,
  taskMatchesSearch,
  taskScopeLabel,
  taskUrgency,
  type TaskGroupMode,
  type TaskSortMode,
} from "@/lib/task-hub";
import { filterTasksForView, visibleTaskViews, type TaskListView } from "@/lib/task-access";
import { useTaskTypes } from "@/lib/task-type-store";
import { type TaskRecord, isActiveTask } from "@/lib/task";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function statusPill(status: TaskRecord["status"]) {
  const styles =
    status === "Open"
      ? "bg-sky-50 text-sky-800 ring-sky-200"
      : status === "In progress"
        ? "bg-amber-50 text-amber-900 ring-amber-200"
        : status === "Completed"
          ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
          : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${styles}`}>{status}</span>
  );
}

function urgencyBadge(task: TaskRecord) {
  const urgency = taskUrgency(task);
  if (urgency === "overdue") {
    return <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">Overdue</span>;
  }
  if (urgency === "today") {
    return <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">Due today</span>;
  }
  if (urgency === "soon") {
    return <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-orange-200">Due soon</span>;
  }
  return null;
}

function TaskRow({ task, compact }: { task: TaskRecord; compact?: boolean }) {
  const { getTaskTypeName } = useTaskTypes();
  const urgency = taskUrgency(task);
  const border =
    urgency === "overdue"
      ? "border-l-4 border-l-red-500"
      : urgency === "today"
        ? "border-l-4 border-l-amber-400"
        : task.priority === "High"
          ? "border-l-4 border-l-[#d4147a]"
          : "border-l-4 border-l-transparent";

  return (
    <Link
      href={`/tasks/${task.id}`}
      className={`flex flex-col gap-2 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between ${border} ${
        compact ? "px-4 py-2.5" : "px-5 py-4"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className={`font-medium text-slate-900 ${compact ? "text-sm" : ""}`}>{task.title}</p>
          {task.priority === "High" ? (
            <span className="rounded bg-[#fdf2f8] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#b51266]">
              High
            </span>
          ) : null}
        </div>
        <p className={`mt-0.5 text-slate-500 ${compact ? "text-xs" : "text-sm"}`}>
          {task.documentNo} · {getTaskTypeName(task.taskTypeId)}
          {task.entityLabel ? ` · ${task.entityLabel}` : null}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {urgencyBadge(task)}
        {statusPill(task.status)}
        {task.dueDate ? (
          <span className="text-xs text-slate-500">Due {task.dueDate}</span>
        ) : isActiveTask(task) ? (
          <span className="text-xs text-slate-400">No due date</span>
        ) : null}
      </div>
    </Link>
  );
}

function StatChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition ${
        active
          ? "bg-[#d4147a] text-white ring-[#d4147a]"
          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
      }`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${active ? "bg-white/20" : "bg-slate-100 text-slate-700"}`}>
        {count}
      </span>
    </button>
  );
}

export function TaskHubView({ initialScope }: { initialScope?: TaskListView }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tasks } = useData();
  const { session, canProcess } = useAuth();

  const [prefs, setPrefs] = useState<TaskHubPreferences>(() =>
    typeof window === "undefined" ? DEFAULT_TASK_HUB_PREFERENCES : loadTaskHubPreferences()
  );
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const allowedViews = useMemo(() => visibleTaskViews(session?.windowKeys ?? []), [session?.windowKeys]);
  const scopeFromUrl = searchParams.get("scope") ?? initialScope ?? null;
  const activeScope = parseTaskScope(scopeFromUrl, prefs.defaultScope);
  const resolvedScope = allowedViews.some((v) => v.key === activeScope)
    ? activeScope
    : allowedViews[0]?.key ?? "assigned-to-me";

  function setScope(next: TaskListView) {
    router.push(`/tasks?scope=${next}`);
  }

  function updatePrefs(patch: Partial<TaskHubPreferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveTaskHubPreferences(next);
      return next;
    });
  }

  const stats = useMemo(() => (session ? taskDashboardStats(tasks, session) : null), [tasks, session]);
  const critical = useMemo(() => (session ? criticalTasksForSession(tasks, session) : []), [tasks, session]);
  const { getTaskTypeName } = useTaskTypes();

  const scopedTasks = useMemo(() => {
    if (!session) return [];
    return filterTasksForView(tasks, resolvedScope, session);
  }, [tasks, session, resolvedScope]);

  const filteredTasks = useMemo(
    () => scopedTasks.filter((task) => taskMatchesSearch(task, search, getTaskTypeName(task.taskTypeId))),
    [scopedTasks, search, getTaskTypeName]
  );

  const sortedTasks = useMemo(() => sortTasks(filteredTasks, prefs.sort), [filteredTasks, prefs.sort]);
  const groupedTasks = useMemo(() => groupTasks(sortedTasks, prefs.groupBy), [sortedTasks, prefs.groupBy]);

  if (!session || allowedViews.length === 0) {
    return (
      <AppShell title="Tasks" subtitle="You do not have access to tasks for your current role.">
        <p className="text-sm text-slate-600">Ask an administrator to grant task windows for your role.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Tasks"
      subtitle="Prioritise your work — overdue, due today, and assigned to you in one place."
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Tasks" }]}
      audit={{ moduleLabel: "Tasks" }}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPrefsOpen((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {prefsOpen ? "Hide settings" : "Settings"}
          </button>
          {canProcess("assign-task") ? (
            <Link href="/tasks/new" className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white hover:bg-[#b51266]">
              New task
            </Link>
          ) : null}
        </div>
      }
    >
      {prefsOpen ? (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Your task workspace</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Default view when opening Tasks</span>
              <select
                className={inputClass}
                value={prefs.defaultScope}
                onChange={(e) => updatePrefs({ defaultScope: e.target.value as TaskListView })}
              >
                {allowedViews.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Sort by</span>
              <select className={inputClass} value={prefs.sort} onChange={(e) => updatePrefs({ sort: e.target.value as TaskSortMode })}>
                <option value="due">Due date & urgency</option>
                <option value="priority">Priority</option>
                <option value="updated">Recently updated</option>
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-medium text-slate-600">Group by</span>
              <select className={inputClass} value={prefs.groupBy} onChange={(e) => updatePrefs({ groupBy: e.target.value as TaskGroupMode })}>
                <option value="none">No grouping</option>
                <option value="due">Due date</option>
                <option value="priority">Priority</option>
                <option value="status">Status</option>
              </select>
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-700">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={prefs.showStats} onChange={(e) => updatePrefs({ showStats: e.target.checked })} />
              Show summary stats
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={prefs.showCritical} onChange={(e) => updatePrefs({ showCritical: e.target.checked })} />
              Show critical section
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={prefs.compactList} onChange={(e) => updatePrefs({ compactList: e.target.checked })} />
              Compact list
            </label>
          </div>
        </section>
      ) : null}

      {prefs.showStats && stats ? (
        <section className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setScope("assigned-to-me")}
            className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-red-700">Overdue</p>
            <p className="mt-1 text-3xl font-semibold text-red-900">{stats.overdue}</p>
            <p className="mt-1 text-xs text-red-700/80">Needs attention now</p>
          </button>
          <button
            type="button"
            onClick={() => setScope("assigned-to-me")}
            className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-amber-800">Due today</p>
            <p className="mt-1 text-3xl font-semibold text-amber-950">{stats.dueToday}</p>
            <p className="mt-1 text-xs text-amber-800/80">Finish before end of day</p>
          </button>
          <button
            type="button"
            onClick={() => setScope("assigned-to-me")}
            className="rounded-xl border border-[#f9a8d4]/60 bg-gradient-to-br from-[#fdf2f8] to-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[#b51266]">Assigned to me</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.assignedToMe}</p>
            <p className="mt-1 text-xs text-slate-500">Open tasks waiting on you</p>
          </button>
          <button
            type="button"
            onClick={() => setScope("my-role")}
            className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 text-left shadow-sm transition hover:shadow-md"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-800">To my role</p>
            <p className="mt-1 text-3xl font-semibold text-slate-900">{stats.myRole}</p>
            <p className="mt-1 text-xs text-slate-500">{session.activeRoleName}</p>
          </button>
        </section>
      ) : null}

      {prefs.showCritical && critical.length > 0 && resolvedScope !== "past" ? (
        <section className="mb-6 overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm">
          <div className="border-b border-red-100 bg-red-50/80 px-5 py-3">
            <h2 className="text-sm font-semibold text-red-900">
              Critical — {critical.length} task{critical.length === 1 ? "" : "s"}
            </h2>
            <p className="text-xs text-red-800/80">Overdue or high priority due soon, assigned to you or your role.</p>
          </div>
          <div className="divide-y divide-slate-100">
            {critical.slice(0, 8).map((task) => (
              <TaskRow key={task.id} task={task} compact={prefs.compactList} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {allowedViews.map((view) => {
            const count =
              view.key === "assigned-to-me"
                ? stats?.assignedToMe ?? 0
                : view.key === "my-role"
                  ? stats?.myRole ?? 0
                  : view.key === "all"
                    ? stats?.allActive ?? 0
                    : stats?.past ?? 0;
            return (
              <StatChip
                key={view.key}
                label={view.label}
                count={count}
                active={resolvedScope === view.key}
                onClick={() => setScope(view.key)}
              />
            );
          })}
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tasks…"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#d4147a] lg:max-w-xs"
        />
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-900">
            {taskScopeLabel(resolvedScope)}
            <span className="ml-2 font-normal text-slate-500">({sortedTasks.length})</span>
          </h2>
          <p className="text-xs text-slate-500">
            Sorted by {prefs.sort === "due" ? "urgency" : prefs.sort === "priority" ? "priority" : "last update"}
          </p>
        </div>

        {sortedTasks.length ? (
          groupedTasks.map((group) => (
            <div key={group.key}>
              {prefs.groupBy !== "none" ? (
                <div className="border-b border-slate-100 bg-slate-50 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.label} ({group.tasks.length})
                </div>
              ) : null}
              <div className="divide-y divide-slate-100">
                {group.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} compact={prefs.compactList} />
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="px-5 py-12 text-center text-sm text-slate-500">
            {search.trim() ? "No tasks match your search." : "Nothing in this list — you are caught up."}
          </p>
        )}
      </div>
    </AppShell>
  );
}
