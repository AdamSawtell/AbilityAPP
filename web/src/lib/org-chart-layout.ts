import type { OrgPositionNode } from "@/lib/org-structure";

/** Threshold: collapse siblings that share a role type when count exceeds this. */
export const ORG_CHART_COLLAPSE_THRESHOLD = 3;

export type OrgChartDisplayItem =
  | { kind: "position"; node: OrgPositionNode }
  | {
      kind: "group";
      groupKey: string;
      title: string;
      securityRoleId: string;
      roleLabel: string;
      nodes: OrgPositionNode[];
    };

export function siblingGroupKey(node: OrgPositionNode): string {
  return node.securityRoleId?.trim() || node.title?.trim() || node.id;
}

/**
 * When many siblings share the same security role, collapse into one expandable group
 * so the chart stacks vertically instead of sprawling horizontally.
 */
export function layoutOrgChildren(
  children: OrgPositionNode[],
  roleNameById: Map<string, string>
): OrgChartDisplayItem[] {
  if (children.length <= 1) {
    return children.map((node) => ({ kind: "position", node }));
  }

  const byKey = new Map<string, OrgPositionNode[]>();
  for (const child of children) {
    const key = siblingGroupKey(child);
    const list = byKey.get(key) ?? [];
    list.push(child);
    byKey.set(key, list);
  }

  const items: OrgChartDisplayItem[] = [];

  for (const [key, nodes] of byKey) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));

    if (nodes.length >= ORG_CHART_COLLAPSE_THRESHOLD) {
      const securityRoleId = nodes[0].securityRoleId ?? "";
      const roleLabel = securityRoleId ? roleNameById.get(securityRoleId) ?? "" : "";
      const title = roleLabel || nodes[0].title;
      items.push({
        kind: "group",
        groupKey: key,
        title,
        securityRoleId,
        roleLabel,
        nodes,
      });
    } else {
      for (const node of nodes) {
        items.push({ kind: "position", node });
      }
    }
  }

  items.sort((a, b) => {
    const sortA = a.kind === "position" ? a.node.sortOrder : a.nodes[0]?.sortOrder ?? 0;
    const sortB = b.kind === "position" ? b.node.sortOrder : b.nodes[0]?.sortOrder ?? 0;
    return sortA - sortB;
  });

  return items;
}
