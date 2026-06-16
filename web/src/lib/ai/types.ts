import type { ClientRecord } from "@/lib/client";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { TaskRecord, TaskStatus } from "@/lib/task";
import type { ClientActivityDraft } from "@/lib/ai/persist";
import type { IncidentDraft } from "@/lib/ai/tools/incident-draft";
import type { ClientPatchFields } from "@/lib/supabase/data-api";

export type AiToolName =
  | "help_search"
  | "activity_search"
  | "client_search"
  | "client_get"
  | "client_list_recent"
  | "records_updated_since"
  | "task_search"
  | "task_draft_create"
  | "task_draft_confirm"
  | "task_update_draft_create"
  | "task_update_draft_confirm"
  | "client_draft_create"
  | "client_draft_confirm"
  | "client_patch_draft_create"
  | "client_patch_draft_confirm"
  | "client_activity_draft_create"
  | "client_activity_draft_confirm"
  | "enquiry_search"
  | "enquiry_get"
  | "enquiry_draft_create"
  | "enquiry_draft_confirm"
  | "enquiry_convert_draft_create"
  | "enquiry_convert_draft_confirm"
  | "incident_search"
  | "incident_draft_create"
  | "incident_draft_confirm";

export type AiAgentCapability = {
  type: string;
  key: string;
};

export type AiAgentRecord = {
  id: string;
  agentKey: string;
  name: string;
  description: string;
  systemPrompt: string;
  model: string;
  active: boolean;
  capabilities: AiAgentCapability[];
};

export type ChatMessageRole = "user" | "assistant" | "system" | "tool";

export type ChatMessage = {
  role: ChatMessageRole;
  content: string;
  toolCallId?: string;
  name?: string;
};

export type ClientDraft = {
  firstName: string;
  lastName: string;
  preferredName?: string;
  email?: string;
  phone?: string;
  status?: string;
  fundingBody?: string;
  disability?: string;
  services?: string;
};

export type ClientPatchDraft = {
  clientId: string;
  clientName: string;
  clientSearchKey: string;
  fields: ClientPatchFields;
};

export type EnquiryDraft = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  fundingBody?: string;
  disability?: string;
  services?: string;
  description?: string;
  enquirySource?: string;
  status?: string;
};

export type TaskDraft = {
  title: string;
  description: string;
  taskTypeId: string;
  priority: "Low" | "Normal" | "High";
  dueDate: string;
  assignmentType: "user" | "role";
  assigneeUserId: string;
  assigneeRoleId: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
};

export type TaskUpdateDraft = {
  taskId: string;
  taskTitle: string;
  documentNo: string;
  action: "complete" | "reassign" | "add_note" | "change_status";
  status?: TaskStatus;
  assignmentType?: "user" | "role";
  assigneeUserId?: string;
  assigneeRoleId?: string;
  note?: string;
  resolutionNotes?: string;
};

export type ChatThreadState = {
  pendingTaskDraft?: TaskDraft | null;
  pendingTaskUpdate?: TaskUpdateDraft | null;
  pendingClientDraft?: ClientDraft | null;
  pendingClientPatch?: ClientPatchDraft | null;
  pendingClientActivityDraft?: ClientActivityDraft | null;
  pendingEnquiryDraft?: EnquiryDraft | null;
  pendingEnquiryConvertId?: string | null;
  pendingIncidentDraft?: IncidentDraft | null;
};

export type AiWriteResult = {
  kind: "client" | "task" | "client_activity" | "enquiry" | "client_patch" | "enquiry_convert" | "task_update" | "incident";
  label: string;
  href: string;
};

export type ChatDisplayAttachment = {
  type: "table";
  title: string;
  columns?: string[];
  rows?: Record<string, string>[];
};

export type ChatRequestBody = {
  agentId: string;
  messages: ChatMessage[];
  threadState?: ChatThreadState;
};

export type ChatResponseBody = {
  message: ChatMessage;
  messages: ChatMessage[];
  threadState: ChatThreadState;
  agentId: string;
  agentName: string;
  createdTask?: TaskRecord;
  updatedTask?: TaskRecord;
  createdClient?: ClientRecord;
  createdEnquiry?: EnquiryRecord;
  writeResult?: AiWriteResult;
  attachments?: ChatDisplayAttachment[];
};
