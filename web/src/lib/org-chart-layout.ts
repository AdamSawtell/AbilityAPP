import type { OrgPositionNode } from "@/lib/org-structure";

/** Collapse sibling groups when count reaches this threshold (bulk roles only). */
export const ORG_CHART_COLLAPSE_THRESHOLD = 3;

/** Only these security roles auto-collapse into an expandable group. */
export const ORG_CHART_COLLAPSE_ROLE_IDS = new Set(["role-support-worker"]);

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

export type OrgChartDisplayRow = {
  layout: "row" | "column";
  items: OrgChartDisplayItem[];
};

export function siblingGroupKey(node: OrgPositionNode): string {
  return node.securityRoleId?.trim() || node.title?.trim() || node.id;
}

export function shouldCollapseSiblingGroup(securityRoleId: string, count: number): boolean {
  if (count < ORG_CHART_COLLAPSE_THRESHOLD) return false;
  return ORG_CHART_COLLAPSE_ROLE_IDS.has(securityRoleId.trim());
}

/** Visual tier for multi-row sibling layout (lower = higher on chart). */
export function siblingChartTier(node: OrgPositionNode): number {
  const role = node.securityRoleId?.trim() ?? "";
  if (role === "role-board") return 1;
  if (role === "role-ceo") return 2;
  if (role.startsWith("role-exec-")) return 3;
  if (role === "role-team-leader") return 10;
  return 5;
}

/** Roles that always render as peer rows when they share a parent. */
export const ORG_CHART_PEER_ROW_ROLE_IDS = new Set([
  "role-board",
  "role-ceo",
  "role-exec-operations",
  "role-exec-hr",
  "role-exec-finance",
  "role-exec-ict",
  "role-exec-quality",
  "role-team-leader",
]);

function isPeerRowRole(securityRoleId: string): boolean {
  const role = securityRoleId.trim();
  return ORG_CHART_PEER_ROW_ROLE_IDS.has(role) || role.startsWith("role-exec-");
}

function forceRowLayoutForChildren(children: OrgPositionNode[]): boolean {
  if (children.length < 2) return children.length === 1;
  return children.every((child) => isPeerRowRole(child.securityRoleId ?? ""));
}

function rowLayoutForItems(items: OrgChartDisplayItem[], childNodes: OrgPositionNode[]): boolean {
  if (items.some((item) => item.kind === "group")) return false;
  if (forceRowLayoutForChildren(childNodes)) return true;
  if (items.length >= 2) return true;
  return items.length <= 1;
}

/**
 * When many siblings share the same bulk security role, collapse into one expandable group.
 * Team leaders, execs, and board members stay as individual cards.
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

    const securityRoleId = nodes[0].securityRoleId ?? "";
    if (shouldCollapseSiblingGroup(securityRoleId, nodes.length)) {
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

/**
 * Lay out direct children in one or more rows.
 * Board members and execs appear side by side; CEO sits on the row below the board;
 * support workers collapse under each team leader.
 */
export function layoutOrgChildRows(
  children: OrgPositionNode[],
  roleNameById: Map<string, string>
): OrgChartDisplayRow[] {
  const items = layoutOrgChildren(children, roleNameById);
  if (!items.length) return [];

  const tiers = new Map<number, OrgChartDisplayItem[]>();
  for (const item of items) {
    const tier = item.kind === "position" ? siblingChartTier(item.node) : 50;
    const list = tiers.get(tier) ?? [];
    list.push(item);
    tiers.set(tier, list);
  }

  const sortedTiers = [...tiers.keys()].sort((a, b) => a - b);
  if (sortedTiers.length <= 1) {
    return [{ layout: rowLayoutForItems(items, children) ? "row" : "column", items }];
  }

  return sortedTiers.map((tier) => {
    const tierItems = tiers.get(tier) ?? [];
    const tierNodes = tierItems
      .filter((item): item is Extract<OrgChartDisplayItem, { kind: "position" }> => item.kind === "position")
      .map((item) => item.node);
    return {
      layout: rowLayoutForItems(tierItems, tierNodes) ? "row" : "column",
      items: tierItems,
    };
  });
}
