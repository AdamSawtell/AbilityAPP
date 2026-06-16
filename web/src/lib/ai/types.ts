export type AiToolName =
  | "help_search"
  | "activity_search"
  | "client_search"
  | "records_updated_since"
  | "task_draft_create"
  | "task_draft_confirm";

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

export type ChatThreadState = {
  pendingTaskDraft?: TaskDraft | null;
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
  createdTask?: Omit<TaskDraft, never>;
};
