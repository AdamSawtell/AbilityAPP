"use client";

import Link from "next/link";
import type { HolderRoleAlignmentIssue } from "@/lib/org-position-role-alignment";
import { alignmentIssueMessage } from "@/lib/org-position-role-alignment";

export function HolderRoleAlignmentAlert({
  issue,
  label,
}: {
  issue: HolderRoleAlignmentIssue;
  label?: string;
}) {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950">
      {label ? <p className="mb-1 font-semibold">{label}</p> : null}
      <p>{alignmentIssueMessage(issue)}</p>
      <p className="mt-1.5">
        <Link href="/admin/users" className="font-medium text-amber-900 underline hover:text-amber-950">
          Open Admin → Users
        </Link>
        {issue.kind === "no_required_role" ? (
          <>
            {" "}
            or{" "}
            <Link href="/admin/roles" className="font-medium text-amber-900 underline hover:text-amber-950">
              Admin → Roles
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
