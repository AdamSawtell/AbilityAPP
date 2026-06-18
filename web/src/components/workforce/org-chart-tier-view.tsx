"use client";

import { memo, useMemo, useState } from "react";
import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import type { EmployeeRecord } from "@/lib/employee";
import type { OrgPositionRecord, PositionAssignmentRecord } from "@/lib/org-structure";
import { groupPositionsByChartTier } from "@/lib/org-chart-tiers";
import { shouldCollapseSiblingGroup } from "@/lib/org-chart-layout";
import { activeAssignments, isEmployeeOnLeaveToday } from "@/lib/org-structure-tree";
import { checkHolderRoleAlignment } from "@/lib/org-position-role-alignment";

export type OrgChartTierCardProps = {
  position: OrgPositionRecord;
  employeeName: string;
  actingName: string;
  onLeave: boolean;
  locationLabel: string;
  roleLabel: string;
  parentTitle: string;
  holderRoleMisaligned: boolean;
  dottedTargets: { title: string; label: string }[];
  canEdit: boolean;
  selected: boolean;
  dragOver: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
};

type PositionSlotDerived = {
  employeeName: string;
  actingName: string;
  onLeave: boolean;
  locationLabel: string;
  roleLabel: string;
  parentTitle: string;
  holderRoleMisaligned: boolean;
};

type TierViewContext = {
  employeesById: Map<string, EmployeeRecord>;
  employeeNameById: Map<string, string>;
  locationNameById: Map<string, string>;
  roleNameById: Map<string, string>;
  positionTitleById: Map<string, string>;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
  assignments: PositionAssignmentRecord[];
  dottedTargetsByPositionId: Map<string, { title: string; label: string }[]>;
  slotDerivedByPositionId: Map<string, PositionSlotDerived>;
  canEdit: boolean;
  selectedId: string | null;
  dragId: string | null;
  dropTargetId: string | null;
  onSelect: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOverTarget: (id: string) => void;
  onDragLeaveTarget: () => void;
  onDropOnTarget: (targetId: string) => void;
  renderCard: (props: OrgChartTierCardProps) => React.ReactNode;
};

function buildSlotDerivedByPositionId(
  positions: OrgPositionRecord[],
  ctx: Pick<
    TierViewContext,
    | "employeesById"
    | "employeeNameById"
    | "locationNameById"
    | "roleNameById"
    | "positionTitleById"
    | "users"
    | "roles"
    | "assignments"
  >
): Map<string, PositionSlotDerived> {
  const active = activeAssignments(ctx.assignments);
  const actingByPositionId = new Map<string, PositionAssignmentRecord>();
  for (const assignment of active) {
    if (assignment.assignmentType === "acting") {
      actingByPositionId.set(assignment.positionId, assignment);
    }
  }

  const derived = new Map<string, PositionSlotDerived>();
  for (const position of positions) {
    const employeeName = position.primaryEmployeeId
      ? ctx.employeeNameById.get(position.primaryEmployeeId) ?? "Unknown"
      : "";
    const acting = actingByPositionId.get(position.id);
    const actingName = acting?.employeeId ? ctx.employeeNameById.get(acting.employeeId) ?? "" : "";
    const primaryEmployee = position.primaryEmployeeId
      ? ctx.employeesById.get(position.primaryEmployeeId)
      : undefined;
    const onLeave = primaryEmployee ? isEmployeeOnLeaveToday(primaryEmployee) : false;
    const locationLabel = position.locationId
      ? ctx.locationNameById.get(position.locationId) ?? ""
      : position.site;
    const roleLabel = position.securityRoleId ? ctx.roleNameById.get(position.securityRoleId) ?? "" : "";
    const parentTitle = position.parentPositionId
      ? ctx.positionTitleById.get(position.parentPositionId) ?? ""
      : "";
    const holderRoleMisaligned = Boolean(
      (position.primaryEmployeeId &&
        checkHolderRoleAlignment({
          employeeId: position.primaryEmployeeId,
          employeeName,
          requiredRoleId: position.securityRoleId,
          users: ctx.users,
          roles: ctx.roles,
        })) ||
        (acting?.employeeId &&
          checkHolderRoleAlignment({
            employeeId: acting.employeeId,
            employeeName: actingName,
            requiredRoleId: position.securityRoleId,
            users: ctx.users,
            roles: ctx.roles,
          }))
    );

    derived.set(position.id, {
      employeeName,
      actingName,
      onLeave,
      locationLabel,
      roleLabel,
      parentTitle,
      holderRoleMisaligned,
    });
  }

  return derived;
}

