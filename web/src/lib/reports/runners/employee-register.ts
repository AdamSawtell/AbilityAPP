import type { EmployeeRecord } from "@/lib/employee";
import type { ReportResult } from "@/lib/reports/types";

type EmployeeColumn = {
  id: string;
  label: string;
  getValue: (row: EmployeeRecord) => string;
};

export const EMPLOYEE_REGISTER_COLUMNS: EmployeeColumn[] = [
  { id: "searchKey", label: "Search key", getValue: (r) => r.searchKey },
  { id: "name", label: "Name", getValue: (r) => r.name },
  { id: "firstName", label: "First name", getValue: (r) => r.firstName },
  { id: "lastName", label: "Last name", getValue: (r) => r.lastName },
  { id: "preferredName", label: "Preferred name", getValue: (r) => r.preferredName },
  { id: "email", label: "Email", getValue: (r) => r.email },
  { id: "phone", label: "Phone", getValue: (r) => r.phone },
  { id: "mobile", label: "Mobile", getValue: (r) => r.mobile },
  { id: "jobTitle", label: "Job title", getValue: (r) => r.jobTitle },
  { id: "department", label: "Department", getValue: (r) => r.department },
  { id: "employmentStatus", label: "Employment status", getValue: (r) => r.employmentStatus },
  { id: "employmentType", label: "Employment type", getValue: (r) => r.employmentType },
  { id: "startDate", label: "Start date", getValue: (r) => r.startDate },
  { id: "endDate", label: "End date", getValue: (r) => r.endDate },
  { id: "siteBranch", label: "Site / branch", getValue: (r) => r.siteBranch },
  { id: "employeeNumber", label: "Employee number", getValue: (r) => r.employeeNumber },
  { id: "gender", label: "Gender", getValue: (r) => r.gender },
  { id: "credentialCount", label: "Credential count", getValue: (r) => String(r.credentials.length) },
  { id: "alertCount", label: "Alert count", getValue: (r) => String(r.alerts.length) },
  { id: "locationCount", label: "Location count", getValue: (r) => String(r.locations.length) },
];

export function buildEmployeeRegisterReport(employees: EmployeeRecord[]): ReportResult {
  const rows = [...employees]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((employee) => {
      const flat: Record<string, string> = {};
      for (const col of EMPLOYEE_REGISTER_COLUMNS) {
        flat[col.id] = col.getValue(employee);
      }
      return flat;
    });

  return {
    columns: EMPLOYEE_REGISTER_COLUMNS.map(({ id, label }) => ({ id, label })),
    rows,
  };
}
