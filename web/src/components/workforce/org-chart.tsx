"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  ORG_POSITION_STATUS_OPTIONS,
  orgPositionStatusLabel,
  type OrgPositionNode,
  type OrgPositionRecord,
} from "@/lib/org-structure";
import {
  actingAssignmentForPosition,
  activeAssignments,
  buildOrgTree,
  isEmployeeOnLeaveToday,
  positionStatusTone,
  wouldCreateOrgCycle,
} from "@/lib/org-structure-tree";
import type { PositionAssignmentRecord } from "@/lib/org-structure";
import { useOrgStructure } from "@/lib/org-structure-store";

const toneClasses = {
  emerald: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  sky: "bg-sky-50 text-sky-800 ring-sky-200",
  zinc: "bg-slate-100 text-slate-700 ring-slate-200",
} as const;

function PositionCard({
  node,
  employeeName,
  actingName,
  onLeave,
  canEdit,
  selected,
  dragOver,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  node: OrgPositionNode;
  employeeName: string;
  actingName: string;
  onLeave: boolean;
  canEdit: boolean;
  selected: boolean;
  dragOver: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const tone = positionStatusTone(node.status);
  const isRoot = node.id === "pos-org-root";

  return (
    <button
      type="button"
      draggable={canEdit && !isRoot}
      onClick={onSelect}
      onDragStart={(e) => {
        if (!canEdit || isRoot) return;
        e.dataTransfer.setData("text/position-id", node.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
        selected
          ? "border-indigo-300 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-200"
          : dragOver
            ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300"
            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      } ${canEdit && !isRoot ? "cursor-grab active:cursor-grabbing" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{node.title}</p>
          {node.department ? <p className="truncate text-xs text-slate-500">{node.department}</p> : null}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${toneClasses[tone]}`}>
          {orgPositionStatusLabel(node.status)}
        </span>
      </div>
      {!isRoot ? (
        <p className="mt-1.5 truncate text-xs text-slate-600">
          {actingName ? (
            <span className="font-medium text-sky-800">Acting: {actingName}</span>
          ) : employeeName ? (
            <>
              <span className={`font-medium ${onLeave ? "text-amber-800" : "text-slate-800"}`}>
                {employeeName}
                {onLeave ? " (on leave)" : ""}
              </span>
              {node.site ? <span className="text-slate-400"> · {node.site}</span> : null}
            </>
          ) : (
            <span className="italic text-amber-700">Vacant — escalates to parent</span>
          )}
        </p>
      ) : (
        <p className="mt-1.5 text-xs text-slate-500">Root of the organisation tree</p>
      )}
    </button>
  );
}

function OrgTreeBranch({
  node,
  employeeNameById,
  employeesById,
  assignments,
  canEdit,
  selectedId,
  dragId,
  dropTargetId,
  onSelect,
  onDragStart,
  onDragOverTarget,
  onDragLeaveTarget,
  onDropOnTarget,
}: {
  node: OrgPositionNode;
  employeeNameById: Map<string, string>;
  employeesById: Map<string, import("@/lib/employee").EmployeeRecord>;
  assignments: PositionAssignmentRecord[];
  canEdit: boolean;
  selectedId: string | null;
  dragId: string | null;
  dropTargetId: string | null;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOverTarget: (id: string) => void;
  onDragLeaveTarget: () => void;
  onDropOnTarget: (targetId: string) => void;
}) {
  const employeeName = node.primaryEmployeeId ? employeeNameById.get(node.primaryEmployeeId) ?? "Unknown" : "";
  const acting = actingAssignmentForPosition(activeAssignments(assignments), node.id);
  const actingName = acting?.employeeId ? employeeNameById.get(acting.employeeId) ?? "" : "";
  const primaryEmployee = node.primaryEmployeeId
    ? employeesById.get(node.primaryEmployeeId)
    : undefined;
  const onLeave = primaryEmployee ? isEmployeeOnLeaveToday(primaryEmployee) : false;

  return (
    <li className="flex flex-col items-center">
      <div className="w-56">
        <PositionCard
          node={node}
          employeeName={employeeName}
          actingName={actingName}
          onLeave={onLeave}
          canEdit={canEdit}
          selected={selectedId === node.id}
          dragOver={dropTargetId === node.id && dragId !== node.id}
          onSelect={() => onSelect(node.id)}
          onDragStart={() => onDragStart(node.id)}
          onDragOver={(e) => {
            if (!canEdit || !dragId || dragId === node.id) return;
            e.preventDefault();
            onDragOverTarget(node.id);
          }}
          onDragLeave={onDragLeaveTarget}
          onDrop={(e) => {
            e.preventDefault();
            onDropOnTarget(node.id);
          }}
        />
      </div>
      {node.children.length > 0 ? (
        <>
          <div className="my-2 h-4 w-px bg-slate-300" />
          <ul className="flex flex-wrap items-start justify-center gap-6">
            {node.children.map((child) => (
              <OrgTreeBranch
                key={child.id}
                node={child}
                employeeNameById={employeeNameById}
                employeesById={employeesById}
                assignments={assignments}
                canEdit={canEdit}
                selectedId={selectedId}
                dragId={dragId}
                dropTargetId={dropTargetId}
                onSelect={onSelect}
                onDragStart={onDragStart}
                onDragOverTarget={onDragOverTarget}
                onDragLeaveTarget={onDragLeaveTarget}
                onDropOnTarget={onDropOnTarget}
              />
            ))}
          </ul>
        </>
      ) : null}
    </li>
  );
}

export function OrgChart({
  selectedId,
  onSelect,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { employees } = useData();
  const { positions, assignments, reparentPosition } = useOrgStructure();
  const { canWindow } = useAuth();
  const canEdit = canWindow("workforce-org-edit");

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const employeeNameById = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const tree = useMemo(() => buildOrgTree(positions), [positions]);

  function handleDrop(targetId: string) {
    setDropTargetId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    if (wouldCreateOrgCycle(positions, dragId, targetId)) {
      setError("Cannot move a position under one of its own descendants.");
      setDragId(null);
      return;
    }
    setError("");
    reparentPosition(dragId, targetId);
    setDragId(null);
  }

  if (!tree.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-600">
        No organisation positions yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {canEdit ? (
        <p className="text-xs text-slate-500">
          Drag a position card onto another to change reporting lines. Vacant roles escalate to the parent holder.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{error}</p>
      ) : null}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
        <ul className="flex min-w-max flex-col items-center gap-0">
          {tree.map((root) => (
            <OrgTreeBranch
              key={root.id}
              node={root}
              employeeNameById={employeeNameById}
              employeesById={employeesById}
              assignments={assignments}
              canEdit={canEdit}
              selectedId={selectedId}
              dragId={dragId}
              dropTargetId={dropTargetId}
              onSelect={onSelect}
              onDragStart={setDragId}
              onDragOverTarget={setDropTargetId}
              onDragLeaveTarget={() => setDropTargetId(null)}
              onDropOnTarget={handleDrop}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function OrgPositionEditor({
  positionId,
  onClose,
  onCreated,
}: {
  positionId: string | null;
  onClose: () => void;
  onCreated?: (id: string) => void;
}) {
  const { employees } = useData();
  const { positions, assignments, upsertPosition, assignPrimary, clearPrimary, assignActing, clearActing, addPosition } = useOrgStructure();
  const { canWindow } = useAuth();
  const canEdit = canWindow("workforce-org-edit");

  const position = positions.find((p) => p.id === positionId) ?? null;
  const isRoot = position?.id === "pos-org-root";

  if (!position) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Select a position in the chart to view details.
      </div>
    );
  }

  function patch(partial: Partial<OrgPositionRecord>) {
    upsertPosition({ ...position!, ...partial });
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{position.title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{position.department || "No department"}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="space-y-4 p-5">
        <label className="block text-xs font-medium text-slate-700">
          Title
          <input
            type="text"
            value={position.title}
            disabled={!canEdit || isRoot}
            onChange={(e) => patch({ title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </label>

        <label className="block text-xs font-medium text-slate-700">
          Status
          <select
            value={position.status}
            disabled={!canEdit || isRoot}
            onChange={(e) => patch({ status: e.target.value as OrgPositionRecord["status"] })}
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          >
            {ORG_POSITION_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        {!isRoot ? (
          <label className="block text-xs font-medium text-slate-700">
            Primary holder
            <select
              value={position.primaryEmployeeId}
              disabled={!canEdit}
              onChange={(e) => {
                const id = e.target.value;
                if (id) assignPrimary(position.id, id);
                else clearPrimary(position.id);
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">— Vacant —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        {!isRoot ? (
          <label className="block text-xs font-medium text-slate-700">
            Acting holder
            <select
              value={
                assignments.find(
                  (a) => a.positionId === position.id && a.assignmentType === "acting" && !a.effectiveTo
                )?.employeeId ?? ""
              }
              disabled={!canEdit}
              onChange={(e) => {
                const id = e.target.value;
                if (id) assignActing(position.id, id);
                else clearActing(position.id);
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">— None —</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-700">
            Department
            <input
              type="text"
              value={position.department}
              disabled={!canEdit || isRoot}
              onChange={(e) => patch({ department: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Site
            <input
              type="text"
              value={position.site}
              disabled={!canEdit}
              onChange={(e) => patch({ site: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </label>
        </div>

        {position.primaryEmployeeId ? (
          <Link
            href={`/employees/${position.primaryEmployeeId}`}
            className="inline-flex text-xs font-medium text-indigo-700 hover:text-indigo-900"
          >
            Open employee record →
          </Link>
        ) : null}

        {canEdit && !isRoot ? (
          <button
            type="button"
            onClick={() => {
              const child = addPosition({
                title: "New position",
                department: position.department,
                parentPositionId: position.id,
                sortOrder: (position.sortOrder ?? 0) + 10,
                status: "vacant",
                site: "",
                costCentre: "",
                primaryEmployeeId: "",
              });
              onCreated?.(child.id);
            }}
            className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Add child position
          </button>
        ) : null}
      </div>
    </div>
  );
}
