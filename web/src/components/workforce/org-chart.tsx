"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import {
  ORG_BUSINESS_AREAS,
  ORG_POSITION_STATUS_OPTIONS,
  orgPositionStatusLabel,
  type OrgPositionRecord,
} from "@/lib/org-structure";
import {
  applyOrgChartLens,
  filterOrgPositions,
  positionStatusTone,
  wouldCreateOrgCycle,
  type OrgChartFilters,
  type OrgChartLens,
} from "@/lib/org-structure-tree";
import { useOrgChartTierConfig } from "@/lib/org-chart-tier-config-store";
import { OrgChartTierView } from "@/components/workforce/org-chart-tier-view";
import { OrgChartDottedLines } from "@/components/workforce/org-chart-dotted-lines";
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
  position,
  employeeName,
  actingName,
  onLeave,
  locationLabel,
  roleLabel,
  holderRoleMisaligned,
  dottedTargets,
  canEdit,
  selected,
  dragOver,
  isDragging,
  compact,
  isStructural,
  onSelect,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  position: OrgPositionRecord;
  employeeName: string;
  actingName: string;
  onLeave: boolean;
  locationLabel: string;
  roleLabel: string;
  holderRoleMisaligned?: boolean;
  dottedTargets?: { title: string; label: string }[];
  canEdit: boolean;
  selected: boolean;
  dragOver: boolean;
  isDragging: boolean;
  compact?: boolean;
  isStructural?: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  const tone = positionStatusTone(position.status);
  const isRoot = position.id === "pos-org-root";
  const structural = isStructural ?? (!isRoot && !position.primaryEmployeeId && position.id === "pos-board");
  const showRoleBadge = roleLabel && roleLabel !== position.title;

  return (
    <div
      data-org-position-id={position.id}
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
                {position.title}
              </p>
              {showRoleBadge ? (
                <p className="truncate text-[10px] font-medium text-indigo-700">{roleLabel}</p>
              ) : null}
              {position.businessArea || position.department ? (
                <p className="truncate text-xs text-slate-500">{position.businessArea || position.department}</p>
              ) : null}
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${toneClasses[tone]}`}>
              {orgPositionStatusLabel(position.status)}
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
              ) : structural ? (
                <span className="text-slate-500">Governance body — see members below</span>
              ) : (
                <span className="italic text-amber-700">Vacant — escalates to parent</span>
              )}
            </p>
          ) : (
            <p className={`mt-1.5 text-slate-500 ${compact ? "text-[10px]" : "text-xs"}`}>Root of the organisation tree</p>
          )}
          {dottedTargets?.length ? (
            <div className="mt-1 space-y-0.5">
              {dottedTargets.map((target) => (
                <p
                  key={`${target.title}-${target.label}`}
                  className={`truncate text-violet-700 ${compact ? "text-[10px]" : "text-xs"}`}
                  title={target.label || "Dotted reporting line"}
                >
                  ⋯→ {target.title}
                  {target.label ? <span className="text-violet-500"> · {target.label}</span> : null}
                </p>
              ))}
            </div>
          ) : null}
        </button>
        {canEdit && !isRoot ? (
          <span
            draggable
            title="Drag to reparent"
            onDragStart={(e) => {
              e.stopPropagation();
              e.dataTransfer.setData("text/position-id", position.id);
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

export function OrgChart({
  selectedId,
  onSelect,
  filters,
  lens = "accountability",
  systemOperatorAccess = false,
}: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  filters?: OrgChartFilters;
  lens?: OrgChartLens;
  systemOperatorAccess?: boolean;
}) {
  const { employees, locations } = useData();
  const { positions, assignments, reportingLines, reparentPosition } = useOrgStructure();
  const { canWindow, roles, users } = useAuth();
  const { tiers: tierConfigs } = useOrgChartTierConfig();
  const canEdit = systemOperatorAccess || canWindow("workforce-org-edit");
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const roleNameById = useMemo(() => new Map(roles.map((r) => [r.id, r.name])), [roles]);
  const positionTitleById = useMemo(() => new Map(positions.map((p) => [p.id, p.title])), [positions]);

  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [pendingReparent, setPendingReparent] = useState<PendingReparent | null>(null);
  const [error, setError] = useState("");

  const employeeNameById = useMemo(() => new Map(employees.map((e) => [e.id, e.name])), [employees]);
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const locationNameById = useMemo(() => new Map(locations.map((l) => [l.id, l.name])), [locations]);
  const lensPositions = useMemo(() => applyOrgChartLens(positions, lens), [positions, lens]);
  const filteredPositions = useMemo(
    () => filterOrgPositions(lensPositions, filters ?? {}),
    [lensPositions, filters]
  );
  const tierLayoutKey = useMemo(
    () => filteredPositions.map((p) => `${p.id}:${p.chartTier}:${p.parentPositionId}`).join("|"),
    [filteredPositions]
  );
  const chartPositions = useMemo(
    () => filteredPositions.filter((p) => p.chartTier > 0),
    [filteredPositions]
  );

  const dottedTargetsByPositionId = useMemo(() => {
    const map = new Map<string, { title: string; label: string }[]>();
    for (const line of reportingLines) {
      if (line.lineType !== "dotted") continue;
      const title = positionTitleById.get(line.reportsToPositionId) ?? line.reportsToPositionId;
      const list = map.get(line.positionId) ?? [];
      list.push({ title, label: line.label });
      map.set(line.positionId, list);
    }
    return map;
  }, [reportingLines, positionTitleById]);

  const visiblePositionIds = useMemo(() => new Set(filteredPositions.map((p) => p.id)), [filteredPositions]);
  const visibleReportingLines = useMemo(
    () =>
      reportingLines.filter(
        (line) =>
          visiblePositionIds.has(line.positionId) && visiblePositionIds.has(line.reportsToPositionId)
      ),
    [reportingLines, visiblePositionIds]
  );

  const chartRevision = useMemo(
    () =>
      `${filteredPositions.length}-${visibleReportingLines.map((line) => line.id).join(",")}-${lens}-${selectedId ?? ""}`,
    [filteredPositions.length, visibleReportingLines, lens, selectedId]
  );

  function requestReparent(targetId: string) {
    setDropTargetId(null);
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const moving = positions.find((p) => p.id === dragId);
    if (moving?.parentPositionId?.trim() === targetId) {
      setError(`Already reports to ${positionTitleById.get(targetId) ?? "that position"}.`);
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
    const movedId = pendingReparent.positionId;
    reparentPosition(pendingReparent.positionId, pendingReparent.newParentId);
    setPendingReparent(null);
    onSelect(movedId);
    requestAnimationFrame(() => {
      const el = chartContainerRef.current?.querySelector(`[data-org-position-id="${movedId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    });
  }

  if (!chartPositions.length) {
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
          Positions sit on manually managed chart tiers. Drag the grip (⋮⋮) onto another card to change who they
          report to (solid line). Change chart tier in the editor if a card is on the wrong row.
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{error}</p>
      ) : null}
      {visibleReportingLines.length ? (
        <p className="text-xs text-violet-800">
          <span className="font-medium">Dotted lines</span> — secondary accountability (escalation still follows solid
          reporting).
        </p>
      ) : null}
      <div
        ref={chartContainerRef}
        className="relative min-h-[72vh] max-h-[85vh] overflow-x-auto overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-6"
      >
        <OrgChartDottedLines
          containerRef={chartContainerRef}
          lines={visibleReportingLines}
          revision={`${chartRevision}-${tierLayoutKey}-${visibleReportingLines.length}`}
        />
        <div key={tierLayoutKey} className="relative mx-auto w-full px-2 pb-4">
          <OrgChartTierView
            positions={chartPositions}
            tierConfigs={tierConfigs}
            employeesById={employeesById}
            employeeNameById={employeeNameById}
            locationNameById={locationNameById}
            roleNameById={roleNameById}
            positionTitleById={positionTitleById}
            users={users}
            roles={roles}
            assignments={assignments}
            dottedTargetsByPositionId={dottedTargetsByPositionId}
            canEdit={canEdit}
            selectedId={selectedId}
            dragId={dragId}
            dropTargetId={dropTargetId}
            onSelect={(id) => onSelect(id)}
            onDragStart={setDragId}
            onDragOverTarget={setDropTargetId}
            onDragLeaveTarget={() => setDropTargetId(null)}
            onDropOnTarget={requestReparent}
            renderCard={(props) => (
              <PositionCard
                position={props.position}
                employeeName={props.employeeName}
                actingName={props.actingName}
                onLeave={props.onLeave}
                locationLabel={props.locationLabel}
                roleLabel={props.roleLabel}
                holderRoleMisaligned={props.holderRoleMisaligned}
                dottedTargets={props.dottedTargets}
                canEdit={props.canEdit}
                selected={props.selected}
                dragOver={props.dragOver}
                isDragging={props.isDragging}
                isStructural={props.position.id === "pos-board"}
                onSelect={props.onSelect}
                onDragStart={props.onDragStart}
                onDragOver={props.onDragOver}
                onDragLeave={props.onDragLeave}
                onDrop={props.onDrop}
              />
            )}
          />
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
  systemOperatorAccess = false,
}: {
  positionId: string | null;
  onClose: () => void;
  onCreated?: (id: string) => void;
  onSelectPosition?: (id: string) => void;
  systemOperatorAccess?: boolean;
}) {
  const { employees, locations } = useData();
  const { positions, assignments, reportingLines, upsertPosition, assignPrimary, clearPrimary, assignActing, clearActing, addPosition, addDottedReportingLine, removeDottedReportingLine } = useOrgStructure();
  const { canWindow, roles, users } = useAuth();
  const { activeTiers, tierLabel } = useOrgChartTierConfig();
  const canEdit = systemOperatorAccess || canWindow("workforce-org-edit");
  const canEditChartTier = systemOperatorAccess || canWindow("workforce-org-chart-tier");
  const canManageAccess =
    systemOperatorAccess || canEdit || canWindow("employee-system-access") || canWindow("admin-roles");

  const activeRoles = useMemo(() => roles.filter((r) => r.active), [roles]);
  const employeesById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const { fix, fixingKey, fixedKeys, error: fixError, setError: setFixError } =
    useFixHolderRoleAlignment(employeesById);

  const [pendingPrimary, setPendingPrimary] = useState<PendingPrimaryAssign | null>(null);
  const [pendingActing, setPendingActing] = useState<PendingActingAssign | null>(null);
  const [dottedTargetId, setDottedTargetId] = useState("");

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
  const dottedLinesForPosition = reportingLines.filter((line) => line.positionId === positionId);
  const dottedTargetCandidates = positions.filter(
    (p) => p.id !== positionId && p.id !== position?.parentPositionId
  );
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
          <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3">
            <p className="text-xs font-semibold text-sky-900">Chart tier</p>
            <p className="mt-0.5 text-[10px] text-sky-800">
              Which horizontal band this card appears on. Separate from Reports to — escalation still follows the
              solid line.
            </p>
            {canEditChartTier ? (
              <label className="mt-2 block text-xs font-medium text-sky-900">
                Tier band
                <select
                  value={position.chartTier}
                  onChange={(e) => patch({ chartTier: Number(e.target.value) })}
                  className="mt-1 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm"
                >
                  {activeTiers.map((o) => (
                    <option key={o.tier} value={o.tier}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[10px] text-sky-800">
                  {activeTiers.find((o) => o.tier === position.chartTier)?.hint ??
                    "Tier bands are defined in System setup."}
                </p>
              </label>
            ) : (
              <p className="mt-2 rounded-lg border border-sky-200 bg-white px-3 py-2 text-sm text-sky-950">
                <span className="font-medium">{tierLabel(position.chartTier)}</span>
                <span className="mt-1 block text-[10px] font-normal text-sky-800">
                  Tier labels are managed in System setup. Only roles with Organisation structure — chart tiers can
                  change which band a position uses.
                </span>
              </p>
            )}
          </div>
        ) : null}

        {!isRoot ? (
          <div className="rounded-xl border border-violet-100 bg-violet-50/40 p-3">
            <p className="text-xs font-semibold text-violet-900">Also reports to (dotted)</p>
            <p className="mt-0.5 text-[10px] text-violet-800">
              Secondary accountability for the chart. Escalation and tasks still use the solid line above.
            </p>
            {dottedLinesForPosition.length ? (
              <ul className="mt-2 space-y-1">
                {dottedLinesForPosition.map((line) => {
                  const target = positions.find((p) => p.id === line.reportsToPositionId);
                  return (
                    <li key={line.id} className="flex items-center justify-between gap-2 text-xs text-violet-900">
                      <span className="truncate">⋯→ {target?.title ?? line.reportsToPositionId}</span>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => removeDottedReportingLine(line.id)}
                          className="shrink-0 text-violet-700 hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-violet-800/80">No dotted lines.</p>
            )}
            {canEdit ? (
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <label className="min-w-0 flex-1 text-[10px] font-medium text-violet-900">
                  Add dotted line to
                  <select
                    value={dottedTargetId}
                    onChange={(e) => setDottedTargetId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-violet-200 bg-white px-2 py-1.5 text-xs"
                  >
                    <option value="">— Select position —</option>
                    {dottedTargetCandidates.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={!dottedTargetId}
                  onClick={() => {
                    if (!dottedTargetId || !positionId) return;
                    addDottedReportingLine(positionId, dottedTargetId);
                    setDottedTargetId("");
                  }}
                  className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {!isRoot ? (
          <label className="block text-xs font-medium text-slate-700">
            Security role (System → Admin → Roles)
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
              Every position must map to a role from System → Admin → Roles. Title can add a site-specific label.
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
                chartTier: canEditChartTier
                  ? Math.min(7, Math.max(1, position.chartTier + 1))
                  : position.chartTier,
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
