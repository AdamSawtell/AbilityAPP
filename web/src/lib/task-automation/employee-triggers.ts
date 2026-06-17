import type { EmployeeCredentialRow, EmployeeRecord } from "@/lib/employee";

export const CREDENTIAL_EXPIRY_WARNING_DAYS = 30;

export type EmployeeAutomationEvent =
  | { type: "employee.created"; employee: EmployeeRecord }
  | {
      type: "employee.credential_expiring";
      employee: EmployeeRecord;
      credential: EmployeeCredentialRow;
    };

export function employeeEventsFromSave(
  employee: EmployeeRecord,
  before?: EmployeeRecord
): EmployeeAutomationEvent[] {
  if (!before) {
    return [{ type: "employee.created", employee }];
  }
  return [];
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
