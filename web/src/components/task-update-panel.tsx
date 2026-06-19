"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
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
  initialNote?: string;
  onSubmit: (payload: TaskUpdatePayload) => void;
  onCancel: () => void;
};

export function TaskUpdatePanel({
  task,
  users,
  roles,
  canReassign,
  assigneeLabel,
  initialNote = "",
  onSubmit,
  onCancel,
}: TaskUpdatePanelProps) {
  const [note, setNote] = useState(initialNote);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [assignmentType, setAssignmentType] = useState<"user" | "role">(task.assignmentType);
  const [assigneeUserId, setAssigneeUserId] = useState(task.assigneeUserId);
  const [assigneeRoleId, setAssigneeRoleId] = useState(task.assigneeRoleId);
  const [userQuery, setUserQuery] = useState("");
  const [roleQuery, setRoleQuery] = useState("");
  const [highlightedUserIndex, setHighlightedUserIndex] = useState(0);
  const [highlightedRoleIndex, setHighlightedRoleIndex] = useState(0);
  const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);
  const activeRoles = useMemo(() => roles.filter((r) => r.active), [roles]);
  const selectedUser = useMemo(
    () => activeUsers.find((u) => u.id === assigneeUserId),
    [activeUsers, assigneeUserId]
  );
  const selectedRole = useMemo(
    () => activeRoles.find((r) => r.id === assigneeRoleId),
    [activeRoles, assigneeRoleId]
  );
  const filteredUsers = useMemo(() => {
    const q = userQuery.trim().toLowerCase();
    if (!q) return [];
    return activeUsers
      .filter((u) => {
        const name = displayName(u).toLowerCase();
        return name.includes(q) || u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [activeUsers, userQuery]);
  const filteredRoles = useMemo(() => {
    const q = roleQuery.trim().toLowerCase();
    if (!q) return [];
    return activeRoles.filter((r) => r.name.toLowerCase().includes(q) || r.roleKey.toLowerCase().includes(q)).slice(0, 8);
  }, [activeRoles, roleQuery]);

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

  function onUserSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!filteredUsers.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedUserIndex((prev) => (prev + 1) % filteredUsers.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedUserIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const picked = filteredUsers[Math.max(0, highlightedUserIndex)];
      if (!picked) return;
      setAssigneeUserId(picked.id);
      setUserQuery("");
      setHighlightedUserIndex(0);
    }
  }

  function onRoleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!filteredRoles.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedRoleIndex((prev) => (prev + 1) % filteredRoles.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedRoleIndex((prev) => (prev - 1 + filteredRoles.length) % filteredRoles.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const picked = filteredRoles[Math.max(0, highlightedRoleIndex)];
      if (!picked) return;
      setAssigneeRoleId(picked.id);
      setRoleQuery("");
      setHighlightedRoleIndex(0);
    }
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
                onChange={(e) => {
                  const next = e.target.value as "user" | "role";
                  setAssignmentType(next);
                  if (next === "user") {
                    setRoleQuery("");
                    setHighlightedUserIndex(0);
                  } else {
                    setUserQuery("");
                    setHighlightedRoleIndex(0);
                  }
                }}
              >
                <option value="user">User</option>
                <option value="role">Role</option>
              </select>
              {assignmentType === "user" ? (
                <div className="space-y-2">
                  {selectedUser ? (
                    <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-800">
                      Selected: {displayName(selectedUser)}
                    </p>
                  ) : null}
                  <input
                    type="search"
                    className={inputClass}
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setHighlightedUserIndex(0);
                    }}
                    onKeyDown={onUserSearchKeyDown}
                    placeholder="Search user by name, username or email"
                  />
                  {userQuery.trim() ? (
                    <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">
                      {filteredUsers.length ? (
                        filteredUsers.map((u, idx) => {
                          const highlighted = idx === highlightedUserIndex;
                          const active = u.id === assigneeUserId;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                setAssigneeUserId(u.id);
                                setUserQuery("");
                                setHighlightedUserIndex(0);
                              }}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                                active
                                  ? "bg-[#fdf2f8] text-[#9d174d]"
                                  : highlighted
                                    ? "bg-slate-100 text-slate-900"
                                    : "hover:bg-slate-50"
                              }`}
                            >
                              <span>{displayName(u)}</span>
                              <span className="text-xs text-slate-500">{u.username}</span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-2 text-sm text-slate-500">No users found.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Type to search users.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedRole ? (
                    <p className="rounded-md border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs text-violet-800">
                      Selected: {selectedRole.name}
                    </p>
                  ) : null}
                  <input
                    type="search"
                    className={inputClass}
                    value={roleQuery}
                    onChange={(e) => {
                      setRoleQuery(e.target.value);
                      setHighlightedRoleIndex(0);
                    }}
                    onKeyDown={onRoleSearchKeyDown}
                    placeholder="Search role"
                  />
                  {roleQuery.trim() ? (
                    <div className="max-h-40 overflow-auto rounded-lg border border-slate-200 bg-white">
                      {filteredRoles.length ? (
                        filteredRoles.map((r, idx) => {
                          const highlighted = idx === highlightedRoleIndex;
                          const active = r.id === assigneeRoleId;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => {
                                setAssigneeRoleId(r.id);
                                setRoleQuery("");
                                setHighlightedRoleIndex(0);
                              }}
                              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                                active
                                  ? "bg-violet-50 text-violet-900"
                                  : highlighted
                                    ? "bg-slate-100 text-slate-900"
                                    : "hover:bg-slate-50"
                              }`}
                            >
                              <span>{r.name}</span>
                              <span className="text-xs text-slate-500">{r.roleKey}</span>
                            </button>
                          );
                        })
                      ) : (
                        <p className="px-3 py-2 text-sm text-slate-500">No roles found.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Type to search roles.</p>
                  )}
                </div>
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
