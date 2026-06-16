# Process 6: Assign task

| | |
|---|---|
| **ID** | `assign-task` |
| **Status** | Live |
| **Module** | Tasks (Core) |

## Purpose

Create a task and assign it to a user or role, linked to a business record (client, enquiry, employee, etc.) or from the task hub.

## Trigger

- User clicks **Assign task** on a record tasks panel, task hub, or task detail page.
- User creates a new task from `/tasks/new` when permitted.

## Outcome

| Record | Change |
|--------|--------|
| **Task** | New `task` row with type, subject, assignee, due date, and entity link |
| **Activity** | Optional `task_activity` log entry on create/update |
| **Navigation** | User may open the new task detail |

## Steps

1. **Guard** — `canProcess("assign-task")` and task type permissions (`canCreate`).
2. **Compose task** — Subject, type, priority, due date, assignee (user or role).
3. **Link entity** — Optional link to client, enquiry, employee, contract, etc.
4. **Persist** — Task saved via data store / Supabase.

## Rules and constraints

- Task type must be selectable for the role (`app_role_task_type`).
- Assignees limited to active users and roles in the system.

## Code locations

| Role | File |
|------|------|
| UI | `web/src/components/record-tasks-panel.tsx`, `web/src/components/task-hub-view.tsx`, `web/src/components/task-pages.tsx` |
| Logic | `web/src/lib/task.ts`, `web/src/lib/data-store.tsx` |

## Database

- **Write:** `task`, `task_activity`

## Related processes

- [07-action-task.md](./07-action-task.md) — assignee works the task

Process visibility is controlled per role in **Admin → Roles** and **Admin → Task management**.
