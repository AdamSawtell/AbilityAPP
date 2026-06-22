import { complianceSummary } from "@/lib/employee-compliance";
import type { EmployeeRecord } from "@/lib/employee";
import type { RosterShiftRecord } from "@/lib/roster-shift";

export type EmployeeExitStepStatus = "done" | "pending" | "warning" | "na";

export type EmployeeExitStep = {
  code: string;
  label: string;
  status: EmployeeExitStepStatus;
  message: string;
  href?: string;
};

export type EmployeeExitEvaluation = {
  steps: EmployeeExitStep[];
  readyToExit: boolean;
  blockers: string[];
};

export function evaluateEmployeeExit(params: {
  employee: EmployeeRecord;
  rosterShifts: RosterShiftRecord[];
  actorCanRevokeAccess: boolean;
}): EmployeeExitEvaluation {
  const { employee, rosterShifts, actorCanRevokeAccess } = params;
  const steps: EmployeeExitStep[] = [];
  const blockers: string[] = [];

  const separationDoc = (employee.documents ?? []).some(
    (d) =>
      d.documentType?.toLowerCase().includes("separation") ||
      d.name?.toLowerCase().includes("separation")
  );
  steps.push({
    code: "separation-letter",
    label: "Separation letter generated",
    status: separationDoc ? "done" : "pending",
    message: separationDoc
      ? "Separation letter is on the HR file."
      : "Generate a separation letter on the Documents tab before finalising exit.",
    href: `/employees/${employee.id}?tab=Documents`,
  });
  if (!separationDoc) blockers.push("Generate separation letter");

  const futureShifts = rosterShifts.filter(
    (s) =>
      s.employeeId === employee.id &&
      s.status !== "Cancelled" &&
      s.status !== "Completed" &&
      s.shiftDate >= new Date().toISOString().slice(0, 10)
  );
  steps.push({
    code: "roster-clear",
    label: "Future roster shifts cleared",
    status: futureShifts.length ? "warning" : "done",
    message: futureShifts.length
      ? `${futureShifts.length} future shift${futureShifts.length === 1 ? "" : "s"} still assigned — reassign or cancel on Rostering.`
      : "No future roster assignments.",
    href: "/rostering",
  });
  if (futureShifts.length) blockers.push("Clear future roster shifts");

  const compliance = complianceSummary(employee);
  steps.push({
    code: "credentials",
    label: "Credentials reviewed",
    status: compliance.level === "critical" ? "warning" : compliance.level === "warning" ? "warning" : "done",
    message:
      compliance.level === "ok"
        ? "No critical credential issues."
        : compliance.messages.join("; ") || "Review credentials before exit.",
    href: `/employees/${employee.id}?tab=Credentials%20Assigned`,
  });

  const endDateSet = Boolean(employee.endDate?.trim());
  steps.push({
    code: "end-date",
    label: "End date recorded",
    status: endDateSet ? "done" : "pending",
    message: endDateSet ? `End date ${employee.endDate}.` : "Set end date on the Employment tab.",
    href: `/employees/${employee.id}?tab=Employment`,
  });
  if (!endDateSet) blockers.push("Set employment end date");

  const terminated = employee.employmentStatus === "Terminated";
  steps.push({
    code: "employment-status",
    label: "Employment status set to Terminated",
    status: terminated ? "done" : "pending",
    message: terminated
      ? "Employment status is Terminated."
      : "Set employment status to Terminated when exit is final.",
    href: `/employees/${employee.id}?tab=Employment`,
  });

  steps.push({
    code: "system-access",
    label: "System access revoked",
    status: actorCanRevokeAccess ? (terminated ? "warning" : "na") : "na",
    message: actorCanRevokeAccess
      ? "Revoke or disable the linked user on System access after the last working day."
      : "Ask an administrator to revoke system access on the System access tab.",
    href: `/employees/${employee.id}?tab=System%20access`,
  });

  const readyToExit = blockers.length === 0 && terminated && endDateSet;

  return { steps, readyToExit, blockers };
}

export function buildExitChecklistCsv(employee: EmployeeRecord, evaluation: EmployeeExitEvaluation): string {
  const header = ["Employee", "Step", "Status", "Message"].join(",");
  const lines = evaluation.steps.map((step) =>
    [
      `"${employee.searchKey.replace(/"/g, '""')}"`,
      `"${step.label.replace(/"/g, '""')}"`,
      step.status,
      `"${step.message.replace(/"/g, '""')}"`,
    ].join(",")
  );
  return [header, ...lines].join("\r\n");
}
