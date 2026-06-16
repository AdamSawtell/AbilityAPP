import type { ChatCompletionTool } from "openai/resources/chat/completions";
import type { AiAgentRecord, AiToolName } from "@/lib/ai/types";
import { agentHasTool } from "@/lib/ai/seed";

const TOOL_DEFS: Record<AiToolName, ChatCompletionTool> = {
  help_search: {
    type: "function",
    function: {
      name: "help_search",
      description: "Search the in-app how-to guide for articles and steps relevant to the user's question.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query, e.g. how to create a client" },
          limit: { type: "number", description: "Max results (default 8)" },
        },
        required: ["query"],
      },
    },
  },
  activity_search: {
    type: "function",
    function: {
      name: "activity_search",
      description:
        "Search activity notes across clients, enquiries, employees, and locations. Filter by text and optionally by records updated within the last N hours.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Text to match in subject, description, or type (e.g. ambulance)" },
          updatedWithinHours: {
            type: "number",
            description: "Only include activities updated within this many hours (e.g. 2 for last 2 hours)",
          },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  client_search: {
    type: "function",
    function: {
      name: "client_search",
      description: "Find client records by name, search key, email, or phone. Sort by name or most recently updated.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Name or partial match (optional — lists clients if empty)" },
          limit: { type: "number", description: "Max results (default 15)" },
          sortBy: { type: "string", enum: ["name", "updated"], description: "Sort order (default name)" },
        },
      },
    },
  },
  client_get: {
    type: "function",
    function: {
      name: "client_get",
      description: "Get one client's details and recent activity notes. Use clientId, searchKey, or name.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "Client record id" },
          searchKey: { type: "string", description: "Client search key (e.g. Bern)" },
          name: { type: "string", description: "Client name or partial match" },
        },
      },
    },
  },
  client_list_recent: {
    type: "function",
    function: {
      name: "client_list_recent",
      description: "List clients updated most recently within the last N hours (default 168 = one week).",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "number", description: "Look back this many hours (default 168)" },
          limit: { type: "number", description: "Max results (default 20)" },
        },
      },
    },
  },
  records_updated_since: {
    type: "function",
    function: {
      name: "records_updated_since",
      description: "List clients, enquiries, employees, and locations updated within the last N hours.",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "number", description: "Look back this many hours (default 24)" },
          limit: { type: "number", description: "Max results (default 25)" },
        },
      },
    },
  },
  task_search: {
    type: "function",
    function: {
      name: "task_search",
      description: "Search tasks by title, assignee, status, or linked record.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Text to match in title, description, or linked record" },
          status: { type: "string", description: "Filter by status: Open, In progress, Completed, Cancelled" },
          limit: { type: "number", description: "Max results (default 15)" },
          sortBy: { type: "string", enum: ["updated", "due"], description: "Sort order (default updated)" },
        },
      },
    },
  },
  task_draft_create: {
    type: "function",
    function: {
      name: "task_draft_create",
      description:
        "Prepare a task draft once you have a title and assignment (user or role). Use defaults for everything else unless the user specified them.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title" },
          assignmentType: { type: "string", enum: ["user", "role"] },
          assigneeUserId: { type: "string", description: "User id if known" },
          assigneeUserName: { type: "string", description: "Username or display name if id unknown" },
          assigneeRoleId: { type: "string", description: "Role id if known" },
          assigneeRoleName: { type: "string", description: "Role name if id unknown (e.g. admin, Intake Coordinator)" },
          dueDate: { type: "string", description: "Due date — YYYY-MM-DD or DD/MM" },
          description: { type: "string", description: "Optional — only if user provided it" },
        },
        required: ["title", "assignmentType"],
      },
    },
  },
  task_draft_confirm: {
    type: "function",
    function: {
      name: "task_draft_confirm",
      description: "Confirm the pending task draft after explicit user approval. Saves the task to the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  client_draft_create: {
    type: "function",
    function: {
      name: "client_draft_create",
      description:
        "Prepare a client draft once you have at least first and last name. Use defaults for optional fields unless the user specified them.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string", description: "Legal first name" },
          lastName: { type: "string", description: "Legal last name" },
          preferredName: { type: "string", description: "Preferred name if different" },
          email: { type: "string" },
          phone: { type: "string" },
          status: { type: "string", description: "Default 1_Prospect" },
          fundingBody: { type: "string" },
          disability: { type: "string" },
          services: { type: "string" },
        },
        required: ["firstName", "lastName"],
      },
    },
  },
  client_draft_confirm: {
    type: "function",
    function: {
      name: "client_draft_confirm",
      description: "Confirm the pending client draft after explicit user approval. Saves the client to the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  client_activity_draft_create: {
    type: "function",
    function: {
      name: "client_activity_draft_create",
      description:
        "Prepare a client activity note. Needs client (name or search key) plus subject or description. Confirm before saving.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          searchKey: { type: "string" },
          clientName: { type: "string", description: "Client name if id/search key unknown" },
          subject: { type: "string", description: "Short subject line" },
          description: { type: "string", description: "Full note text" },
          activityType: { type: "string", description: "Default Note" },
          activityDate: { type: "string", description: "YYYY-MM-DD, default today" },
        },
      },
    },
  },
  client_activity_draft_confirm: {
    type: "function",
    function: {
      name: "client_activity_draft_confirm",
      description: "Confirm and save the pending client activity note to the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  client_patch_draft_create: {
    type: "function",
    function: {
      name: "client_patch_draft_create",
      description: "Prepare an update to an existing client (status, phone, email, funding, etc.). Confirm before saving.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          searchKey: { type: "string" },
          clientName: { type: "string" },
          status: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          fundingBody: { type: "string" },
          disability: { type: "string" },
          services: { type: "string" },
          preferredName: { type: "string" },
        },
      },
    },
  },
  client_patch_draft_confirm: {
    type: "function",
    function: {
      name: "client_patch_draft_confirm",
      description: "Confirm and save the pending client field update to the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  task_update_draft_create: {
    type: "function",
    function: {
      name: "task_update_draft_create",
      description: "Prepare a task update: complete, reassign, add_note, or change_status. Confirm before saving.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          documentNo: { type: "string" },
          title: { type: "string" },
          action: { type: "string", enum: ["complete", "reassign", "add_note", "change_status"] },
          status: { type: "string" },
          note: { type: "string" },
          resolutionNotes: { type: "string" },
          assignmentType: { type: "string", enum: ["user", "role"] },
          assigneeUserId: { type: "string" },
          assigneeUserName: { type: "string" },
          assigneeRoleId: { type: "string" },
          assigneeRoleName: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  task_update_draft_confirm: {
    type: "function",
    function: {
      name: "task_update_draft_confirm",
      description: "Confirm and save the pending task update to the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  enquiry_search: {
    type: "function",
    function: {
      name: "enquiry_search",
      description: "Find enquiries by name, document number, or status.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
          sortBy: { type: "string", enum: ["name", "updated"] },
        },
      },
    },
  },
  enquiry_get: {
    type: "function",
    function: {
      name: "enquiry_get",
      description: "Get one enquiry with recent activity.",
      parameters: {
        type: "object",
        properties: {
          enquiryId: { type: "string" },
          documentNo: { type: "string" },
          name: { type: "string" },
        },
      },
    },
  },
  enquiry_draft_create: {
    type: "function",
    function: {
      name: "enquiry_draft_create",
      description: "Prepare a new enquiry draft. Needs first and last name. Confirm before saving.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          fundingBody: { type: "string" },
          disability: { type: "string" },
          services: { type: "string" },
          description: { type: "string" },
          enquirySource: { type: "string" },
        },
        required: ["firstName", "lastName"],
      },
    },
  },
  enquiry_draft_confirm: {
    type: "function",
    function: {
      name: "enquiry_draft_confirm",
      description: "Confirm and save the pending enquiry to the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  enquiry_convert_draft_create: {
    type: "function",
    function: {
      name: "enquiry_convert_draft_create",
      description: "Prepare converting an enquiry to a client. Confirm before converting.",
      parameters: {
        type: "object",
        properties: {
          enquiryId: { type: "string" },
          documentNo: { type: "string" },
          enquiryName: { type: "string" },
        },
      },
    },
  },
  enquiry_convert_draft_confirm: {
    type: "function",
    function: {
      name: "enquiry_convert_draft_confirm",
      description: "Confirm and convert the pending enquiry to a client in the database.",
      parameters: { type: "object", properties: {} },
    },
  },
};

export function toolsForAgent(agent: AiAgentRecord): ChatCompletionTool[] {
  return (Object.keys(TOOL_DEFS) as AiToolName[])
    .filter((name) => agentHasTool(agent, name))
    .map((name) => TOOL_DEFS[name]);
}

export function isKnownTool(name: string): name is AiToolName {
  return name in TOOL_DEFS;
}
