"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { canCreateTaskType, canSeeTaskType } from "@/lib/task-type-access";
import { ROSTERING_COMMUNICATION_TASK_TYPE_ID } from "@/lib/task-type";
import {
  formatDayHeading,
  formatShiftTimeRange,
  type RosterShiftRecord,
} from "@/lib/roster-shift";
import type { ClientRecord } from "@/lib/client";
import type { LocationRecord } from "@/lib/location";
import type { TaskRecord } from "@/lib/task";

type RosteringCommunicationCategory =
  | "Shift Change"
  | "Availability"
  | "Leave"
  | "Open Shift"
  | "General Enquiry";

const CATEGORIES: RosteringCommunicationCategory[] = [
  "Shift Change",
  "Availability",
  "Leave",
  "Open Shift",
  "General Enquiry",
];

const ROSTERING_OFFICER_ROLE_ID = "role-rostering-officer";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

function shiftLabel(
  shift: RosterShiftRecord,
  clients: ClientRecord[],
  locations: LocationRecord[]
): string {
  const client =
    clients.find((c) => c.id === shift.clientId)?.preferredName ||
    clients.find((c) => c.id === shift.clientId)?.name ||
    "No client linked";
  const location = locations.find((l) => l.id === shift.locationId)?.name || "No location linked";
  return `${formatDayHeading(shift.shiftDate)} ${formatShiftTimeRange(shift.startTime, shift.endTime)} · ${client} · ${location}`;
}

function latestUpdateAt(task: TaskRecord): string {
  return task.updates.reduce((latest, update) => (update.at > latest ? update.at : latest), "");
}

