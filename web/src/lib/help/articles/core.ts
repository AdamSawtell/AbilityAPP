import type { HelpArticle } from "@/lib/help/types";

export const tasksArticle: HelpArticle = {
  id: "article-tasks",
  slug: "tasks",
  title: "Tasks",
  summary: "Create, assign, filter, and complete tasks across your organisation.",
  category: "Core",
  keywords: ["tasks", "requests", "assign", "due date", "overdue", "complete", "task hub"],
  relatedRoutes: ["/tasks", "/tasks/new"],
  windowKeys: ["tasks-assigned-to-me", "tasks-for-my-role", "tasks-all", "tasks-past"],
  lastUpdated: "2025-06-15",
  sections: [
    {
      id: "task-views",
      title: "Task views",
      body: "Open Tasks from the sidebar. Your role controls which scopes you see.",
      bullets: [
        "Assigned to me: tasks where you are the assignee",
        "To my role: tasks assigned to your active role; any team member with that role can action them",
        "All tasks: full list when your role includes it",
        "Past: completed and cancelled tasks",
      ],
      relatedRoutes: ["/tasks"],
    },
    {
      id: "task-hub",
      title: "Task hub filters and grouping",
      body: "The task hub lets you search, filter by status and priority, group by due date or type, and sort the list. Stat chips at the top highlight overdue, due today, and open counts.",
      bullets: [
        "Use the search box to match title, document number, or linked record.",
        "Group by Due, Type, Status, or Priority depending on how you work.",
        "Preferences are saved in your browser for the task hub layout.",
      ],
    },
    {
      id: "create-task",
      title: "Create a task",
      body: "Click New task from the Tasks page or from a linked record when your role allows assign-task.",
      steps: [
        "Open Tasks and click New task.",
        "Enter a title, task type, priority, and due date if needed.",
        "Assign to a user, a role, or both depending on the workflow.",
        "Link the task to an enquiry, client, employee, or location when relevant.",
        "Save the task.",
      ],
      relatedRoutes: ["/tasks/new"],
    },
    {
      id: "action-task",
      title: "Work a task",
      body: "Open a task from the list to update status, add notes, and mark it complete. Overdue tasks show a red indicator on the list and in the sidebar badge.",
      steps: [
        "Open the task from Tasks or from Home calendar.",
        "Set status to In progress when you start.",
        "Add outcome notes before completing if your task type requires it.",
        "Set status to Completed or Cancelled when finished.",
      ],
      relatedRoutes: ["/tasks"],
    },
    {
      id: "task-types",
      title: "Task types and permissions",
      body: "Administrators define task types under System → Tasks → Task management. Your role grants create, assign, and complete rights per task type.",
      relatedRoutes: ["/system/tasks/task-management"],
      windowKeys: ["admin-task-management"],
    },
  ],
};

export const enquiriesArticle: HelpArticle = {
  id: "article-enquiries",
  slug: "enquiries",
  title: "Enquiries",
  summary: "Capture intake enquiries, track activity, and convert participants to clients.",
  category: "Core",
  keywords: ["enquiry", "intake", "participant", "convert", "client", "enquiry to client"],
  relatedRoutes: ["/enquiries", "/enquiries/new"],
  windowKeys: ["enquiries"],
  lastUpdated: "2025-06-15",
  sections: [
    {
      id: "enquiry-list",
      title: "Enquiries list",
      body: "Active enquiries shows every open intake record. Click a row or search key to open the enquiry in the workspace.",
      relatedRoutes: ["/enquiries"],
    },
    {
      id: "create-enquiry",
      title: "Create an enquiry",
      steps: [
        "Open Enquiries from the sidebar.",
        "Click New enquiry.",
        "Complete Enquiry details and Participant tabs.",
        "Add Support needs and log Activity as the intake progresses.",
        "Save your changes.",
      ],
      relatedRoutes: ["/enquiries/new"],
    },
    {
      id: "enquiry-tabs",
      title: "Enquiry tabs",
      body: "Each enquiry has four tabs grouped under Record and Work.",
      bullets: [
        "Enquiry details: intake metadata, source, status, and coordinator",
        "Participant: name, contact, demographics, and funding hints",
        "Support needs: disability, services sought, and notes",
        "Activity: line table of calls, emails, and meetings",
      ],
    },
    {
      id: "convert-to-client",
      title: "Convert enquiry to client",
      body: "When intake is approved, convert the enquiry to a support receiver client. This is process enquiry-to-client. The new client retains a link back to the source enquiry.",
      steps: [
        "Open the enquiry and confirm participant details are complete.",
        "Use Convert to client from the enquiry actions when your role allows the process.",
        "Review the client record created from the enquiry.",
        "Continue setup on the client Overview and Full profile tabs.",
      ],
      windowKeys: ["enquiries", "clients"],
    },
  ],
};
