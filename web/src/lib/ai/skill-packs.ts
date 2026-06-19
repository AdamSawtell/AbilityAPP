import type { AiToolModule } from "@/lib/ai/catalog";
import { AI_TOOL_MODULE_LABELS, AI_TOOL_MODULE_ORDER, toolLabel } from "@/lib/ai/catalog";
import type { AiAgentCapability, AiToolName } from "@/lib/ai/types";

/**
 * Skill pack convention (one pack = one page function)
 *
 * | Function   | Purpose                                      | Tool pattern        |
 * |------------|----------------------------------------------|---------------------|
 * | lookup     | Search, open, list recent on a page          | *_search, *_get     |
 * | create     | Prepare new record (human saves on form)     | *_create_prepare    |
 * | update     | Prepare changes on existing record           | *_patch_prepare, …  |
 * | activity   | Notes / timeline on a record                 | *_activity_prepare  |
 * | workflow   | Multi-step flows (convert, close, etc.)      | varies              |
 * | hub        | Coordinator bundle for a menu area           | lookup+create+…     |
 * | legacy     | Retired chat-confirm writes                  | *_draft_*           |
 *
 * ID pattern: pack-{module}-{function} or pack-{module}-{function}-{variant}
 * Module aligns with workspace sidebar (catalog `module`).
 *
 * Future menus without tools yet (add packs when tools ship):
 * people (employees), locations, delivery, reports — each gets lookup / create / update.
 */

export type AiSkillPackFunction =
  | "lookup"
  | "create"
  | "update"
  | "activity"
  | "workflow"
  | "hub"
  | "legacy";

export const AI_SKILL_PACK_FUNCTION_LABELS: Record<AiSkillPackFunction, string> = {
  lookup: "Lookup",
  create: "Create",
  update: "Update",
  activity: "Activity",
  workflow: "Workflow",
  hub: "Hub",
  legacy: "Legacy",
};

/** Curated bundles of tool keys — admin assigns packs; runtime still stores flat capabilities. */
export type AiSkillPack = {
  id: string;
  name: string;
  description: string;
  module: AiToolModule;
  /** Page function — consistent across all menus. */
  function: AiSkillPackFunction;
  tools: AiToolName[];
  deprecated?: boolean;
};

const CLIENT_LOOKUP: AiToolName[] = ["client_search", "client_get", "client_list_recent"];
const ENQUIRY_LOOKUP: AiToolName[] = ["enquiry_search", "enquiry_get"];
const INCIDENT_LOOKUP: AiToolName[] = [
  "incident_search",
  "incident_get",
  "incident_list_recent",
  "incident_compliance_summary",
  "incident_linked_search",
];