function formatDateTime(iso: string): string {
  if (!iso) return "Not recorded";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusClass(status: TaskRecord["status"]): string {
  if (status === "Completed") return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  if (status === "Cancelled") return "bg-slate-100 text-slate-600 ring-slate-200";
  if (status === "In progress") return "bg-amber-50 text-amber-900 ring-amber-200";
  return "bg-sky-50 text-sky-800 ring-sky-200";
}

export function RosteringCommunicationPanel({
  employeeId,
  employeeName,
  relatedShifts,
  clients,
  locations,
}: {
  employeeId: string;
  employeeName: string;
  relatedShifts: RosterShiftRecord[];
  clients: ClientRecord[];
  locations: LocationRecord[];
}) {
  const { session, roles } = useAuth();
  const { tasks, addTask } = useData();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<RosteringCommunicationCategory>("General Enquiry");
  const [priority, setPriority] = useState<"Normal" | "Urgent">("Normal");
  const [relatedShiftId, setRelatedShiftId] = useState("");
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rosteringRoleName =
    roles.find((role) => role.id === ROSTERING_OFFICER_ROLE_ID)?.name ?? "Rostering Officer";

  const shiftOptions = useMemo(() => {
    const byId = new Map<string, RosterShiftRecord>();
    for (const shift of relatedShifts) byId.set(shift.id, shift);
    return [...byId.values()]
      .sort((a, b) => `${a.shiftDate}${a.startTime}`.localeCompare(`${b.shiftDate}${b.startTime}`))
      .map((shift) => ({ shift, label: shiftLabel(shift, clients, locations) }));
  }, [relatedShifts, clients, locations]);

  const communications = useMemo(() => {
    if (!session) return [];
    const rosteringTasks = tasks.filter((task) => task.taskTypeId === ROSTERING_COMMUNICATION_TASK_TYPE_ID);
    return rosteringTasks
      .filter(
        (task) =>
          canSeeTaskType(session, task.taskTypeId) &&
          (task.createdByUserId === session.userId ||
            (employeeId && task.entityType === "employee" && task.entityId === employeeId))
      )
      .sort((a, b) => latestUpdateAt(b).localeCompare(latestUpdateAt(a)));
  }, [tasks, session, employeeId]);

  function resetForm() {
    setSubject("");
    setMessage("");
    setCategory("General Enquiry");
    setPriority("Normal");
    setRelatedShiftId("");
    setError("");
  }

  function handleSubmit() {
    if (!session || submitting) return;
    if (!canCreateTaskType(session, ROSTERING_COMMUNICATION_TASK_TYPE_ID)) {
      setError("Your role cannot create rostering communication tasks. Ask your administrator for access.");
      return;
    }
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();
    if (!trimmedSubject || !trimmedMessage) {
      setError("Enter a subject and message before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const related = shiftOptions.find((option) => option.shift.id === relatedShiftId);
      const description = [
        `Category: ${category}`,
        `Priority: ${priority}`,
        `From: ${employeeName || session.displayName}`,
        related ? `Related shift: ${related.label}` : "Related shift: None",
        "",
        trimmedMessage,
      ].join("\n");

      const task = addTask(
        {
          title: `Rostering: ${trimmedSubject}`,
          description,
          status: "Open",
          taskTypeId: ROSTERING_COMMUNICATION_TASK_TYPE_ID,
          priority: priority === "Urgent" ? "High" : "Normal",
          dueDate: "",
          assignmentType: "role",
          assigneeUserId: "",
          assigneeRoleId: ROSTERING_OFFICER_ROLE_ID,
          entityType: related ? "roster-shift" : "employee",
          entityId: related?.shift.id ?? employeeId,
          entityLabel: related?.label ?? employeeName,
          createdByUserId: session.userId,
          createdBy: session.displayName,
          updatedBy: session.displayName,
          completedBy: "",
          completedAt: "",
          resolutionNotes: "",
        },
        { assigneeDisplayName: rosteringRoleName }
      );

      setOpen(false);
      resetForm();
      setConfirmation(`Sent to ${rosteringRoleName}. Reference ${task.documentNo}.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mb-5 rounded-2xl border border-pink-100 bg-gradient-to-br from-pink-50 to-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#b51266]">Rostering support</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">Contact Rostering</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Send a question or shift concern to the rostering team. Your message becomes a task conversation and stays
            visible here until it is resolved.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setOpen(true);
          }}
          className="rounded-xl bg-[#d4147a] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#b51266]"
        >
          Contact Rostering
        </button>
      </div>

      {confirmation ? (
        <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950">
          {confirmation}
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-semibold text-slate-900">Rostering communication history</h3>
          <span className="text-xs text-slate-500">{communications.length} total</span>
        </div>
        {!communications.length ? (
          <p className="px-4 py-6 text-sm text-slate-600">No rostering communications yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {communications.map((task) => {
              const created = task.updates.find((update) => update.action === "created")?.at;
              const lastUpdated = latestUpdateAt(task);
              const assignedTo =
                task.assignmentType === "role"
                  ? roles.find((role) => role.id === task.assigneeRoleId)?.name ?? task.assigneeRoleId
                  : task.assigneeUserId || "User";
              return (
                <li key={task.id} className="px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Link href={`/tasks/${task.id}`} className="font-medium text-[#b51266] hover:underline">
                        {task.title.replace(/^Rostering:\s*/i, "")}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">
                        Created {formatDateTime(created ?? "")} · Last updated {formatDateTime(lastUpdated)}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">
                        Assigned to {assignedTo}
                        {task.entityType === "roster-shift" && task.entityLabel ? ` · ${task.entityLabel}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${statusClass(task.status)}`}>
                        {task.status}
                      </span>
                      {task.priority === "High" ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-800 ring-1 ring-rose-200 ring-inset">
                          Urgent
                        </span>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Contact Rostering</h2>
                <p className="mt-1 text-sm text-slate-600">Create a Rostering Communication task.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-950">
                {error}
              </p>
            ) : null}

            <div className="mt-5 grid gap-4">
              <label className="block text-sm font-medium text-slate-700">
                Subject
                <input className={`${inputClass} mt-1`} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Message
                <textarea
                  className={`${inputClass} mt-1 min-h-32 resize-y`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Category
                  <select
                    className={`${inputClass} mt-1`}
                    value={category}
                    onChange={(e) => setCategory(e.target.value as RosteringCommunicationCategory)}
                  >
                    {CATEGORIES.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Priority
                  <select
                    className={`${inputClass} mt-1`}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as "Normal" | "Urgent")}
                  >
                    <option value="Normal">Normal</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </label>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Related shift (optional)
                <select
                  className={`${inputClass} mt-1`}
                  value={relatedShiftId}
                  onChange={(e) => setRelatedShiftId(e.target.value)}
                >
                  <option value="">No related shift</option>
                  {shiftOptions.map(({ shift, label }) => (
                    <option key={shift.id} value={shift.id}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Attachments: coming later.
              </div>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-[#d4147a] px-4 py-2 text-sm font-semibold text-white hover:bg-[#b51266] disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
