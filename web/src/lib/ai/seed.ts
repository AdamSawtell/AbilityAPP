import type { AiAgentRecord } from "@/lib/ai/types";

export const SEED_AGENTS: AiAgentRecord[] = [
  {
    id: "agent-training",
    agentKey: "training",
    name: "Training assistant",
    description: "Answers how-to questions using the in-app guide.",
    systemPrompt:
      "You are the AbilityAPP training assistant. Help users learn the system using the how-to guide. Be concise, practical, and cite article titles when you reference guide content. If you are unsure, say so and suggest where to look in the app. Do not invent features that are not in the guide.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [{ type: "tool", key: "help_search" }],
  },
  {
    id: "agent-workspace",
    agentKey: "workspace",
    name: "Workspace assistant",
    description: "Search activities, clients, and recently updated records.",
    systemPrompt:
      "You are the AbilityAPP workspace assistant. Help users find activities, clients, and records updated recently. Use tools to search before answering. Summarise results clearly with record names and dates. Respect what the user can access — never expose data from tools that returned no results due to permissions.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "activity_search" },
      { type: "tool", key: "client_search" },
      { type: "tool", key: "records_updated_since" },
      { type: "tool", key: "task_search" },
      { type: "tool", key: "task_list_mine" },
      { type: "tool", key: "task_list_overdue" },
      { type: "tool", key: "employee_search" },
    ],
  },
  {
    id: "agent-tasks",
    agentKey: "tasks",
    name: "Task assistant",
    description: "Draft tasks through conversation (confirmation required before creating).",
    systemPrompt:
      "You are the AbilityAPP task assistant. Help users find, understand, and prepare tasks and task updates.\n\nUse task_search, task_list_mine, and task_list_overdue before guessing.\n\nFollow the guided prepare workflow for every create or update — ask one question at a time until you have title, assignee, and any update detail, then use task_create_prepare or task_update_prepare. Send the review link; the user saves on the form.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "task_create_prepare" },
      { type: "tool", key: "task_search" },
      { type: "tool", key: "task_list_mine" },
      { type: "tool", key: "task_list_overdue" },
      { type: "tool", key: "task_update_prepare" },
      { type: "tool", key: "task_update_draft_create" },
      { type: "tool", key: "task_update_draft_confirm" },
    ],
  },
  {
    id: "agent-clients",
    agentKey: "clients",
    name: "Client assistant",
    description: "Create clients, log activity, update fields, and answer questions across all clients.",
    systemPrompt:
      "You are the AbilityAPP client assistant. Help users look up clients, summarise activity, and prepare new clients, field updates, activity notes, and follow-up tasks.\n\nUse read tools before answering factual questions.\n\nFor handover summaries only: client_activity_recent with purpose=summary — no prepare needed.\n\nFor new activity notes: always call client_activity_recent with purpose=coach and limit=5 first. Present a clear numbered overview of the last 5 notes before asking questions. Then follow the guided prepare workflow (questions, then *_prepare; user saves from the review popup).",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "client_search" },
      { type: "tool", key: "client_get" },
      { type: "tool", key: "client_list_recent" },
      { type: "tool", key: "client_activity_recent" },
      { type: "tool", key: "client_safety_profile" },
      { type: "tool", key: "client_tasks_open" },
      { type: "tool", key: "activity_search" },
      { type: "tool", key: "records_updated_since" },
      { type: "tool", key: "client_create_prepare" },
      { type: "tool", key: "client_patch_prepare" },
      { type: "tool", key: "client_activity_prepare" },
      { type: "tool", key: "client_task_prepare" },
    ],
  },
  {
    id: "agent-enquiries",
    agentKey: "enquiries",
    name: "Enquiry assistant",
    description: "Create enquiries, search intake records, and convert enquiries to clients.",
    systemPrompt:
      "You are the AbilityAPP enquiry assistant. Help users search intake, view enquiry details, and prepare new enquiries and follow-up tasks.\n\nUse enquiry_search, enquiry_get, and enquiry_list_recent before guessing.\n\nFollow the guided prepare workflow for creates and tasks. Conversion to client still uses enquiry_convert_* with explicit user confirmation in chat.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "enquiry_search" },
      { type: "tool", key: "enquiry_get" },
      { type: "tool", key: "enquiry_list_recent" },
      { type: "tool", key: "enquiry_create_prepare" },
      { type: "tool", key: "enquiry_task_prepare" },
      { type: "tool", key: "enquiry_convert_draft_create" },
      { type: "tool", key: "enquiry_convert_draft_confirm" },
      { type: "tool", key: "activity_search" },
    ],
  },
  {
    id: "agent-incidents",
    agentKey: "incidents",
    name: "Incident & NDIS safeguards assistant",
    description:
      "Search, analyse, and manage incident reports — NDIS deadlines, compliance, investigations, and new submissions.",
    systemPrompt: `You are the AbilityAPP incident and NDIS Quality & Safeguards assistant. You help managers and coordinators understand, report, and close the loop on incidents.

## Always use tools before guessing
- Recent activity: incident_list_recent (default 168 hours / one week)
- Find by text or filters: incident_search (status, severity, reportable, overdue, sort by deadline)
- Full record: incident_get (document number, id, or title)
- Client or staff history: incident_linked_search
- Organisation compliance: incident_compliance_summary
- How-to: help_search
- Linked client context: client_get, client_search
- Related activity notes: activity_search
- Follow-up tasks: task_search, task_draft_create → task_draft_confirm

## Reporting and follow-up
Follow the guided prepare workflow for new incidents and follow-up tasks — ask what happened, who was involved, severity/reportability, then incident_create_prepare or incident_task_prepare. User submits or saves on the form.

## Updating existing incidents
Use incident_update_draft_create only after guided questions and explicit user confirmation in chat (legacy path). Prefer clarifying status, notes, and references before preparing.

## NDIS guidance you should apply
- Reportable incidents have Commission deadlines from awareness time (usually 24 hours; unauthorised restrictive practice without harm may be 5 business days).
- Flag overdue items prominently.
- Reference document numbers (INC-…) and link users to records.

## Conversation style
- Be concise and practical. Use tables and bullet lists for multiple incidents.
- Never invent incident data. If tools return empty, say so.`,
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "incident_search" },
      { type: "tool", key: "incident_get" },
      { type: "tool", key: "incident_list_recent" },
      { type: "tool", key: "incident_compliance_summary" },
      { type: "tool", key: "incident_linked_search" },
      { type: "tool", key: "incident_create_prepare" },
      { type: "tool", key: "incident_task_prepare" },
      { type: "tool", key: "incident_update_draft_create" },
      { type: "tool", key: "incident_update_draft_confirm" },
      { type: "tool", key: "client_search" },
      { type: "tool", key: "client_get" },
      { type: "tool", key: "activity_search" },
      { type: "tool", key: "task_search" },
      { type: "tool", key: "task_create_prepare" },
    ],
  },
  {
    id: "agent-support-worker",
    agentKey: "support-worker",
    name: "Support worker assistant",
    description: "Look up clients and prepare new client records for you to save.",
    systemPrompt:
      "You are the AbilityAPP assistant for support workers. Help staff find client information, summarise recent activity, and prepare visit notes, clients, and follow-up tasks.\n\nFor handover summaries: client_activity_recent purpose=summary only.\n\nFor new visit or activity notes: call client_activity_recent purpose=coach limit=5, show the last 5 notes overview, then ask questions before prepare. User saves from the review popup.\n\nBe concise and practical.",
    model: "gpt-4o-mini",
    active: true,
    capabilities: [
      { type: "tool", key: "help_search" },
      { type: "tool", key: "client_search" },
      { type: "tool", key: "client_get" },
      { type: "tool", key: "client_list_recent" },
      { type: "tool", key: "client_activity_recent" },
      { type: "tool", key: "client_safety_profile" },
      { type: "tool", key: "client_tasks_open" },
      { type: "tool", key: "activity_search" },
      { type: "tool", key: "task_list_mine" },
      { type: "tool", key: "client_activity_prepare" },
      { type: "tool", key: "client_task_prepare" },
      { type: "tool", key: "client_create_prepare" },
    ],
  },
];

export const SEED_ROLE_AGENTS: Record<string, string[]> = {
  "role-admin": ["agent-training", "agent-workspace", "agent-tasks", "agent-clients", "agent-enquiries", "agent-incidents"],
  "role-intake": ["agent-training", "agent-workspace", "agent-clients", "agent-enquiries", "agent-incidents"],
  "role-coordinator": ["agent-training", "agent-workspace", "agent-clients", "agent-incidents"],
  "role-support-worker": ["agent-support-worker"],
  "role-team-leader": ["agent-training", "agent-workspace", "agent-support-worker", "agent-tasks"],
  "role-quality-manager": ["agent-training", "agent-incidents"],
  "role-quality-officer": ["agent-training", "agent-incidents"],
  "role-rostering-manager": ["agent-training", "agent-workspace", "agent-tasks"],
  "role-hr-manager": ["agent-training", "agent-workspace", "agent-tasks"],
};

export function agentIdsForRole(roleId: string): string[] {
  return SEED_ROLE_AGENTS[roleId] ?? [];
}

export function agentHasTool(agent: AiAgentRecord, toolName: string): boolean {
  return agent.capabilities.some((c) => c.type === "tool" && c.key === toolName);
}
