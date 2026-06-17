"use client";

import type { AppRoleRecord, AppUserRecord } from "@/lib/access/types";
import type { OrgPositionRecord } from "@/lib/org-structure";
import { checkHolderRoleAlignment } from "@/lib/org-position-role-alignment";
import { HolderRoleAlignmentAlert } from "@/components/workforce/holder-role-alignment-alert";

export type PendingPrimaryAssign = {
  positionId: string;
  employeeId: string;
  previousEmployeeId: string;
};

export function OrgAssignPrimaryConfirmDialog({
  pending,
  positions,
  employeeNameById,
  users,
  roles,
  canFix,
  onFixAlignment,
  fixingAlignment,
  fixedAlignment,
  onConfirm,
  onCancel,
}: {
  pending: PendingPrimaryAssign;
  positions: OrgPositionRecord[];
  employeeNameById: Map<string, string>;
  users: AppUserRecord[];
  roles: AppRoleRecord[];
  canFix?: boolean;
  onFixAlignment?: () => void | Promise<void>;
  fixingAlignment?: boolean;
  fixedAlignment?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const position = positions.find((p) => p.id === pending.positionId);
  if (!position) return null;

  const nextName = pending.employeeId
    ? employeeNameById.get(pending.employeeId) ?? pending.employeeId
    : "";
  const prevName = pending.previousEmployeeId
    ? employeeNameById.get(pending.previousEmployeeId) ?? pending.previousEmployeeId
    : "";

  const clearing = !pending.employeeId;

  const alignmentIssue =
    !clearing && pending.employeeId
      ? checkHolderRoleAlignment({
          employeeId: pending.employeeId,
          employeeName: nextName,
          requiredRoleId: position.securityRoleId,
          users,
          roles,
        })
      : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-slate-900">Confirm primary holder change</h3>
        {clearing ? (
          <p className="mt-2 text-sm text-slate-600">
            Clear the primary holder for <span className="font-medium text-slate-900">{position.title}</span>
            {prevName ? (
              <>
                {" "}
                (currently <span className="font-medium text-slate-900">{prevName}</span>)?
              </>
            ) : (
              "?"
            )}
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600">
            Assign <span className="font-medium text-slate-900">{nextName}</span> as primary holder of{" "}
            <span className="font-medium text-slate-900">{position.title}</span>
            {prevName ? (
              <>
                , replacing <span className="font-medium text-slate-900">{prevName}</span>?
              </>
            ) : (
              "?"
            )}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-500">
          This updates who holds the position for escalation and task routing. Reporting lines are unchanged.
        </p>
        {alignmentIssue ? (
          <div className="mt-3">
            <HolderRoleAlignmentAlert
              issue={alignmentIssue}
              label="Login role mismatch"
              canFix={canFix}
              onFix={onFixAlignment}
              fixing={fixingAlignment}
              fixed={fixedAlignment}
            />
          </div>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Confirm assignment
          </button>
        </div>
      </div>
    </div>
  );
}
