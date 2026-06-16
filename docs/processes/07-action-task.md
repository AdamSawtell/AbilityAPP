# Process 7: Action task

| | |
|---|---|
| **ID** | `action-task` |
| **Status** | Live |
| **Module** | Tasks (Core) |

## Purpose

Let assignees start, complete, or cancel tasks assigned to them personally or to their active role.

## Trigger

- User opens a task assigned to them or their role.
- Changes status (e.g. In progress → Complete) on the task detail page or hub.

## Outcome

| Record | Change |
|--------|--------|
| **Task** | Status, completion date, and assignee fields updated |
| **Activity** | `task_activity` row logged for the status change |

## Steps

1. **Guard** — `canProcess("action-task")` and user is assignee or role matches.
2. **Validate** — Task is not already terminal (cancelled/complete) where rules apply.
3. **Update status** — User selects next status and optional notes.
4. **Persist** — Task and activity saved.

## Rules and constraints

- Users without `assign-task` may still action tasks if they have `action-task` and are the assignee.
- Task hub scopes (assigned to me, my role) respect window access.

## Code locations

| Role | File |
|------|------|
| UI | `web/src/components/task-pages.tsx`, `web/src/components/task-hub-view.tsx` |
| Access | `web/src/lib/task-access.ts` |
| Logic | `web/src/lib/task.ts`, `web/src/lib/data-store.tsx` |

## Database

- **Write:** `task`, `task_activity`

## Related processes

- [06-assign-task.md](./06-assign-task.md) — task creation and assignment

Process visibility is controlled per role in **Admin → Roles**.
