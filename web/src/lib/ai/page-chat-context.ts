import type { ClientRecord } from "@/lib/client";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { IncidentRecord } from "@/lib/incident";
import type { TaskRecord } from "@/lib/task";

export type PageChatContext = {
  systemLine: string;
  viewingLabel: string;
  moduleLabel: string;
  capabilities: string[];
  suggestions: string[];
  preferredAgentId?: string;
};

type RecordLookup = {
  clients: ClientRecord[];
  enquiries: EnquiryRecord[];
  tasks: TaskRecord[];
  incidents: IncidentRecord[];
};

function parsePath(pathname: string) {
  const path = pathname.split("?")[0] ?? pathname;
  const segments = path.split("/").filter(Boolean);
  return { segments, module: segments[0] ?? "", id: segments[1] ?? "" };
}

function findClient(lookup: RecordLookup, id: string) {
  return lookup.clients.find((c) => c.id === id || c.searchKey === id);
}

function findEnquiry(lookup: RecordLookup, id: string) {
  return lookup.enquiries.find((e) => e.id === id || e.documentNo === id);
}

function findTask(lookup: RecordLookup, id: string) {
  return lookup.tasks.find((t) => t.id === id || t.documentNo === id);
}

function findIncident(lookup: RecordLookup, id: string) {
  return lookup.incidents.find((i) => i.id === id || i.documentNo === id);
}

const MODULE_AGENTS: Record<string, string> = {
  clients: "agent-clients",
  enquiries: "agent-enquiries",
  tasks: "agent-tasks",
  incidents: "agent-incidents",
};

