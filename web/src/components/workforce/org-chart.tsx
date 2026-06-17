"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import { useData } from "@/lib/data-store";
import {
  ORG_BUSINESS_AREAS,
  ORG_POSITION_STATUS_OPTIONS,
  orgPositionStatusLabel,
  type OrgPositionNode,
  type OrgPositionRecord,
} from "@/lib/org-structure";
import {
  actingAssignmentForPosition,
  activeAssignments,
  buildOrgTree,
  filterOrgPositions,
  isEmployeeOnLeaveToday,
  positionStatusTone,
  wouldCreateOrgCycle,
  type OrgChartFilters,
} from "@/lib/org-structure-tree";
import type { PositionAssignmentRecord } from "@/lib/org-structure";
import { useOrgStructure } from "@/lib/org-structure-store";
import { OrgReparentConfirmDialog, type PendingReparent } from "@/components/workforce/org-reparent-confirm";
import {
  OrgAssignPrimaryConfirmDialog,
  type PendingPrimaryAssign,
} from "@/components/workforce/org-assign-primary-confirm";
import {
  OrgAssignActingConfirmDialog,
  type PendingActingAssign,
} from "@/components/workforce/org-assign-acting-confirm";
import type { OrgChartDisplayItem, OrgChartDisplayRow } from "@/lib/org-chart-layout";
import { layoutOrgChildRows } from "@/lib/org-chart-layout";
import { checkHolderRoleAlignment, positionHolderAlignmentIssues } from "@/lib/org-position-role-alignment";
import {
  HolderRoleAlignmentAlert,
  useFixHolderRoleAlignment,
} from "@/components/workforce/holder-role-alignment-alert";

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
  locationLabel,
  roleLabel,
  holderRoleMisaligned,
  canEdit,
  selected,
  dragOver,
  isDragging,
  compact,
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
  locationLabel: string;
  roleLabel: string;
  holderRoleMisaligned?: boolean;
  canEdit: boolean;
  selected: boolean;
  dragOver: boolean;
  isDragging: boolean;
  compact?: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const tone = positionStatusTone(node.status);
  const isRoot = node.id === "pos-org-root";
  const isStructural = !isRoot && !node.primaryEmployeeId && node.children.length > 0;
  const showRoleBadge = roleLabel && roleLabel !== node.title;

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`w-full rounded-xl border text-left transition ${
        compact ? "px-2.5 py-2" : "px-3 py-2.5"
      } ${
        selected
          ? "border-indigo-300 bg-indigo-50/60 shadow-sm ring-2 ring-indigo-200"
          : dragOver
            ? "border-indigo-400 bg-indigo-50 ring-2 ring-indigo-300"
            : isDragging
              ? "border-slate-300 bg-slate-100 opacity-60"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start gap-2">
        <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`truncate font-semibold text-slate-900 ${compact ? "text-xs" : "text-sm"}`}>
                {node.title}
              </p>
              {showRoleBadge ? (
                <p className="truncate text-[10px] font-medium text-indigo-700">{roleLabel}</p>
              ) : null}
              {node.businessArea || node.department ? (
                <p className="truncate text-xs text-slate-500">{node.businessArea || node.department}</p>
              ) : null}
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${toneClasses[tone]}`}>
              {orgPositionStatusLabel(node.status)}
            </span>
          </div>
          {!isRoot ? (
            <p className={`mt-1 truncate text-slate-600 ${compact ? "text-[10px]" : "text-xs"}`}>
              {actingName ? (
                <span className="font-medium text-sky-800">Acting: {actingName}</span>
              ) : employeeName ? (
                <>
                  <span className={`font-medium ${onLeave ? "text-amber-800" : "text-slate-800"}`}>
                    {employeeName}
                    {onLeave ? " (on leave)" : ""}
                  </span>
                  {locationLabel ? <span className="text-slate-400"> · {locationLabel}</span> : null}
                  {holderRoleMisaligned ? (
                    <span className="text-amber-700"> · login role mismatch</span>
                  ) : null}
                </>
              ) : isStructural ? (
                <span className="text-slate-500">Governance body — see members below</span>
              ) : (
                <span className="italic text-amber-700">Vacant — escalates to parent</span>
              )}
            </p>
          ) : (
            <p className={`mt-1.5 text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>Root of the organisation tree</p>
          )}
        </button>
        {canEdit && !isRoot ? (
          <span
            draggable
            title="Drag to reparent"
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData("text/position-id", node.id);
              e.dataTransfer.effectAllowed = "move";
              onDragStart();
            }}
            className="mt-0.5 cursor-grab rounded p-1 text-slate-400 hover:bg-slate-100 active:cursor-grabbing"
            aria-label="Drag to change reporting line"
          >
            ⋮⋮
          </span>
        ) : null}
      </div>
    </div>
  );
}

function OrgChartChildRows({
  rows,
  renderItem,
}: {
  rows: OrgChartDisplayRow[];
  renderItem: (item: OrgChartDisplayItem) => React.ReactNode;
}) {
  return (
    <>
      {rows.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex w-full flex-col items-center">
          {rowIndex > 0 ? <div className="my-2 h-4 w-px bg-slate-300" aria-hidden /> : null}
          {row.layout === "row" && row.items.length > 1 ? (
            <div className="flex w-full flex-col items-center">
              <div className="h-4 w-px bg-slate-300" aria-hidden />
              <div className="h-px w-full max-w-4xl bg-slate-300" aria-hidden />
            </div>
          ) : rowIndex === 0 ? (
            <div className="my-2 h-4 w-px bg-slate-300" aria-hidden />
          ) : null}
          <ul
            className={
              row.layout === "row"
                ? "flex w-full max-w-6xl flex-row flex-wrap items-start justify-center gap-3"
                : "flex w-full max-w-sm flex-col items-stretch gap-2"
            }
          >
            {row.items.map((item) => {
              const key = item.kind === "position" ? item.node.id : item.groupKey;
              return (
                <li
                  key={key}
                  className={
                    row.layout === "row"
                      ? "flex min-w-[11rem] max-w-xs flex-1 flex-col items-center"
                      : "w-full"
                  }
                >
                  {row.layout === "row" && row.items.length > 1 ? (
                    <div className="mb-2 h-4 w-px bg-slate-300" aria-hidden />
                  ) : null}
                  {renderItem(item)}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

function renderOrgChildItem(
  item: OrgChartDisplayItem,
  ctx: {
    employeeNameById: Map<string, string>;
    employeesById: Map<string, import("@/lib/employee").EmployeeRecord>;
    locationNameById: Map<string, string>;
    roleNameById: Map<string, string>;
    users: AppUserRecord[];
    roles: AppRoleRecord[];
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
    compact?: boolean;
    hideChildren?: boolean;
  }
) {
  if (item.kind === "group") {
    return (
      <OrgSiblingGroup
        item={item}
        employeeNameById={ctx.employeeNameById}
        employeesById={ctx.employeesById}
        locationNameById={ctx.locationNameById}
        roleNameById={ctx.roleNameById}
        users={ctx.users}
        roles={ctx.roles}
        assignments={ctx.assignments}
        canEdit={ctx.canEdit}
        selectedId={ctx.selectedId}
        dragId={ctx.dragId}
        dropTargetId={ctx.dropTargetId}
        onSelect={ctx.onSelect}
        onDragStart={ctx.onDragStart}
        onDragOverTarget={ctx.onDragOverTarget}
        onDragLeaveTarget={ctx.onDragLeaveTarget}
        onDropOnTarget={ctx.onDropOnTarget}
      />
    );
  }

  return (
    <OrgTreeBranch
      node={item.node}
      employeeNameById={ctx.employeeNameById}
      employeesById={ctx.employeesById}
      locationNameById={ctx.locationNameById}
      roleNameById={ctx.roleNameById}
      users={ctx.users}
      roles={ctx.roles}
      assignments={ctx.assignments}
      canEdit={ctx.canEdit}
      selectedId={ctx.selectedId}
      dragId={ctx.dragId}
      dropTargetId={ctx.dropTargetId}
      onSelect={ctx.onSelect}
      onDragStart={ctx.onDragStart}
      onDragOverTarget={ctx.onDragOverTarget}
      onDragLeaveTarget={ctx.onDragLeaveTarget}
      onDropOnTarget={ctx.onDropOnTarget}
      compact={ctx.compact}
      hideChildren={ctx.hideChildren}
    />
  );
}

function OrgSiblingGroup({
  item,
  employeeNameById,
  employeesById,
  locationNameById,
  roleNameById,
  users,
  roles,
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
  item: Extract<OrgChartDisplayItem, { kind: "group" }>;
  employeeNameById: Map<string, string>;
  employeesById: Map<string, import("@/lib/employee").EmployeeRecord>;
  locationNameById: Map<string, string>;
  roleNameById: Map<string, string>;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
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
  const [expanded, setExpanded] = useState(false);
  const filledCount = item.nodes.filter((n) => n.primaryEmployeeId).length;
  const vacantCount = item.nodes.length - filledCount;

  return (
    <div className="w-full max-w-sm">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {item.title}
              <span className="ml-1.5 font-normal text-slate-500">× {item.nodes.length}</span>
            </p>
            <p className="text-[10px] text-slate-500">
              {filledCount} filled · {vacantCount} vacant
              {item.roleLabel ? ` · ${item.roleLabel}` : ""}
            </p>
          </div>
          <span className="shrink-0 text-xs text-indigo-700">{expanded ? "Collapse" : "Expand"}</span>
        </button>
        {expanded ? (
          <ul className="flex flex-col gap-1.5 border-t border-slate-100 p-2">
            {item.nodes.map((node) => (
              <OrgTreeBranch
                key={node.id}
                node={node}
                employeeNameById={employeeNameById}
                employeesById={employeesById}
                locationNameById={locationNameById}
                roleNameById={roleNameById}
                users={users}
                roles={roles}
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
                compact
                hideChildren
              />
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}

function OrgTreeBranch({
  node,
  employeeNameById,
  employeesById,
  locationNameById,
  roleNameById,
  users,
  roles,
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
  compact,
  hideChildren,
}: {
  node: OrgPositionNode;
  employeeNameById: Map<string, string>;
  employeesById: Map<string, import("@/lib/employee").EmployeeRecord>;
  locationNameById: Map<string, string>;
  roleNameById: Map<string, string>;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
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
  compact?: boolean;
  hideChildren?: boolean;
}) {
  const employeeName = node.primaryEmployeeId ? employeeNameById.get(node.primaryEmployeeId) ?? "Unknown" : "";
  const acting = actingAssignmentForPosition(activeAssignments(assignments), node.id);
  const actingName = acting?.employeeId ? employeeNameById.get(acting.employeeId) ?? "" : "";
  const primaryEmployee = node.primaryEmployeeId
    ? employeesById.get(node.primaryEmployeeId)
    : undefined;
  const onLeave = primaryEmployee ? isEmployeeOnLeaveToday(primaryEmployee) : false;
  const locationLabel = node.locationId ? locationNameById.get(node.locationId) ?? "" : node.site;
  const roleLabel = node.securityRoleId ? roleNameById.get(node.securityRoleId) ?? "" : "";
  const holderRoleMisaligned = Boolean(
    (node.primaryEmployeeId &&
      checkHolderRoleAlignment({
        employeeId: node.primaryEmployeeId,
        employeeName,
        requiredRoleId: node.securityRoleId,
        users,
        roles,
      })) ||
      (acting?.employeeId &&
        checkHolderRoleAlignment({
          employeeId: acting.employeeId,
          employeeName: actingName,
          requiredRoleId: node.securityRoleId,
          users,
          roles,
        }))
  );
  const childRows = useMemo(
    () => layoutOrgChildRows(node.children, roleNameById),
    [node.children, roleNameById]
  );

  const childCtx = {
    employeeNameById,
    employeesById,
    locationNameById,
    roleNameById,
    users,
    roles,
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
    compact,
    hideChildren,
  };

  const card = (
    <PositionCard
      node={node}
      employeeName={employeeName}
      actingName={actingName}
      onLeave={onLeave}
      locationLabel={locationLabel}
      roleLabel={roleLabel}
      holderRoleMisaligned={holderRoleMisaligned}
      canEdit={canEdit}
      selected={selectedId === node.id}
      dragOver={dropTargetId === node.id && dragId !== node.id}
      isDragging={dragId === node.id}
      compact={compact}
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
  );

  if (hideChildren) {
    return <div className="w-full">{card}</div>;
  }

  return (
    <div className="flex w-full flex-col items-center">
      <div className={compact ? "w-full" : "w-full max-w-sm"}>{card}</div>
      {node.children.length > 0 ? (
        <OrgChartChildRows
          rows={childRows}
          renderItem={(item) => renderOrgChildItem(item, { ...childCtx, hideChildren: false })}
        />
      ) : null}
    </div>
  );
}

export function OrgChart({
  selectedId,
  onSelect,
  filters,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filters?: OrgChartFilters;
}) {
  const { employees, locations } = useData();
  const { positions, assignments, reparentPosition } = useOrgStructure();
  const { canWindow, roles, users } = useAuth();
  const canEdit = canWindow("workforce-org-edit");

  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [pendingReparent, setPendingReparent] = useState<PendingReparent | null>(null);
  const [error, setError] = useState("");

  const employeeNameById = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const locationNameById = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const filteredPositions = useMemo(
    () => filterOrgPositions(positions, filters ?? {}),
    [positions, filters]
  );
  const tree = useMemo(() => buildOrgTree(filteredPositions), [filteredPositions]);

  function requestReparent(targetId: string) {
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
    setPendingReparent({ positionId: dragId, newParentId: targetId });
    setDragId(null);
  }

  function confirmReparent() {
    if (!pendingReparent) return;
    reparentPosition(pendingReparent.positionId, pendingReparent.newParentId);
    setPendingReparent(null);
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
          Use the grip (⋮⋮) to drag a position onto another, then confirm the reporting line change.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{error}</p>
      ) : null}
      <div className="max-h-[70vh] overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-6">
        <div className="mx-auto flex w-full min-w-[min(100%,48rem)] flex-col items-center gap-0">
          {tree.map((root) => (
            <OrgTreeBranch
              key={root.id}
              node={root}
              employeeNameById={employeeNameById}
              employeesById={employeesById}
              locationNameById={locationNameById}
              roleNameById={roleNameById}
              users={users}
              roles={roles}
              assignments={assignments}
              canEdit={canEdit}
              selectedId={selectedId}
              dragId={dragId}
              dropTargetId={dropTargetId}
              onSelect={onSelect}
              onDragStart={setDragId}
              onDragOverTarget={setDropTargetId}
              onDragLeaveTarget={() => setDropTargetId(null)}
              onDropOnTarget={requestReparent}
            />
          ))}
        </div>
      </div>
      {pendingReparent ? (
        <OrgReparentConfirmDialog
          pending={pendingReparent}
          positions={positions}
          onConfirm={confirmReparent}
          onCancel={() => setPendingReparent(null)}
        />
      ) : null}
    </div>
  );
}

export function OrgPositionEditor({
  positionId,
  onClose,
  onCreated,
  onSelectPosition,
}: {
  positionId: string | null;
  onClose: () => void;
  onCreated?: (id: string) => void;
  onSelectPosition?: (id: string) => void;
}) {
  const { employees, locations } = useData();
  const { positions, assignments, upsertPosition, assignPrimary, clearPrimary, assignActing, clearActing, addPosition } = useOrgStructure();
  const { canWindow, roles, users } = useAuth();
  const canEdit = canWindow("workforce-org-edit");
  const canManageAccess =
    canEdit || canWindow("employee-system-access") || canWindow("admin-roles");

  const activeRoles = useMemo(() => roles.filter((r) => r.active), [roles]);
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const { fix, fixingKey, fixedKeys, error: fixError, setError: setFixError } =
    useFixHolderRoleAlignment(employeesById);

  const [pendingPrimary, setPendingPrimary] = useState<PendingPrimaryAssign | null>(null);
  const [pendingActing, setPendingActing] = useState<PendingActingAssign | null>(null);

  const employeeNameById = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const actingEmployeeId =
    assignments.find(
      (a) => a.positionId === positionId && a.assignmentType === "acting" && !a.effectiveTo
    )?.employeeId ?? "";

  const position = positions.find((p) => p.id === positionId) ?? null;
  const linkedRole = position?.securityRoleId
    ? activeRoles.find((r) => r.id === position.securityRoleId)
    : undefined;
  const isRoot = position?.id === "pos-org-root";
  const parent = position?.parentPositionId ? positions.find((p) => p.id === position.parentPositionId) : undefined;
  const linkedLocation = position?.locationId ? locations.find((l) => l.id === position.locationId) : undefined;

  if (!position) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-500 shadow-sm">
        Select a position in the chart to view details.
      </div>
    );
  }

  const currentPosition = position;

  function patch(partial: Partial<OrgPositionRecord>) {
    upsertPosition({ ...currentPosition, ...partial });
  }

  function confirmPrimaryAssign() {
    if (!pendingPrimary) return;
    if (pendingPrimary.employeeId) {
      assignPrimary(pendingPrimary.positionId, pendingPrimary.employeeId);
    } else {
      clearPrimary(pendingPrimary.positionId);
    }
    setPendingPrimary(null);
  }

  function confirmActingAssign() {
    if (!pendingActing) return;
    if (pendingActing.employeeId) {
      assignActing(pendingActing.positionId, pendingActing.employeeId);
    } else {
      clearActing(pendingActing.positionId);
    }
    setPendingActing(null);
  }

  const { primary: primaryAlign, acting: actingAlign } = positionHolderAlignmentIssues(
    currentPosition,
    actingEmployeeId,
    users,
    roles,
    employeeNameById
  );

  function alignmentKey(issue: NonNullable<typeof primaryAlign>) {
    return `${issue.employeeId}:${issue.requiredRoleId ?? issue.kind}`;
  }

  function pendingAlignmentFor(employeeId: string) {
    const securityRoleId = currentPosition.securityRoleId;
    if (!employeeId || !securityRoleId) return null;
    return checkHolderRoleAlignment({
      employeeId,
      employeeName: employeeNameById.get(employeeId) ?? employeeId,
      requiredRoleId: securityRoleId,
      users,
      roles,
    });
  }

  const pendingPrimaryAlign = pendingPrimary?.employeeId
    ? pendingAlignmentFor(pendingPrimary.employeeId)
    : null;
  const pendingActingAlign = pendingActing?.employeeId
    ? pendingAlignmentFor(pendingActing.employeeId)
    : null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{position.title}</h3>
          {linkedRole ? (
            <p className="mt-0.5 text-xs font-medium text-indigo-700">Admin role: {linkedRole.name}</p>
          ) : null}
          <p className="mt-0.5 text-xs text-slate-500">{position.businessArea || position.department || "No business area"}</p>
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
        {parent ? (
          <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Reports to{" "}
            <button
              type="button"
              onClick={() => onSelectPosition?.(parent.id)}
              className="font-medium text-indigo-700 hover:text-indigo-900"
            >
              {parent.title}
            </button>
          </div>
        ) : null}

        {!isRoot ? (
          <label className="block text-xs font-medium text-slate-700">
            Security role (Admin → Roles)
            <select
              value={position.securityRoleId}
              disabled={!canEdit}
              onChange={(e) => {
                const securityRoleId = e.target.value;
                const role = activeRoles.find((r) => r.id === securityRoleId);
                patch({
                  securityRoleId,
                  title: position.title === linkedRole?.name || !position.title.trim() ? role?.name ?? position.title : position.title,
                });
              }}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">— Select role —</option>
              {activeRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-slate-500">
              Every position must map to a role from Admin → Roles. Title can add a site-specific label.
            </p>
          </label>
        ) : null}

        <label className="block text-xs font-medium text-slate-700">
          Position title
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
                if (id === position.primaryEmployeeId) return;
                setPendingPrimary({
                  positionId: position.id,
                  employeeId: id,
                  previousEmployeeId: position.primaryEmployeeId,
                });
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
              value={actingEmployeeId}
              disabled={!canEdit}
              onChange={(e) => {
                const id = e.target.value;
                if (id === actingEmployeeId) return;
                setPendingActing({
                  positionId: position.id,
                  employeeId: id,
                  previousEmployeeId: actingEmployeeId,
                });
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

        {!isRoot && (primaryAlign || actingAlign || fixError) ? (
          <div className="space-y-2">
            {fixError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900">{fixError}</p>
            ) : null}
            {primaryAlign ? (
              <HolderRoleAlignmentAlert
                issue={primaryAlign}
                label="Primary holder — login role"
                canFix={canManageAccess}
                fixing={fixingKey === alignmentKey(primaryAlign)}
                fixed={fixedKeys.has(alignmentKey(primaryAlign))}
                onFix={() => fix(primaryAlign).then(() => setFixError(""))}
              />
            ) : null}
            {actingAlign ? (
              <HolderRoleAlignmentAlert
                issue={actingAlign}
                label="Acting holder — login role"
                canFix={canManageAccess}
                fixing={fixingKey === alignmentKey(actingAlign)}
                fixed={fixedKeys.has(alignmentKey(actingAlign))}
                onFix={() => fix(actingAlign).then(() => setFixError(""))}
              />
            ) : null}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-700">
            Business area
            <select
              value={position.businessArea}
              disabled={!canEdit || isRoot}
              onChange={(e) => patch({ businessArea: e.target.value, department: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">— None —</option>
              {ORG_BUSINESS_AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-slate-700">
            Support location
            <select
              value={position.locationId}
              disabled={!canEdit}
              onChange={(e) => patch({ locationId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">— Not site-specific —</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-xs font-medium text-slate-700">
          Site label
          <input
            type="text"
            value={position.site}
            disabled={!canEdit}
            onChange={(e) => patch({ site: e.target.value })}
            placeholder="Optional label when no location is linked"
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
          />
        </label>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {position.primaryEmployeeId ? (
            <Link
              href={`/employees/${position.primaryEmployeeId}`}
              className="inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              View employee
            </Link>
          ) : null}
          {linkedLocation ? (
            <Link
              href={`/locations/${linkedLocation.id}`}
              className="inline-flex rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              View location
            </Link>
          ) : null}
        </div>

        {canEdit && !isRoot ? (
          <button
            type="button"
            onClick={() => {
              const child = addPosition({
                title: linkedRole?.name ?? "New position",
                securityRoleId: position.securityRoleId || activeRoles[0]?.id || "",
                department: position.department,
                businessArea: position.businessArea,
                locationId: position.locationId,
                parentPositionId: position.id,
                sortOrder: (position.sortOrder ?? 0) + 10,
                status: "vacant",
                site: position.site,
                costCentre: position.costCentre,
                primaryEmployeeId: "",
              });
              onCreated?.(child.id);
            }}
            className="w-full rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Add dependent position
          </button>
        ) : null}
      </div>
      {pendingPrimary ? (
        <OrgAssignPrimaryConfirmDialog
          pending={pendingPrimary}
          positions={positions}
          employeeNameById={employeeNameById}
          users={users}
          roles={roles}
          canFix={canManageAccess}
          onFixAlignment={
            pendingPrimaryAlign ? () => fix(pendingPrimaryAlign).then(() => setFixError("")) : undefined
          }
          fixingAlignment={pendingPrimaryAlign ? fixingKey === alignmentKey(pendingPrimaryAlign) : false}
          fixedAlignment={pendingPrimaryAlign ? fixedKeys.has(alignmentKey(pendingPrimaryAlign)) : false}
          onConfirm={confirmPrimaryAssign}
          onCancel={() => setPendingPrimary(null)}
        />
      ) : null}
      {pendingActing ? (
        <OrgAssignActingConfirmDialog
          pending={pendingActing}
          positions={positions}
          employeeNameById={employeeNameById}
          users={users}
          roles={roles}
          canFix={canManageAccess}
          onFixAlignment={
            pendingActingAlign ? () => fix(pendingActingAlign).then(() => setFixError("")) : undefined
          }
          fixingAlignment={pendingActingAlign ? fixingKey === alignmentKey(pendingActingAlign) : false}
          fixedAlignment={pendingActingAlign ? fixedKeys.has(alignmentKey(pendingActingAlign)) : false}
          onConfirm={confirmActingAssign}
          onCancel={() => setPendingActing(null)}
        />
      ) : null}
    </div>
  );
}
