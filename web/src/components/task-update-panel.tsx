"use client";

import { useState } from "react";
import { displayName } from "@/lib/access/types";
import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import type { TaskRecord } from "@/lib/task";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-[#d4147a] focus:ring-2 focus:ring-[#d4147a]/20";

export type TaskUpdatePayload = {
  note: string;
  reassign?: {
    assignmentType: "user" | "role";
    assigneeUserId: string;
    assigneeRoleId: string;
  };
};

type TaskUpdatePanelProps = {
  task: TaskRecord;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
  canReassign: boolean;
  assigneeLabel: string;
  onSubmit: (payload: TaskUpdatePayload) => void;
  onCancel: () => void;
};

export function TaskUpdatePanel({
  task,
  users,
  roles,
  canReassign,
  assigneeLabel,
  onSubmit,
  onCancel,
}: TaskUpdatePanelProps) {
  const [note, setNote] = useState("");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"user" | "role">(task.assignmentType);
  const [assigneeUserId, setAssigneeUserId] = useState(task.assigneeUserId);
  const [assigneeRoleId, setAssigneeRoleId] = useState(task.assigneeRoleId);

  function handleSubmit() {
    const trimmed = note.trim();
    const wantsReassign =
      reassignOpen &&
      ((assignmentType === "user" && assigneeUserId) || (assignmentType === "role" && assigneeRoleId));
    const reassigned =
      wantsReassign &&
      (assignmentType !== task.assignmentType ||
        (assignmentType === "user" && assigneeUserId !== task.assigneeUserId) ||
        (assignmentType === "role" && assigneeRoleId !== task.assigneeRoleId));

    if (!trimmed && !reassigned) return;

    onSubmit({
      note: trimmed,
      reassign: reassigned
        ? { assignmentType, assigneeUserId, assigneeRoleId }
        : undefined,
    });
    setNote("");
    setReassignOpen(false);
  }

  return (
    <div className="w-full space-y-3">
      <div>
        <label htmlFor="task-update-note" className="mb-1.5 block text-xs font-medium text-slate-600">
          Update
        </label>
        <textarea
          id="task-update-note"
          className={`${inputClass} min-h-[88px] resize-y`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What changed? Add a note for the activity log…"
          autoFocus
        />
      </div>

      {canReassign ? (
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 p-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={reassignOpen}
              onChange={(e) => setReassignOpen(e.target.checked)}
              className="rounded border-slate-300"
            />
            Reassign task
            {!reassignOpen ? <span className="text-slate-500">(currently {assigneeLabel})</span> : null}
          </label>
          {reassignOpen ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                className={inputClass}
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value as "user" | "role")}
              >
                <option value="user">User</option>
                <option value="role">Role</option>
              </select>
              {assignmentType === "user" ? (
                <select className={inputClass} value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)}>
                  <option value="">Select user…</option>
                  {users.filter((u) => u.active).map((u) => (
                    <option key={u.id} value={u.id}>
                      {displayName(u)}
                    </option>
                  ))}
                </select>
              ) : (
                <select className={inputClass} value={assigneeRoleId} onChange={(e) => setAssigneeRoleId(e.target.value)}>
                  <option value="">Select role…</option>
                  {roles.filter((r) => r.active).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          Save update
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
