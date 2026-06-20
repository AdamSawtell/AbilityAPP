import type { ClientRecord } from "@/lib/client";
import { complianceSummary, syncCredentialStatuses } from "@/lib/employee-compliance";
import type { EmployeeRecord } from "@/lib/employee";
import type { RosterShiftRecord } from "@/lib/roster-shift";

export type StaffClientMatchHintSeverity = "positive" | "info" | "warning";

export type StaffClientMatchHint = {
  code: string;
  severity: StaffClientMatchHintSeverity;
  message: string;
};

export type StaffClientMatchScore = {
  employeeId: string;
  employeeName: string;
  score: number;
  hints: StaffClientMatchHint[];
};

const MANDATORY_CREDENTIAL_TYPES = ["Working with Children Check", "NDIS Worker Screening"] as const;

function activeClientAlerts(client: ClientRecord): { risks: number; needs: number } {
  const risks = (client.risks ?? []).filter((r) => r.showAsAlert === "Yes").length;
  const needs = (client.needsAndRules ?? []).filter((n) => n.showAsAlert === "Yes").length;
  return { risks, needs };
}

function priorShiftCount(
  rosterShifts: RosterShiftRecord[],
  clientId: string,
  employeeId: string,
  excludeShiftId?: string
): number {
  return rosterShifts.filter(
    (s) =>
      s.id !== excludeShiftId &&
      s.clientId === clientId &&
      s.employeeId === employeeId &&
      s.employeeId.trim() !== "" &&
      (s.status === "Published" || s.status === "Completed")
  ).length;
}

function credentialByType(employee: EmployeeRecord, type: string) {
  const credentials = syncCredentialStatuses(employee.credentials ?? []);
  return credentials.find((c) => c.credentialType === type);
}

function mandatoryCredentialHints(employee: EmployeeRecord): StaffClientMatchHint[] {
  const hints: StaffClientMatchHint[] = [];
  for (const type of MANDATORY_CREDENTIAL_TYPES) {
    const cred = credentialByType(employee, type);
    if (!cred) {
      hints.push({
        code: `missing-${type.replace(/\s+/g, "-").toLowerCase()}`,
        severity: "warning",
        message: `No ${type} on file for this worker.`,
      });
      continue;
    }
    if (cred.status === "Expired") {
      hints.push({
        code: `expired-${type.replace(/\s+/g, "-").toLowerCase()}`,
        severity: "warning",
        message: `${type} expired${cred.expiryDate ? ` (${cred.expiryDate})` : ""}.`,
      });
    } else if (cred.status === "Expiring soon") {
      hints.push({
        code: `expiring-${type.replace(/\s+/g, "-").toLowerCase()}`,
        severity: "warning",
        message: `${type} expiring soon${cred.expiryDate ? ` (${cred.expiryDate})` : ""}.`,
      });
    } else if (cred.status !== "Current") {
      hints.push({
        code: `credential-${type.replace(/\s+/g, "-").toLowerCase()}-status`,
        severity: "warning",
        message: `${type} status is ${cred.status} — confirm before rostering.`,
      });
    }
  }
  return hints;
}

/** Advisory hints when pairing a worker with a client on a roster shift. Does not block save. */
export function staffClientMatchHints(params: {
  client: ClientRecord | undefined;
  employee: EmployeeRecord | undefined;
  rosterShifts: RosterShiftRecord[];
  excludeShiftId?: string;
}): StaffClientMatchHint[] {
  const { client, employee, rosterShifts, excludeShiftId } = params;
  if (!client || !employee) return [];

  const hints: StaffClientMatchHint[] = [];
  const prior = priorShiftCount(rosterShifts, client.id, employee.id, excludeShiftId);
  if (prior > 0) {
    hints.push({
      code: "prior-roster",
      severity: "positive",
      message: `Rostered with ${client.preferredName || client.firstName || client.name} ${prior} time${prior === 1 ? "" : "s"} before.`,
    });
  } else {
    hints.push({
      code: "no-prior-roster",
      severity: "info",
      message: "No previous published shifts with this client — review client needs and risks before first roster.",
    });
  }

  const compliance = complianceSummary(employee);
  if (compliance.level === "critical") {
    hints.push({
      code: "compliance-critical",
      severity: "warning",
      message: `Compliance issue: ${compliance.messages.join("; ")}.`,
    });
  } else if (compliance.level === "warning") {
    hints.push({
      code: "compliance-warning",
      severity: "warning",
      message: `Compliance warning: ${compliance.messages.join("; ")}.`,
    });
  }

  hints.push(...mandatoryCredentialHints(employee));

  if (employee.employmentStatus && employee.employmentStatus !== "Active") {
    hints.push({
      code: "employment-status",
      severity: "warning",
      message: `Employment status is ${employee.employmentStatus} — confirm before rostering.`,
    });
  }

  const manualAlerts = (employee.alerts ?? []).filter((a) => a.showAsAlert === "Yes");
  if (manualAlerts.length) {
    hints.push({
      code: "worker-alerts",
      severity: "warning",
      message: `Worker has ${manualAlerts.length} active alert${manualAlerts.length === 1 ? "" : "s"} — review Alerts tab.`,
    });
  }

  const specialisations = (employee.skills ?? []).filter((s) => s.skillType === "Specialisation" && s.name.trim());
  if (specialisations.length) {
    hints.push({
      code: "worker-skills",
      severity: "positive",
      message: `Specialisations: ${specialisations.map((s) => s.name).join(", ")}.`,
    });
  }

  const { risks, needs } = activeClientAlerts(client);
  if (risks) {
    hints.push({
      code: "client-risks",
      severity: "info",
      message: `Client has ${risks} active risk alert${risks === 1 ? "" : "s"} — review Risks tab.`,
    });
  }
  if (needs) {
    hints.push({
      code: "client-needs",
      severity: "info",
      message: `Client has ${needs} support need${needs === 1 ? "" : "s"} flagged as alert — review Needs and rules.`,
    });
  }

  return hints;
}

function hintScore(hints: StaffClientMatchHint[]): number {
  let score = 0;
  for (const hint of hints) {
    if (hint.code === "prior-roster") score += 20;
    if (hint.severity === "positive") score += 3;
    if (hint.severity === "warning") score -= 8;
    if (hint.code.startsWith("missing-")) score -= 15;
    if (hint.code === "compliance-critical") score -= 25;
  }
  return score;
}

/** Rank active workers for a client when assigning a shift. Higher score = better fit. */
export function rankWorkersForClient(params: {
  client: ClientRecord | undefined;
  employees: EmployeeRecord[];
  rosterShifts: RosterShiftRecord[];
  excludeShiftId?: string;
  limit?: number;
}): StaffClientMatchScore[] {
  const { client, employees, rosterShifts, excludeShiftId, limit = 5 } = params;
  if (!client) return [];

  const ranked = employees
    .filter((e) => e.employmentStatus === "Active" || !e.employmentStatus)
    .map((employee) => {
      const hints = staffClientMatchHints({ client, employee, rosterShifts, excludeShiftId });
      const prior = priorShiftCount(rosterShifts, client.id, employee.id, excludeShiftId);
      const score = hintScore(hints) + prior;
      return {
        employeeId: employee.id,
        employeeName: employee.name,
        score,
        hints,
      };
    })
    .sort((a, b) => b.score - a.score || a.employeeName.localeCompare(b.employeeName));

  return ranked.slice(0, limit);
}
