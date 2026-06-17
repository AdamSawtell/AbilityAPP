"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import type { EmployeeRecord } from "@/lib/employee";
import { useAuth } from "@/lib/auth-store";
import {
  ALIGNMENT_FIX_DEFAULT_PASSWORD,
  alignmentFixLabel,
  buildHolderAlignmentFix,
  canAutoFixHolderAlignment,
} from "@/lib/holder-role-alignment-fix";
import type { HolderRoleAlignmentIssue } from "@/lib/org-position-role-alignment";
import { alignmentIssueMessage } from "@/lib/org-position-role-alignment";

export function useFixHolderRoleAlignment(employeesById: Map<string, EmployeeRecord>) {
  const { users, upsertUser } = useAuth();
  const [fixingKey, setFixingKey] = useState<string | null>(null);
  const [fixedKeys, setFixedKeys] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState("");

  const fix = useCallback(
    async (issue: HolderRoleAlignmentIssue) => {
      const key = `${issue.employeeId}:${issue.requiredRoleId ?? issue.kind}`;
      setError("");
      const employee = employeesById.get(issue.employeeId);
      const plan = buildHolderAlignmentFix(issue, users, employee);
      if (!plan) return false;

      setFixingKey(key);
      try {
        await upsertUser(
          plan.user,
          plan.setPassword ? { password: ALIGNMENT_FIX_DEFAULT_PASSWORD } : undefined
        );
        setFixedKeys((prev) => new Set(prev).add(key));
        return true;
      } catch {
        setError("Could not update login roles. Check you have permission to manage system access.");
        return false;
      } finally {
        setFixingKey(null);
      }
    },
    [employeesById, upsertUser, users]
  );

  return { fix, fixingKey, fixedKeys, error, setError };
}

export function HolderRoleAlignmentAlert({
  issue,
  label,
  canFix,
  onFix,
  fixing,
  fixed,
}: {
  issue: HolderRoleAlignmentIssue;
  label?: string;
  canFix?: boolean;
  onFix?: () => void | Promise<void>;
  fixing?: boolean;
  fixed?: boolean;
}) {
  const showFix = canFix && canAutoFixHolderAlignment(issue) && onFix;

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
      {label ? <p className="mb-1 font-semibold">{label}</p> : null}
      <p>{fixed ? "Login role aligned with this position." : alignmentIssueMessage(issue)}</p>
      {fixed ? null : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {showFix ? (
            <button
              type="button"
              disabled={fixing}
              onClick={() => void onFix()}
              className="rounded-lg bg-amber-900 px-2.5 py-1 text-[11px] font-semibold text-amber-50 hover:bg-amber-950 disabled:opacity-60"
            >
              {fixing ? "Saving…" : alignmentFixLabel(issue)}
            </button>
          ) : null}
          <Link href="/admin/users" className="font-medium text-amber-900 underline hover:text-amber-950">
            Admin → Users
          </Link>
          {issue.kind === "no_required_role" ? (
            <Link href="/admin/roles" className="font-medium text-amber-900 underline hover:text-amber-950">
              Admin → Roles
            </Link>
          ) : null}
        </div>
      )}
      {issue.kind === "no_user" && showFix ? (
        <p className="mt-1.5 text-[10px] text-amber-800">
          New login password: <span className="font-mono font-semibold">{ALIGNMENT_FIX_DEFAULT_PASSWORD}</span>
        </p>
      ) : null}
    </div>
  );
}