export const AI_SKILL_PACKS: AiSkillPack[] = [
  // —— Help ——
  {
    id: "pack-help-lookup",
    name: "How-to guides",
    description: "Help page — search articles and quick-task guides.",
    module: "help",
    function: "lookup",
    tools: ["help_search"],
  },

  // —— Cross-cutting ——
  {
    id: "pack-cross-cutting-lookup-activity",
    name: "Activity search",
    description: "Search activity notes on any record (clients, enquiries, employees, locations).",
    module: "cross-cutting",
    function: "lookup",
    tools: ["activity_search"],
  },
  {
    id: "pack-cross-cutting-lookup-recent",
    name: "Recently updated records",
    description: "Home / hub — records changed within a time window.",
    module: "cross-cutting",
    function: "lookup",
    tools: ["records_updated_since"],
  },
  {
    id: "pack-cross-cutting-hub",
    name: "Workspace discovery",
    description: "Home dashboard — help, activity, clients, tasks, and recent updates.",
    module: "cross-cutting",
    function: "hub",
    tools: ["help_search", "activity_search", "client_search", "records_updated_since", "task_search"],
  },

  // —— Clients ——
  {
    id: "pack-clients-lookup",
    name: "Client list & detail",
    description: "Clients page — search, open a client, list recently updated.",
    module: "clients",
    function: "lookup",
    tools: CLIENT_LOOKUP,
  },
  {
    id: "pack-clients-create",
    name: "New client (prepare)",
    description: "Clients /new — prepare a client form; user clicks Save.",
    module: "clients",
    function: "create",
    tools: [...CLIENT_LOOKUP, "client_create_prepare"],
  },
  {
    id: "pack-clients-create-only",
    name: "New client form only",
    description: "Minimal create — prepare draft only (use with lookup pack).",
    module: "clients",
    function: "create",
    tools: ["client_create_prepare"],
  },
  {
    id: "pack-clients-update-fields",
    name: "Client field update (prepare)",
    description: "Client detail — prepare profile field changes for human save.",
    module: "clients",
    function: "update",
    tools: ["client_search", "client_get", "client_patch_prepare"],
  },
  {
    id: "pack-clients-activity",
    name: "Client activity note (prepare)",
    description: "Client Activity tab — prepare a note; user saves on the record.",
    module: "clients",
    function: "activity",
    tools: ["client_search", "client_get", "client_activity_prepare", "activity_search"],
  },
  {
    id: "pack-clients-hub",
    name: "Client coordinator",
    description: "Full clients menu — lookup, create, update, and activity (prepare only).",
    module: "clients",
    function: "hub",
    tools: [
      "help_search",
      ...CLIENT_LOOKUP,
      "activity_search",
      "records_updated_since",
      "client_create_prepare",
      "client_patch_prepare",
      "client_activity_prepare",
    ],
  },
  {
    id: "pack-clients-role-support-worker",
    name: "Support worker (field)",
    description: "Rostered staff — find clients and prepare new records only.",
    module: "clients",
    function: "hub",
    tools: ["help_search", ...CLIENT_LOOKUP, "activity_search", "client_create_prepare"],
  },
  {
    id: "pack-clients-legacy",
    name: "Client writes (legacy)",
    description: "Retired chat-confirm client create, patch, and activity saves.",
    module: "clients",
    function: "legacy",
    tools: [
      "client_draft_create",
      "client_draft_confirm",
      "client_patch_draft_create",
      "client_patch_draft_confirm",
      "client_activity_draft_create",
      "client_activity_draft_confirm",
    ],
    deprecated: true,
  },

  // —— Enquiries ——
  {
    id: "pack-enquiries-lookup",
    name: "Enquiry list & detail",
    description: "Enquiries page — search and open intake records.",
    module: "enquiries",
    function: "lookup",
    tools: ENQUIRY_LOOKUP,
  },
  {
    id: "pack-enquiries-create",
    name: "New enquiry (prepare)",
    description: "Enquiries /new — prepare intake form; user creates the record.",
    module: "enquiries",
    function: "create",
    tools: [...ENQUIRY_LOOKUP, "enquiry_create_prepare", "activity_search"],
  },
  {
    id: "pack-enquiries-create-only",
    name: "New enquiry form only",
    description: "Minimal create — prepare draft only (use with lookup pack).",
    module: "enquiries",
    function: "create",
    tools: ["enquiry_create_prepare"],
  },
  {
    id: "pack-enquiries-activity",
    name: "Enquiry activity search",
    description: "Enquiry record — find related activity notes.",
    module: "enquiries",
    function: "activity",
    tools: ["enquiry_search", "enquiry_get", "activity_search"],
  },
  {
    id: "pack-enquiries-workflow-convert",
    name: "Enquiry → client (legacy)",
    description: "Convert enquiry to client via chat confirmation.",
    module: "enquiries",
    function: "workflow",
    tools: ["enquiry_convert_draft_create", "enquiry_convert_draft_confirm"],
    deprecated: true,
  },
  {
    id: "pack-enquiries-legacy",
    name: "Enquiry writes (legacy)",
    description: "Retired chat-confirm enquiry create and convert.",
    module: "enquiries",
    function: "legacy",
    tools: [
      "enquiry_draft_create",
      "enquiry_draft_confirm",
      "enquiry_convert_draft_create",
      "enquiry_convert_draft_confirm",
    ],
    deprecated: true,
  },
  {
    id: "pack-enquiries-hub",
    name: "Enquiry coordinator",
    description: "Intake menu — lookup, create, and activity search.",
    module: "enquiries",
    function: "hub",
    tools: ["help_search", ...ENQUIRY_LOOKUP, "enquiry_create_prepare", "activity_search"],
  },

  // —— Tasks ——
  {
    id: "pack-tasks-lookup",
    name: "Task list & detail",
    description: "Tasks hub — search by title, assignee, status, or linked record.",
    module: "tasks",
    function: "lookup",
    tools: ["task_search"],
  },
  {
    id: "pack-tasks-create",
    name: "New task (prepare)",
    description: "Tasks /new — prepare assignment form; user creates the task.",
    module: "tasks",
    function: "create",
    tools: ["help_search", "task_search", "task_create_prepare"],
  },
  {
    id: "pack-tasks-create-only",
    name: "New task form only",
    description: "Minimal create — prepare draft only (use with lookup pack).",
    module: "tasks",
    function: "create",
    tools: ["task_create_prepare"],
  },
  {
    id: "pack-tasks-update",
    name: "Task updates (legacy)",
    description: "Task detail — chat-confirm status and reassignment.",
    module: "tasks",
    function: "legacy",
    tools: ["task_update_draft_create", "task_update_draft_confirm"],
    deprecated: true,
  },
  {
    id: "pack-tasks-hub",
    name: "Task coordinator",
    description: "Tasks menu — lookup and prepare new assignments.",
    module: "tasks",
    function: "hub",
    tools: ["help_search", "task_search", "task_create_prepare"],
  },

  // —— Incidents ——
  {
    id: "pack-incidents-lookup",
    name: "Incident list & detail",
    description: "Incidents page — search, open, recent list, linked parties.",
    module: "incidents",
    function: "lookup",
    tools: INCIDENT_LOOKUP,
  },
  {
    id: "pack-incidents-lookup-compliance",
    name: "NDIS compliance dashboard",
    description: "Incidents compliance — reportable counts, overdue, incomplete checklist.",
    module: "incidents",
    function: "lookup",
    tools: ["incident_compliance_summary", "incident_search", "incident_list_recent"],
  },
  {
    id: "pack-incidents-create",
    name: "Report incident (prepare)",
    description: "Incidents /new — pre-fill wizard; user submits.",
    module: "incidents",
    function: "create",
    tools: ["incident_search", "incident_get", "incident_list_recent", "incident_create_prepare"],
  },
  {
    id: "pack-incidents-create-only",
    name: "Incident wizard only",
    description: "Minimal create — prepare draft only (use with lookup pack).",
    module: "incidents",
    function: "create",
    tools: ["incident_create_prepare"],
  },
  {
    id: "pack-incidents-update",
    name: "Investigation updates (legacy)",
    description: "Incident detail — chat-confirm workflow and investigation notes.",
    module: "incidents",
    function: "legacy",
    tools: ["incident_update_draft_create", "incident_update_draft_confirm"],
    deprecated: true,
  },
  {
    id: "pack-incidents-hub",
    name: "Incident & safeguards coordinator",
    description: "Full incidents menu — lookup, report, client context, tasks.",
    module: "incidents",
    function: "hub",
    tools: [
      "help_search",
      ...INCIDENT_LOOKUP,
      "incident_create_prepare",
      "client_search",
      "client_get",
      "activity_search",
      "task_search",
      "task_create_prepare",
    ],
  },
  {
    id: "pack-incidents-legacy",
    name: "Incident writes (legacy)",
    description: "Retired chat-confirm incident create and investigation saves.",
    module: "incidents",
    function: "legacy",
    tools: [
      "incident_draft_create",
      "incident_draft_confirm",
      "incident_update_draft_create",
      "incident_update_draft_confirm",
    ],
    deprecated: true,
  },
];

