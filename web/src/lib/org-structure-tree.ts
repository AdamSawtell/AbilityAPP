import type { EmployeeRecord } from "@/lib/employee";
import type { OrgPositionNode, OrgPositionRecord, PositionAssignmentRecord } from "@/lib/org-structure";

export function buildOrgTree(positions: OrgPositionRecord[]): OrgPositionNode[] {
  const map = new Map<string, OrgPositionNode>();
  for (const p of positions) {
    map.set(p.id, { ...p, children: [], depth: 0 });
  }

  const roots: OrgPositionNode[] = [];
  for (const node of map.values()) {
    const parentId = node.parentPositionId?.trim();
    if (!parentId || !map.has(parentId)) {
      roots.push(node);
    } else {
      map.get(parentId)!.children.push(node);
    }
  }

  function setDepth(nodes: OrgPositionNode[], depth: number) {
    for (const n of nodes) {
      n.depth = depth;
      n.children.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
      setDepth(n.children, depth + 1);
    }
  }

  roots.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  setDepth(roots, 0);
  return roots;
}

export function flattenOrgTree(nodes: OrgPositionNode[]): OrgPositionNode[] {
  const out: OrgPositionNode[] = [];
  function walk(list: OrgPositionNode[]) {
    for (const n of list) {
      out.push(n);
      walk(n.children);
    }
  }
  walk(nodes);
  return out;
}

export function wouldCreateOrgCycle(
  positions: OrgPositionRecord[],
  positionId: string,
  candidateParentId: string
): boolean {
  if (!candidateParentId || positionId === candidateParentId) return true;

  const childrenByParent = new Map<string, string[]>();
  for (const p of positions) {
    const parent = p.parentPositionId?.trim();
    if (!parent) continue;
    const list = childrenByParent.get(parent) ?? [];
    list.push(p.id);
    childrenByParent.set(parent, list);
  }

  const stack = [positionId];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === candidateParentId) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    for (const child of childrenByParent.get(id) ?? []) {
      stack.push(child);
    }
  }
  return false;
}

export function activeAssignments(
  assignments: PositionAssignmentRecord[],
  onDate = new Date()
): PositionAssignmentRecord[] {
  const day = onDate.toISOString().slice(0, 10);
  return assignments.filter((a) => {
    if (a.effectiveFrom && a.effectiveFrom > day) return false;
    if (a.effectiveTo && a.effectiveTo < day) return false;
    return true;
  });
}

export function actingAssignmentForPosition(
  assignments: PositionAssignmentRecord[],
  positionId: string,
  onDate = new Date()
): PositionAssignmentRecord | undefined {
  return activeAssignments(assignments, onDate).find(
    (a) => a.positionId === positionId && a.assignmentType === "acting"
  );
}

export function isEmployeeOnLeaveToday(employee: EmployeeRecord, onDate = new Date()): boolean {
  const day = onDate.toISOString().slice(0, 10);
  return employee.leaveRequests.some((leave) => {
    if (leave.status !== "Approved" && leave.status !== "Taken") return false;
    if (!leave.startDate || !leave.endDate) return false;
    return leave.startDate <= day && leave.endDate >= day;
  });
}

export function positionStatusTone(
  status: OrgPositionRecord["status"]
): "emerald" | "amber" | "sky" | "zinc" {
  switch (status) {
    case "filled":
      return "emerald";
    case "under_recruitment":
      return "sky";
    case "frozen":
      return "zinc";
    default:
      return "amber";
  }
}
