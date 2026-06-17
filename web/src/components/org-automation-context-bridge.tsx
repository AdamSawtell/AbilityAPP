"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-store";
import { useData } from "@/lib/data-store";
import { setOrgAutomationContext } from "@/lib/org-automation-context";
import { useOrgStructure } from "@/lib/org-structure-store";

/** Keeps org structure + employees + users available for server-side automation resolution. */
export function OrgAutomationContextBridge() {
  const { positions, assignments } = useOrgStructure();
  const { employees } = useData();
  const { users } = useAuth();

  useEffect(() => {
    setOrgAutomationContext({
      positions,
      assignments,
      employees,
      users: users.map((u) => ({ id: u.id, employeeBpId: u.employeeBpId })),
    });
  }, [positions, assignments, employees, users]);

  return null;
}
