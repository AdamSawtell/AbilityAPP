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
      description:
        "Get one client record. For activity coach Step 1, pass forActivity: true — show the client link and wait for user confirmation before loading recent notes.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "Client record id" },
          searchKey: { type: "string", description: "Client search key (e.g. Bern)" },
          name: { type: "string", description: "Client name or partial match" },
          forActivity: {
            type: "boolean",
            description: "true when starting activity coach — Step 1 confirm client before recent notes",
          },
          purpose: {
            type: "string",
            enum: ["activity_coach"],
            description: "Use activity_coach same as forActivity: true",
          },
        },
      },
    },
  },
  client_activity_recent: {
    type: "function",
    function: {
      name: "client_activity_recent",
      description:
        "Step 2 of activity coach — load last N notes AFTER user confirmed the client. Use purpose=coach and limit=5. Do not call before Step 1 confirmation.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          searchKey: { type: "string" },
          clientName: { type: "string" },
          name: { type: "string" },
          limit: { type: "number", description: "How many notes (default 5, max 10)" },
          purpose: {
            type: "string",
            enum: ["summary", "coach"],
            description: "summary = summarise for handover; coach = review then ask questions before preparing a new note",
          },
        },
      },
    },
  },
  client_safety_profile: {
    type: "function",
    function: {
      name: "client_safety_profile",
      description:
        "Get a client's alerts, consents, risks, and service locations — use before visits or handover when safety context matters.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          searchKey: { type: "string" },
          clientName: { type: "string" },
          name: { type: "string" },
        },
      },
    },
  },
  client_tasks_open: {
    type: "function",
    function: {
      name: "client_tasks_open",
      description: "List open or in-progress tasks linked to a client record.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          searchKey: { type: "string" },
          clientName: { type: "string" },
          name: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  client_task_prepare: {
    type: "function",
    function: {
      name: "client_task_prepare",
      description:
        "Prepare a follow-up task linked to a client for human review and save. Never save yourself.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          searchKey: { type: "string" },
          clientName: { type: "string" },
          name: { type: "string" },
          title: { type: "string", description: "Task title" },
          description: { type: "string" },
          dueDate: { type: "string" },
          priority: { type: "string" },
          assigneeUserName: { type: "string" },
          assigneeRoleName: { type: "string" },
        },
        required: ["title"],
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
  task_list_mine: {
    type: "function",
    function: {
      name: "task_list_mine",
      description:
        "List active tasks assigned to the signed-in user or their current role, sorted by due date.",
      parameters: {
        type: "object",
        properties: {
          scope: { type: "string", enum: ["user", "role"], description: "Default user" },
          limit: { type: "number" },
        },
      },
    },
  },
  task_list_overdue: {
    type: "function",
    function: {
      name: "task_list_overdue",
      description: "List overdue active tasks visible to the signed-in user.",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number" },
        },
      },
    },
  },
  task_update_prepare: {
    type: "function",
    function: {
      name: "task_update_prepare",
      description:
        "Prepare a task update (note, complete, reassign, or status change) for human review on the task record. Never save yourself.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string" },
          documentNo: { type: "string" },
          title: { type: "string" },
          action: {
            type: "string",
            enum: ["complete", "reassign", "add_note", "change_status"],
          },
          note: { type: "string" },
          resolutionNotes: { type: "string" },
          status: { type: "string" },
          assignmentType: { type: "string", enum: ["user", "role"] },
          assigneeUserName: { type: "string" },
          assigneeRoleName: { type: "string" },
        },
        required: ["action"],
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
      description: "Legacy — disabled. Use task_create_prepare instead.",
      parameters: { type: "object", properties: {} },
    },
  },
  task_create_prepare: {
    type: "function",
    function: {
      name: "task_create_prepare",
      description:
        "Prepare a new task for human review and save. Needs title and assignee (user or role). Never save yourself.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          taskTypeId: { type: "string" },
          priority: { type: "string" },
          dueDate: { type: "string" },
          assignmentType: { type: "string", enum: ["user", "role"] },
          assigneeUserId: { type: "string" },
          assigneeUserName: { type: "string" },
          assigneeRoleId: { type: "string" },
          assigneeRoleName: { type: "string" },
          entityType: { type: "string" },
          entityId: { type: "string" },
          entityLabel: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  client_draft_create: {
    type: "function",
    function: {
      name: "client_draft_create",
      description:
        "Legacy — prefer client_create_prepare. Prepares an in-chat draft only; does not open the save form.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string" },
          lastName: { type: "string" },
          preferredName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          status: { type: "string" },
          fundingBody: { type: "string" },
          disability: { type: "string" },
          services: { type: "string" },
        },
        required: ["firstName", "lastName"],
      },
    },
  },
  client_create_prepare: {
    type: "function",
    function: {
      name: "client_create_prepare",
      description:
        "Prepare a new client record for the user to review and save. Collect first and last name (and optional contact/funding fields), then call this tool. Never save yourself — the user must open the review link and click Save on the form.",
      parameters: {
        type: "object",
        properties: {
          firstName: { type: "string", description: "Legal first name" },
          lastName: { type: "string", description: "Legal last name" },
          preferredName: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          status: { type: "string", description: "Client status code, default 1_Prospect" },
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
      description: "Legacy — disabled. Use client_create_prepare instead.",
      parameters: { type: "object", properties: {} },
    },
  },
  client_patch_prepare: {
    type: "function",
    function: {
      name: "client_patch_prepare",
      description:
        "Prepare client field updates for human review. Identify the client and fields to change; never save yourself.",
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
  client_activity_prepare: {
    type: "function",
    function: {
      name: "client_activity_prepare",
      description:
        "Prepare a client activity note for human review. Call as soon as you have client and visit details — same turn as the user's description. Pass activityDate as YYYY-MM-DD (use today when they say today). Never save yourself — the user clicks Save activity in the review popup.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          searchKey: { type: "string" },
          clientName: { type: "string" },
          name: { type: "string" },
          subject: { type: "string" },
          title: { type: "string" },
          notes: { type: "string" },
          description: { type: "string" },
          body: { type: "string" },
          activityType: { type: "string" },
          activityDate: { type: "string", description: "YYYY-MM-DD, default today" },
          date: { type: "string", description: "Alias for activityDate" },
        },
      },
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
      description: "Legacy — disabled. Use enquiry_create_prepare instead.",
      parameters: { type: "object", properties: {} },
    },
  },
  enquiry_create_prepare: {
    type: "function",
    function: {
      name: "enquiry_create_prepare",
      description:
        "Prepare a new enquiry for human review. Needs first and last name. Never save yourself.",
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
          status: { type: "string" },
        },
        required: ["firstName", "lastName"],
      },
    },
  },
  enquiry_list_recent: {
    type: "function",
    function: {
      name: "enquiry_list_recent",
      description: "List enquiries updated within the last N hours (default one week).",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "number" },
          limit: { type: "number" },
          status: { type: "string" },
        },
      },
    },
  },
  enquiry_task_prepare: {
    type: "function",
    function: {
      name: "enquiry_task_prepare",
      description: "Prepare a follow-up task linked to an enquiry for human review and save.",
      parameters: {
        type: "object",
        properties: {
          enquiryId: { type: "string" },
          documentNo: { type: "string" },
          enquiryName: { type: "string" },
          name: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          dueDate: { type: "string" },
          assigneeUserName: { type: "string" },
          assigneeRoleName: { type: "string" },
        },
        required: ["title"],
      },
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
  incident_search: {
    type: "function",
    function: {
      name: "incident_search",
      description:
        "Search incident reports by text, status, severity, NDIS reportable flag, overdue, or linked client/employee id.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          status: { type: "string" },
          severity: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
          reportableOnly: { type: "boolean" },
          overdueOnly: { type: "boolean" },
          clientId: { type: "string" },
          employeeId: { type: "string" },
          limit: { type: "number" },
          sortBy: { type: "string", enum: ["occurred", "deadline"] },
        },
      },
    },
  },
  incident_get: {
    type: "function",
    function: {
      name: "incident_get",
      description:
        "Get full incident details including parties, NDIS checklist, notifications, actions, and linked client/employee.",
      parameters: {
        type: "object",
        properties: {
          incidentId: { type: "string" },
          documentNo: { type: "string" },
          title: { type: "string" },
        },
      },
    },
  },
  incident_list_recent: {
    type: "function",
    function: {
      name: "incident_list_recent",
      description: "List incidents that occurred or were reported within the last N hours (default 168 = one week).",
      parameters: {
        type: "object",
        properties: {
          hours: { type: "number" },
          limit: { type: "number" },
          openOnly: { type: "boolean" },
          reportableOnly: { type: "boolean" },
        },
      },
    },
  },
  incident_compliance_summary: {
    type: "function",
    function: {
      name: "incident_compliance_summary",
      description:
        "NDIS compliance snapshot: open reportable count, overdue deadlines, incomplete checklists, and top items.",
      parameters: { type: "object", properties: {} },
    },
  },
  incident_linked_search: {
    type: "function",
    function: {
      name: "incident_linked_search",
      description: "Find all incidents linked to a client or employee (primary or party).",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string" },
          clientName: { type: "string" },
          searchKey: { type: "string" },
          employeeId: { type: "string" },
          employeeName: { type: "string" },
          limit: { type: "number" },
        },
      },
    },
  },
  incident_draft_create: {
    type: "function",
    function: {
      name: "incident_draft_create",
      description: "Prepare an incident report draft for user confirmation before saving.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          severity: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
          category: { type: "string" },
          isReportable: { type: "boolean" },
          reportableType: { type: "string" },
          clientId: { type: "string" },
          clientName: { type: "string" },
          employeeId: { type: "string" },
          locationId: { type: "string" },
        },
      },
    },
  },
  incident_draft_confirm: {
    type: "function",
    function: {
      name: "incident_draft_confirm",
      description: "Legacy — disabled. Use incident_create_prepare instead.",
      parameters: { type: "object", properties: {} },
    },
  },
  incident_create_prepare: {
    type: "function",
    function: {
      name: "incident_create_prepare",
      description:
        "Prepare a new incident report for human review. Needs title or description. Never save yourself.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          whatHappened: { type: "string" },
          severity: { type: "string" },
          category: { type: "string" },
          isReportable: { type: "boolean" },
          reportableType: { type: "string" },
          clientId: { type: "string" },
          clientName: { type: "string" },
          employeeId: { type: "string" },
          locationId: { type: "string" },
        },
      },
    },
  },
  incident_task_prepare: {
    type: "function",
    function: {
      name: "incident_task_prepare",
      description: "Prepare a follow-up task linked to an incident for human review and save.",
      parameters: {
        type: "object",
        properties: {
          incidentId: { type: "string" },
          documentNo: { type: "string", description: "Incident document number e.g. INC-001" },
          incidentTitle: { type: "string" },
          taskTitle: { type: "string", description: "Title for the new task" },
          description: { type: "string" },
          dueDate: { type: "string" },
          assigneeUserName: { type: "string" },
          assigneeRoleName: { type: "string" },
        },
        required: ["taskTitle"],
      },
    },
  },
  incident_update_draft_create: {
    type: "function",
    function: {
      name: "incident_update_draft_create",
      description:
        "Prepare an incident update for confirmation: change status, manager review, commission notified, investigation note, or close.",
      parameters: {
        type: "object",
        properties: {
          incidentId: { type: "string" },
          documentNo: { type: "string" },
          title: { type: "string" },
          action: {
            type: "string",
            enum: ["change_status", "manager_review", "commission_notified", "add_investigation_note", "close"],
          },
          status: { type: "string" },
          note: { type: "string" },
          investigationNote: { type: "string" },
          ndisNotificationRef: { type: "string" },
        },
        required: ["action"],
      },
    },
  },
  incident_update_draft_confirm: {
    type: "function",
    function: {
      name: "incident_update_draft_confirm",
      description: "Confirm and save the pending incident update to the database.",
      parameters: { type: "object", properties: {} },
    },
  },
  employee_search: {
    type: "function",
    function: {
      name: "employee_search",
      description: "Find employees by name, search key, email, or job title.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          limit: { type: "number" },
          activeOnly: { type: "boolean", description: "Default true" },
        },
      },
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
