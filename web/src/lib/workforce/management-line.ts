import type { EmployeeRecord } from "@/lib/employee";

type ReportsToEmployee = Pick<EmployeeRecord, "id" | "reportsToId">;

/** All employee ids in the reviewer's management subtree (direct and indirect reports). */
export function collectManagementLineEmployeeIds(
  managerEmployeeId: string,
  employees: ReportsToEmployee[]
): Set<string> {
  const managerId = managerEmployeeId.trim();
  if (!managerId) return new Set();

  const childrenByManager = new Map<string, string[]>();
  for (const employee of employees) {
    const reportsTo = employee.reportsToId?.trim();
    if (!reportsTo) continue;
    const list = childrenByManager.get(reportsTo) ?? [];
    list.push(employee.id);
    childrenByManager.set(reportsTo, list);
  }

  const result = new Set<string>();
  const queue = [...(childrenByManager.get(managerId) ?? [])];
  while (queue.length) {
    const id = queue.shift()!;
    if (result.has(id)) continue;
    result.add(id);
    for (const child of childrenByManager.get(id) ?? []) {
      queue.push(child);
    }
  }

  return result;
}

export function isInManagementLine(
  employeeId: string,
  managerEmployeeId: string,
  employees: ReportsToEmployee[]
): boolean {
  return collectManagementLineEmployeeIds(managerEmployeeId, employees).has(employeeId);
}