export function resolvePageChatContext(pathname: string, lookup: RecordLookup): PageChatContext {
  const { segments, module, id } = parsePath(pathname);
  const preferredAgentId = MODULE_AGENTS[module];

  if (!segments.length) {
    return {
      systemLine: "The user is on Home.",
      viewingLabel: "Home",
      moduleLabel: "Home",
      capabilities: ["Search records", "Prepare new clients", "Ask how-to questions"],
      suggestions: ["Show recent client activity", "Who was updated most recently?", "Prepare a new client"],
      preferredAgentId: "agent-workspace",
    };
  }

  if (module === "clients" && id === "new") {
    return {
      systemLine: "The user is on the new client form (/clients/new).",
      viewingLabel: "New client",
      moduleLabel: "Clients",
      capabilities: ["Review prepared fields", "Save the client record"],
      suggestions: ["What should I check before saving?", "Prepare another client"],
      preferredAgentId: "agent-clients",
    };
  }

  if (module === "clients" && id) {
    const client = findClient(lookup, id);
    const label = client ? `${client.name} (${client.searchKey})` : id;
    return {
      systemLine: `The user is viewing client ${label}.`,
      viewingLabel: label,
      moduleLabel: "Clients",
      capabilities: [
        "Look up details",
        "Summarise recent activity",
        "Coach activity notes (confirm client → last 5 notes → questions → save)",
      ],
      suggestions: [
        "Help me write today's activity update",
        "Summarise the last 5 activity notes",
        "Prepare an update to phone or status",
      ],
      preferredAgentId: "agent-clients",
    };
  }

  if (module === "enquiries" && id === "new") {
    return {
      systemLine: "The user is on the new enquiry form (/enquiries/new).",
      viewingLabel: "New enquiry",
      moduleLabel: "Enquiries",
      capabilities: ["Review prepared fields", "Create the enquiry"],
      suggestions: ["What intake fields matter most?", "Prepare another enquiry"],
      preferredAgentId: "agent-enquiries",
    };
  }

  if (module === "enquiries" && id) {
    const enquiry = findEnquiry(lookup, id);
    const label = enquiry ? `${enquiry.firstName} ${enquiry.lastName} · ${enquiry.documentNo}` : id;
    return {
      systemLine: `The user is viewing enquiry ${label}.`,
      viewingLabel: label,
      moduleLabel: "Enquiries",
      capabilities: ["Search intake", "Convert to client"],
      suggestions: ["Summarise this enquiry", "What is the next step for intake?"],
      preferredAgentId: "agent-enquiries",
    };
  }

  if (module === "tasks" && id === "new") {
    return {
      systemLine: "The user is on the new task form (/tasks/new).",
      viewingLabel: "New task",
      moduleLabel: "Tasks",
      capabilities: ["Review prepared task", "Create the task"],
      suggestions: ["Who should this task go to?", "Prepare a follow-up task"],
      preferredAgentId: "agent-tasks",
    };
  }

  if (module === "tasks" && id) {
    const task = findTask(lookup, id);
    const label = task ? `${task.documentNo} — ${task.title}` : id;
    return {
      systemLine: `The user is viewing task ${label}.`,
      viewingLabel: label,
      moduleLabel: "Tasks",
      capabilities: ["Search tasks", "Prepare updates"],
      suggestions: ["What is the status of this task?", "Prepare a related task"],
      preferredAgentId: "agent-tasks",
    };
  }

  if (module === "incidents" && id === "new") {
    return {
      systemLine: "The user is on the new incident report form (/incidents/new).",
      viewingLabel: "New incident",
      moduleLabel: "Incidents",
      capabilities: ["Review prepared report", "Submit the incident"],
      suggestions: ["Is this NDIS reportable?", "What evidence should I attach?"],
      preferredAgentId: "agent-incidents",
    };
  }

  if (module === "incidents" && id) {
    const incident = findIncident(lookup, id);
    const label = incident ? `${incident.documentNo} — ${incident.title}` : id;
    return {
      systemLine: `The user is viewing incident ${label}.`,
      viewingLabel: label,
      moduleLabel: "Incidents",
      capabilities: ["Compliance summary", "Linked client history"],
      suggestions: ["Is this overdue for NDIS?", "Show linked client incidents"],
      preferredAgentId: "agent-incidents",
    };
  }

  if (module === "tasks") {
    return {
      systemLine: "The user is on the tasks hub.",
      viewingLabel: "Tasks",
      moduleLabel: "Tasks",
      capabilities: ["Search tasks", "Prepare new tasks"],
      suggestions: ["What tasks are overdue?", "Prepare a task for my team"],
      preferredAgentId: "agent-tasks",
    };
  }

  if (module === "incidents") {
    return {
      systemLine: "The user is on the incidents hub.",
      viewingLabel: "Incident reports",
      moduleLabel: "Incidents",
      capabilities: ["Search incidents", "Compliance summary"],
      suggestions: ["Any overdue NDIS reportables?", "Prepare a new incident report"],
      preferredAgentId: "agent-incidents",
    };
  }

  if (module === "enquiries") {
    return {
      systemLine: "The user is on the enquiries list.",
      viewingLabel: "Enquiries",
      moduleLabel: "Enquiries",
      capabilities: ["Search enquiries", "Prepare new enquiries"],
      suggestions: ["Show recent enquiries", "Prepare a new enquiry"],
      preferredAgentId: "agent-enquiries",
    };
  }

  if (module === "clients") {
    return {
      systemLine: "The user is on the clients list.",
      viewingLabel: "Clients",
      moduleLabel: "Clients",
      capabilities: ["Search clients", "Prepare new clients"],
      suggestions: ["Who was updated most recently?", "Prepare a new client"],
      preferredAgentId: "agent-clients",
    };
  }

  return {
    systemLine: `The user is on /${segments.join("/")}.`,
    viewingLabel: segments[segments.length - 1] ?? "Workspace",
    moduleLabel: module || "Workspace",
    capabilities: ["Search records", "Ask questions"],
    suggestions: DEFAULT_FALLBACK_SUGGESTIONS,
    preferredAgentId: "agent-workspace",
  };
}

const DEFAULT_FALLBACK_SUGGESTIONS = [
  "Find Bernadette Rose",
  "Show recent client activity",
  "Prepare a new client",
];

/** @deprecated use resolvePageChatContext().systemLine */
export function buildPageContext(pathname: string): string {
  return resolvePageChatContext(pathname, {
    clients: [],
    enquiries: [],
    tasks: [],
    incidents: [],
  }).systemLine;
}
