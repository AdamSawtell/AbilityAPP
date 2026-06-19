import type { AccessWindow } from "@/lib/access/catalog-types";
import { canAccessWindow } from "@/lib/access/catalog";

export type HomePanelDef = {
  key: string;
  label: string;
  description: string;
  /** Module window required before this panel is effective (also enforced in role admin). */
  requiresWindowKey?: string;
};

export const HOME_PANEL_DEFINITIONS: HomePanelDef[] = [
  {
    key: "home-prompt",
    label: "Assistant & briefing",
    description: "Daily summary and suggested prompts for the sidebar assistant.",
  },
  {
    key: "home-needs-attention",
    label: "Needs attention",
    description: "Merged compliance, task, and workplace alerts.",
  },
  {
    key: "home-today",
    label: "Today",
    description: "Open tasks summary and personal calendar.",
  },
  {
    key: "home-module-enquiries",
    label: "Enquiries count",
    description: "Enquiries stat in the Modules section.",
    requiresWindowKey: "enquiries",
  },
  {
    key: "home-module-clients",
    label: "Clients count",
    description: "Clients stat in the Modules section.",
    requiresWindowKey: "clients",
  },
  {
    key: "home-module-incidents",
    label: "Incidents count",
    description: "Incidents stat in the Modules section.",
    requiresWindowKey: "incidents",
  },
  {
    key: "home-module-employees",
    label: "Employees count",
    description: "Employees stat in the Modules section.",
    requiresWindowKey: "employees",
  },
  {
    key: "home-recent-enquiries",
    label: "Recent enquiries",
    description: "Recent enquiries list.",
    requiresWindowKey: "enquiries",
  },
  {
    key: "home-recent-clients",
    label: "Recent clients",
    description: "Recent clients list.",
    requiresWindowKey: "clients",
  },
  {
    key: "home-recent-incidents",
    label: "Recent incidents",
    description: "Recent incidents list.",
    requiresWindowKey: "incidents",
  },
  {
    key: "home-quick-new-enquiry",
    label: "Quick action — New enquiry",
    description: "Primary New enquiry button on Home.",
    requiresWindowKey: "enquiries",
  },
  {
    key: "home-quick-report-incident",
    label: "Quick action — Report incident",
    description: "Report incident button on Home.",
    requiresWindowKey: "incidents",
  },
];

export const HOME_PANEL_KEYS = HOME_PANEL_DEFINITIONS.map((p) => p.key);

const HOME_PANEL_BY_KEY = new Map(HOME_PANEL_DEFINITIONS.map((p) => [p.key, p]));

export function homePanelAccessWindows(): AccessWindow[] {
  return HOME_PANEL_DEFINITIONS.map((panel) => ({
    key: panel.key,
    label: panel.label,
    group: "Core",
    parentWindowKey: "home",
    showInSidebar: false,
    abilityErpName: `Home — ${panel.label}`,
  }));
}

export function canHomePanel(windowKeys: string[], panelKey: string): boolean {
  if (!canAccessWindow(windowKeys, panelKey)) return false;
  const panel = HOME_PANEL_BY_KEY.get(panelKey);
  if (panel?.requiresWindowKey && !canAccessWindow(windowKeys, panel.requiresWindowKey)) {
    return false;
  }
  return true;
}

const CORE_HOME_PANELS = ["home-prompt", "home-needs-attention", "home-today"] as const;

/** Default home panels implied by module access (used when seeding roles). */
export function deriveHomePanelKeys(windowKeys: string[]): string[] {
  if (!windowKeys.includes("home")) return [];
  const panels = new Set<string>(CORE_HOME_PANELS);
  for (const def of HOME_PANEL_DEFINITIONS) {
    if (CORE_HOME_PANELS.includes(def.key as (typeof CORE_HOME_PANELS)[number])) continue;
    if (def.requiresWindowKey && !windowKeys.includes(def.requiresWindowKey)) continue;
    panels.add(def.key);
  }
  return [...panels];
}

export function withHomePanels(windowKeys: string[]): string[] {
  return [...new Set([...windowKeys, ...deriveHomePanelKeys(windowKeys)])];
}

export function homePanelsForRoleEditor(windowKeys: string[]): HomePanelDef[] {
  return HOME_PANEL_DEFINITIONS.filter((panel) => {
    if (!panel.requiresWindowKey) return true;
    return windowKeys.includes(panel.requiresWindowKey);
  });
}
