import type { ClientRecord } from "@/lib/client";
import type { EnquiryRecord } from "@/lib/enquiry";
import type { TaskRecord, TaskStatus } from "@/lib/task";
import type { ClientActivityDraft } from "@/lib/ai/persist";
import type { IncidentDraft } from "@/lib/ai/tools/incident-draft";
import type { IncidentStatus } from "@/lib/incident";
import type { ClientPatchFields } from "@/lib/supabase/data-api";

export type AiToolName =
  | "help_search"
  | "activity_search"
  | "client_search"
  | "client_get"
  | "client_activity_recent"
  | "client_safety_profile"
  | "client_tasks_open"
  | "client_list_recent"
  | "records_updated_since"
  | "task_search"
  | "task_draft_create"
  | "task_draft_confirm"
  | "task_create_prepare"
  | "task_list_mine"
  | "task_list_overdue"
  | "task_update_prepare"
  | "task_update_draft_create"
  | "task_update_draft_confirm"
  | "client_draft_create"
  | "client_draft_confirm"
  | "client_create_prepare"
  | "client_patch_prepare"
  | "client_activity_prepare"
  | "client_task_prepare"
  | "client_patch_draft_create"
  | "client_patch_draft_confirm"
  | "client_activity_draft_create"
  | "client_activity_draft_confirm"
  | "enquiry_search"
  | "enquiry_get"
  | "enquiry_draft_create"
  | "enquiry_draft_confirm"
  | "enquiry_create_prepare"
  | "enquiry_list_recent"
  | "enquiry_task_prepare"
  | "enquiry_convert_draft_create"
  | "enquiry_convert_draft_confirm"
  | "incident_search"
  | "incident_get"
  | "incident_list_recent"
  | "incident_compliance_summary"
  | "incident_linked_search"
  | "incident_draft_create"
  | "incident_draft_confirm"
  | "incident_create_prepare"
  | "incident_task_prepare"
  | "incident_update_draft_create"
  | "incident_update_draft_confirm"
  | "employee_search";

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

export type IncidentUpdateDraft = {
  incidentId: string;
  documentNo: string;
  title: string;
  action: "change_status" | "manager_review" | "commission_notified" | "add_investigation_note" | "close";
  status?: IncidentStatus;
  investigationNote?: string;
  ndisNotificationRef?: string;
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
  pendingIncidentUpdate?: IncidentUpdateDraft | null;
  /** Set after client_activity_recent (coach) so confirm/detail can auto-prepare. */
  activityCoachClient?: { id: string; name: string; searchKey: string } | null;
};

export type AiWriteResult = {
  kind: "client" | "client_prepare" | "client_patch_prepare" | "client_activity_prepare" | "client_task_prepare" | "task" | "task_prepare" | "task_update_prepare" | "client_activity" | "enquiry" | "enquiry_prepare" | "enquiry_task_prepare" | "client_patch" | "enquiry_convert" | "task_update" | "incident" | "incident_prepare" | "incident_task_prepare" | "incident_update";
  label: string;
  href: string;
  preview?: PreparePreview;
};

export type PreparePreviewField = { label: string; value: string };

export type PreparePreview = {
  recordType: string;
  headline: string;
  fields: PreparePreviewField[];
};

export type ChatDisplayAttachment = {
  type: "table" | "cards" | "prepare";
  title: string;
  columns?: string[];
  rows?: Record<string, string>[];
  cards?: {
    title: string;
    subtitle?: string;
    meta?: string;
    badge?: string;
    href: string;
  }[];
  prepare?: {
    label: string;
    href: string;
    hint: string;
    preview?: PreparePreview;
  };
};

export type ChatRequestBody = {
  agentId: string;
  messages: ChatMessage[];
  threadState?: ChatThreadState;
  pagePath?: string;
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
