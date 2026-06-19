import type {
  EmployeeCredentialRow,
  EmployeeLeaveRequestRow,
  EmployeeRecord,
} from "@/lib/employee";

export const CREDENTIAL_EXPIRY_WARNING_DAYS = 30;

export type EmployeeAutomationEvent =
  | { type: "employee.created"; employee: EmployeeRecord }
  | {
      type: "employee.credential_expiring";
      employee: EmployeeRecord;
      credential: EmployeeCredentialRow;
    }
  | {
      type: "employee.credential_pending_review";
      employee: EmployeeRecord;
      credential: EmployeeCredentialRow;
    }
  | {
      type: "employee.leave_requested";
      employee: EmployeeRecord;
      leaveRequest: EmployeeLeaveRequestRow;
    };

export function myWorkplaceCredentialPendingEvent(
  employee: EmployeeRecord,
  credential: EmployeeCredentialRow
): EmployeeAutomationEvent {
  return { type: "employee.credential_pending_review", employee, credential };
}

export function myWorkplaceLeaveRequestedEvent(
  employee: EmployeeRecord,
  leaveRequest: EmployeeLeaveRequestRow
): EmployeeAutomationEvent {
  return { type: "employee.leave_requested", employee, leaveRequest };
}

export function employeeEventsFromSave(
  employee: EmployeeRecord,
  before?: EmployeeRecord
): EmployeeAutomationEvent[] {
  if (!before) {
    return [{ type: "employee.created", employee }];
  }

  const events: EmployeeAutomationEvent[] = [];
  for (const credential of employee.credentials ?? []) {
    if (credential.status !== "Pending review") continue;
    const prior = before.credentials?.find((row) => row.id === credential.id);
    if (prior?.status === "Pending review") continue;
    events.push({ type: "employee.credential_pending_review", employee, credential });
  }
  return events;
}

function daysUntil(dateIso: string, now = new Date()): number | null {
  if (!dateIso?.trim()) return null;
  const day = dateIso.slice(0, 10);
  const target = new Date(`${day}T12:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date(`${now.toISOString().slice(0, 10)}T12:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function scheduledEmployeeCredentialCandidates(
  employees: EmployeeRecord[],
  withinDays = CREDENTIAL_EXPIRY_WARNING_DAYS,
  now = new Date()
): EmployeeAutomationEvent[] {
  const events: EmployeeAutomationEvent[] = [];

  for (const employee of employees) {
    if (employee.employmentStatus !== "Active") continue;
    for (const credential of employee.credentials ?? []) {
      if (!credential.expiryDate?.trim()) continue;
      if (credential.status === "Expired") continue;
      const remaining = daysUntil(credential.expiryDate, now);
      if (remaining == null || remaining < 0 || remaining > withinDays) continue;
      events.push({
        type: "employee.credential_expiring",
        employee,
        credential,
      });
    }
  }

  return events;
}
