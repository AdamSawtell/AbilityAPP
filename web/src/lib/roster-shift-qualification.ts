import type { ClientRecord } from "@/lib/client";
import type { EmployeeRecord } from "@/lib/employee";
import { staffClientMatchHints } from "@/lib/roster-staff-client-matching";
import type { RosterShiftRecord } from "@/lib/roster-shift";
import type { RosterShiftIssue, RosterValidationMode } from "@/lib/roster-shift-compliance";

const PUBLISH_BLOCK_CODES = new Set([
  "compliance-critical",
  "employment-status",
  "missing-working-with-children-check",
  "missing-ndis-worker-screening",
  "expired-working-with-children-check",
  "expired-ndis-worker-screening",
  "expiring-working-with-children-check",
  "expiring-ndis-worker-screening",
]);

function normalizeHintCode(code: string): string {
  return code.toLowerCase();
}

/** Credential and compliance issues that block publish (not advisory hints). */
export function qualificationIssuesForShift(
  record: RosterShiftRecord,
  client: ClientRecord | undefined,
  employee: EmployeeRecord | undefined,
  rosterShifts: RosterShiftRecord[],
  mode: RosterValidationMode
): RosterShiftIssue[] {
  if (mode !== "publish" || !record.employeeId?.trim()) return [];
  if (!client || !employee) return [];

  const hints = staffClientMatchHints({
    client,
    employee,
    rosterShifts,
    excludeShiftId: record.id,
  });

  const issues: RosterShiftIssue[] = [];
  for (const hint of hints) {
    const code = normalizeHintCode(hint.code);
    if (code.startsWith("missing-") || code.startsWith("expired-") || PUBLISH_BLOCK_CODES.has(code)) {
      issues.push({
        code: hint.code,
        message: hint.message,
        severity: "error",
      });
    }
  }
  return issues;
}

export type RosterQualificationMaps = {
  clientsById: Map<string, ClientRecord>;
  employeesById: Map<string, EmployeeRecord>;
};

export function buildRosterQualificationMaps(
  clients: ClientRecord[],
  employees: EmployeeRecord[]
): RosterQualificationMaps {
  return {
    clientsById: new Map(clients.map((c) => [c.id, c])),
    employeesById: new Map(employees.map((e) => [e.id, e])),
  };
}
