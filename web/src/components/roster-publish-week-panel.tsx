"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { previewPublishWeek } from "@/lib/roster-publish-week";
import { buildRosterPublishNotifications } from "@/lib/roster-publish-notifications";

export function RosterPublishWeekPanel({ weekStart }: { weekStart: string }) {
  const { rosterShifts, clients, employees, tasks, addRecurringRosterShifts, addTask } = useData();
  const { session, canWriteWindow, users } = useAuth();
  const canPublish = canWriteWindow("rostering");
  const actor = session?.displayName || "SuperUser";
  const actorUserId = session?.userId || "user-superuser";

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const preview = useMemo(
    () => previewPublishWeek(weekStart, rosterShifts, actor, { clients, employees }),
    [weekStart, rosterShifts, actor, clients, employees]
  );

  if (!canPublish) return null;

  const hasDraftWithWorker = preview.ready.length + preview.blocked.length > 0;
  if (!hasDraftWithWorker) return null;

  function handlePublish() {
    setError("");
    setMessage("");
    if (!preview.ready.length) {
      setError("No staffed draft shifts ready to publish — resolve conflicts, qualification, or assign workers first.");
      return;
    }
    const saveError = addRecurringRosterShifts(preview.ready);
    if (saveError) {
      setError(saveError);
      return;
    }

    const notificationPlan = buildRosterPublishNotifications({
      published: preview.ready,
      previous: rosterShifts,
      clients,
      employees,
      users,
      existingTasks: tasks,
      actorUserId,
      actorName: actor,
    });
    for (const partial of notificationPlan.tasks) {
      addTask(partial, {
        assigneeDisplayName:
          partial.assignmentType === "user"
            ? employees.find((e) => e.id === preview.ready.find((s) => s.id === partial.entityId)?.employeeId)?.name
            : "Support worker",
      });
    }

    const blockedNote = preview.blocked.length
      ? ` ${preview.blocked.length} shift${preview.blocked.length === 1 ? "" : "s"} blocked by conflicts or qualification.`
      : "";
    const notifyNote = notificationPlan.workerCount
      ? ` ${notificationPlan.workerCount} worker${notificationPlan.workerCount === 1 ? "" : "s"} notified via Tasks.`
      : "";
    setMessage(
      `Published ${preview.ready.length} shift${preview.ready.length === 1 ? "" : "s"} for this week.${blockedNote}${notifyNote}`
    );
  }

  return (
    <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Publish week</h2>
          <p className="mt-1 text-sm text-slate-600">
            Publish staffed draft shifts for this week. Double-booking, client overlap, and missing or expired mandatory
            credentials block publish. Workers receive a task in My workplace when shifts are published.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            {preview.ready.length} ready · {preview.blocked.length} blocked · {preview.skippedVacant} vacant draft
            {preview.skippedNotDraft ? ` · ${preview.skippedNotDraft} already published` : ""}
          </p>
        </div>
        <button
          type="button"
          disabled={!preview.ready.length}
          onClick={handlePublish}
          className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#b51266] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Publish {preview.ready.length} shift{preview.ready.length === 1 ? "" : "s"}
        </button>
      </div>

      {preview.blocked.length ? (
        <ul className="mt-3 space-y-1 text-sm text-rose-950">
          {preview.blocked.slice(0, 5).map((row) => (
            <li key={row.id} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
              <span className="font-medium">{row.shiftRef}</span> — {row.message}
            </li>
          ))}
          {preview.blocked.length > 5 ? (
            <li className="text-xs text-rose-800">+ {preview.blocked.length - 5} more blocked shifts</li>
          ) : null}
        </ul>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">{error}</p>
      ) : null}
      {message ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {message}{" "}
          <Link href="/my/shifts" className="font-medium underline">
            My shifts
          </Link>
        </p>
      ) : null}
    </section>
  );
}