export type SkillPackSelection = "none" | "partial" | "full";

export function agentToolKeySet(capabilities: AiAgentCapability[]): Set<AiToolName> {
  return new Set(
    capabilities.filter((c) => c.type === "tool").map((c) => c.key as AiToolName)
  );
}

export function skillPackSelection(capabilities: AiAgentCapability[], pack: AiSkillPack): SkillPackSelection {
  const enabled = agentToolKeySet(capabilities);
  const inPack = pack.tools.filter((key) => enabled.has(key)).length;
  if (inPack === 0) return "none";
  if (inPack === pack.tools.length) return "full";
  return "partial";
}

export function toggleSkillPackCapabilities(
  capabilities: AiAgentCapability[],
  pack: AiSkillPack,
  enable: boolean
): AiAgentCapability[] {
  const nonTools = capabilities.filter((c) => c.type !== "tool");
  const enabled = agentToolKeySet(capabilities);

  if (enable) {
    for (const key of pack.tools) enabled.add(key);
  } else {
    for (const key of pack.tools) enabled.delete(key);
  }

  const tools = [...enabled].map((key) => ({ type: "tool" as const, key }));
  return [...nonTools, ...tools];
}

export function skillPacksGroupedByModule(
  packs: AiSkillPack[] = AI_SKILL_PACKS
): { module: AiToolModule; label: string; packs: AiSkillPack[] }[] {
  return AI_TOOL_MODULE_ORDER.map((module) => ({
    module,
    label: AI_TOOL_MODULE_LABELS[module],
    packs: packs.filter((p) => p.module === module),
  })).filter((group) => group.packs.length > 0);
}

export function skillPackToolLabels(pack: AiSkillPack): string[] {
  return pack.tools.map((key) => toolLabel(key));
}

export function skillPackById(id: string): AiSkillPack | undefined {
  return AI_SKILL_PACKS.find((p) => p.id === id);
}

/** Packs for a menu module and page function (e.g. all client create packs). */
export function skillPacksForFunction(
  module: AiToolModule,
  fn: AiSkillPackFunction,
  packs: AiSkillPack[] = AI_SKILL_PACKS
): AiSkillPack[] {
  return packs.filter((p) => p.module === module && p.function === fn);
}
