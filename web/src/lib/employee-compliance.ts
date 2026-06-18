import type { EmployeeAlertRow, EmployeeCredentialRow, EmployeeRecord } from "@/lib/employee";

export type ComplianceLevel = "ok" | "warning" | "critical";

export type ComplianceSummary = {
  level: ComplianceLevel;
  messages: string[];
  expiringCredentialCount: number;
  expiredCredentialCount: number;
};

const EXPIRY_WARNING_DAYS = 90;
const EXPIRY_SOON_DAYS = 30;

export function daysUntil(dateStr: string): number | null {
  if (!dateStr?.trim()) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

const WORKFLOW_CREDENTIAL_STATUSES = new Set(["Revoked", "Pending", "Pending review", "Rejected"]);

export function credentialStatusFromExpiry(expiryDate: string, currentStatus?: string): string {
  if (currentStatus && WORKFLOW_CREDENTIAL_STATUSES.has(currentStatus)) return currentStatus;
  const days = daysUntil(expiryDate);
  if (days === null) return currentStatus || "Current";
  if (days < 0) return "Expired";
  if (days <= EXPIRY_SOON_DAYS) return "Expiring soon";
  return "Current";
}

export function syncCredentialStatuses(credentials: EmployeeCredentialRow[]): EmployeeCredentialRow[] {
  return credentials.map((c) => ({
    ...c,
    status: credentialStatusFromExpiry(c.expiryDate, c.status),
  }));
}

export function deriveCredentialAlerts(employee: EmployeeRecord): EmployeeAlertRow[] {
  const alerts: EmployeeAlertRow[] = [];
  let line = 0;

  for (const cred of employee.credentials) {
    const days = daysUntil(cred.expiryDate);
    if (days === null || days > EXPIRY_WARNING_DAYS) continue;
    line += 1;
    const name =
      days < 0
        ? `${cred.credentialType} expired`
        : `${cred.credentialType} expiring in ${days} day${days === 1 ? "" : "s"}`;
    alerts.push({
      id: `sys-cred-${cred.id}`,
      lineNo: line,
      alertType: days < 0 ? "Compliance" : "Compliance",
      showAsAlert: "Yes",
      name,
      description: cred.credentialNumber
        ? `${cred.credentialType} (${cred.credentialNumber}) — ${cred.expiryDate || "no expiry date"}`
        : `${cred.credentialType} — ${cred.expiryDate || "no expiry date"}`,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: cred.expiryDate,
      source: "System",
    });
  }

  const visaDays = daysUntil(employee.visaExpiry);
  if (visaDays !== null && visaDays <= EXPIRY_WARNING_DAYS) {
    line += 1;
    alerts.push({
      id: `sys-visa-${employee.id}`,
      lineNo: line,
      alertType: "Compliance",
      showAsAlert: "Yes",
      name: visaDays < 0 ? "Visa expired" : `Visa expiring in ${visaDays} days`,
      description: employee.visaSubclass ? `Subclass ${employee.visaSubclass}` : "Work rights",
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: employee.visaExpiry,
      source: "System",
    });
  }

  const licenceDays = daysUntil(employee.driverLicenceExpiry);
  if (licenceDays !== null && licenceDays <= EXPIRY_WARNING_DAYS) {
    line += 1;
    alerts.push({
      id: `sys-licence-${employee.id}`,
      lineNo: line,
      alertType: "Compliance",
      showAsAlert: "Yes",
      name: licenceDays < 0 ? "Driver licence expired" : `Driver licence expiring in ${licenceDays} days`,
      description: employee.driverLicenceClass || "Driver licence",
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: employee.driverLicenceExpiry,
      source: "System",
    });
  }

  return alerts;
}

export function mergedEmployeeAlerts(employee: EmployeeRecord): EmployeeAlertRow[] {
  const manual = (employee.alerts ?? []).filter((a) => a.source !== "System");
  const system = deriveCredentialAlerts(employee);
  return [...manual, ...system].map((row, index) => ({ ...row, lineNo: index + 1 }));
}

export function complianceSummary(employee: EmployeeRecord): ComplianceSummary {
  const credentials = syncCredentialStatuses(employee.credentials ?? []);
  const expiredCredentialCount = credentials.filter((c) => c.status === "Expired").length;
  const expiringCredentialCount = credentials.filter((c) => c.status === "Expiring soon").length;
  const messages: string[] = [];

  if (expiredCredentialCount) messages.push(`${expiredCredentialCount} expired credential(s)`);
  if (expiringCredentialCount) messages.push(`${expiringCredentialCount} credential(s) expiring soon`);

  const visaDays = daysUntil(employee.visaExpiry);
  if (visaDays !== null && visaDays < 0) messages.push("Visa expired");
  else if (visaDays !== null && visaDays <= EXPIRY_SOON_DAYS) messages.push("Visa expiring soon");

  const licenceDays = daysUntil(employee.driverLicenceExpiry);
  if (licenceDays !== null && licenceDays < 0) messages.push("Driver licence expired");
  else if (licenceDays !== null && licenceDays <= EXPIRY_SOON_DAYS) messages.push("Driver licence expiring soon");

  const activeAlerts = mergedEmployeeAlerts(employee).filter((a) => a.showAsAlert === "Yes");
  if (activeAlerts.length && !messages.length) messages.push(`${activeAlerts.length} active alert(s)`);

  let level: ComplianceLevel = "ok";
  if (expiredCredentialCount || (visaDays !== null && visaDays < 0) || (licenceDays !== null && licenceDays < 0)) {
    level = "critical";
  } else if (
    expiringCredentialCount ||
    (visaDays !== null && visaDays <= EXPIRY_SOON_DAYS) ||
    (licenceDays !== null && licenceDays <= EXPIRY_SOON_DAYS) ||
    activeAlerts.some((a) => a.alertType === "Compliance")
  ) {
    level = "warning";
  }

  return { level, messages, expiringCredentialCount, expiredCredentialCount };
}

export function managerName(employee: EmployeeRecord, allEmployees: EmployeeRecord[]): string {
  if (!employee.reportsToId) return "";
  return allEmployees.find((e) => e.id === employee.reportsToId)?.name ?? "";
}

export function primaryEmergencyContact(employee: EmployeeRecord) {
  return (
    employee.emergencyContacts.find((c) => c.primaryContact === "Yes") ??
    employee.emergencyContacts.find((c) => c.callOrder === 1) ??
    employee.emergencyContacts[0]
  );
}