const TierPositionSlot = memo(function TierPositionSlot({
  position,
  compact,
  ctx,
}: {
  position: OrgPositionRecord;
  compact?: boolean;
  ctx: TierViewContext;
}) {
  const {
    dottedTargetsByPositionId,
    slotDerivedByPositionId,
    canEdit,
    selectedId,
    dragId,
    dropTargetId,
    onSelect,
    onDragStart,
    onDragOverTarget,
    onDragLeaveTarget,
    onDropOnTarget,
    renderCard,
  } = ctx;

  const slot = slotDerivedByPositionId.get(position.id) ?? {
    employeeName: "",
    actingName: "",
    onLeave: false,
    locationLabel: "",
    roleLabel: "",
    parentTitle: "",
    holderRoleMisaligned: false,
  };

  const cardProps: OrgChartTierCardProps = {
    position,
    employeeName: slot.employeeName,
    actingName: slot.actingName,
    onLeave: slot.onLeave,
    locationLabel: slot.locationLabel,
    roleLabel: slot.roleLabel,
    parentTitle: slot.parentTitle,
    holderRoleMisaligned: slot.holderRoleMisaligned,
    dottedTargets: dottedTargetsByPositionId.get(position.id) ?? [],
    canEdit,
    selected: selectedId === position.id,
    dragOver: dropTargetId === position.id && dragId !== position.id,
    isDragging: dragId === position.id,
    onSelect: () => onSelect(position.id),
    onDragStart: () => onDragStart(position.id),
    onDragOver: (e) => {
      if (!canEdit || !dragId || dragId === position.id) return;
      e.preventDefault();
      onDragOverTarget(position.id);
    },
    onDragLeave: onDragLeaveTarget,
    onDrop: (e) => {
      e.preventDefault();
      onDropOnTarget(position.id);
    },
  };

  return (
    <div className={compact ? "w-full" : "w-[12rem] shrink-0"}>{renderCard(cardProps)}</div>
  );
});

function TierDeliveryGroup({
  title,
  roleLabel,
  nodes,
  ctx,
}: {
  title: string;
  roleLabel: string;
  nodes: OrgPositionRecord[];
  ctx: TierViewContext;
}) {
  const [expanded, setExpanded] = useState(false);
  const filledCount = nodes.filter((n) => n.primaryEmployeeId).length;

  return (
    <div className="w-[12rem] shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-slate-50"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {title}
            <span className="ml-1.5 font-normal text-slate-500">× {nodes.length}</span>
          </p>
          <p className="text-[10px] text-slate-500">
            {filledCount} filled · {roleLabel}
          </p>
        </div>
        <span className="shrink-0 text-xs text-indigo-700">{expanded ? "Collapse" : "Expand"}</span>
      </button>
      {expanded ? (
        <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto border-t border-slate-100 p-2">
          {nodes.map((position) => (
            <TierPositionSlot key={position.id} position={position} compact ctx={ctx} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function OrgChartTierView({
  positions,
  tierConfigs,
  renderCard,
  ...ctx
}: Omit<TierViewContext, "slotDerivedByPositionId"> & {
  positions: OrgPositionRecord[];
  tierConfigs?: import("@/lib/org-chart-tier-config").OrgChartTierConfigRecord[];
}) {
  const bands = useMemo(
    () => groupPositionsByChartTier(positions, tierConfigs),
    [positions, tierConfigs]
  );

  const slotDerivedByPositionId = useMemo(
    () =>
      buildSlotDerivedByPositionId(positions, {
        employeesById: ctx.employeesById,
        employeeNameById: ctx.employeeNameById,
        locationNameById: ctx.locationNameById,
        roleNameById: ctx.roleNameById,
        positionTitleById: ctx.positionTitleById,
        users: ctx.users,
        roles: ctx.roles,
        assignments: ctx.assignments,
      }),
    [
      positions,
      ctx.employeesById,
      ctx.employeeNameById,
      ctx.locationNameById,
      ctx.roleNameById,
      ctx.positionTitleById,
      ctx.users,
      ctx.roles,
      ctx.assignments,
    ]
  );

  const bandLayouts = useMemo(() => {
    return bands.map((band) => {
      const swNodes = band.positions.filter((p) => p.securityRoleId === "role-support-worker");
      const collapseSw = shouldCollapseSiblingGroup("role-support-worker", swNodes.length);

      const singles = collapseSw
        ? band.positions.filter((p) => p.securityRoleId !== "role-support-worker")
        : [...band.positions];

      singles.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

      const swGroup =
        collapseSw && swNodes.length
          ? {
              title: ctx.roleNameById.get("role-support-worker") ?? "Support Worker",
              roleLabel: ctx.roleNameById.get("role-support-worker") ?? "Support Worker",
              nodes: swNodes,
            }
          : null;

      return { band, singles, swGroup };
    });
  }, [bands, ctx.roleNameById]);

  const slotCtx: TierViewContext = { ...ctx, slotDerivedByPositionId, renderCard };

  return (
    <div className="flex w-max min-w-full flex-col gap-6">
      {bandLayouts.map(({ band, singles, swGroup }) => (
        <section key={band.tier} className="w-full">
          <div className="mb-2 flex items-center gap-2 px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{band.label}</h3>
            <span className="text-[10px] text-slate-400">
              {band.positions.length} position{band.positions.length === 1 ? "" : "s"}
            </span>
          </div>
          <div className="flex w-max min-w-full flex-row flex-nowrap items-start justify-center gap-4 overflow-x-auto pb-2">
            {singles.map((position) => (
              <TierPositionSlot key={position.id} position={position} ctx={slotCtx} />
            ))}
            {swGroup ? (
              <TierDeliveryGroup
                title={swGroup.title}
                roleLabel={swGroup.roleLabel}
                nodes={swGroup.nodes}
                ctx={slotCtx}
              />
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
