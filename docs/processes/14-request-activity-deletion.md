# Process 14: Request activity deletion

| | |
|---|---|
| **ID** | `request-activity-deletion` |
| **Status** | Live |
| **Module** | Tasks (Core) — activity governance |

## Purpose

Staff who are not administrators cannot remove activity lines directly. They use **Request deletion** on an activity row; the system creates an **Activity deletion** task assigned to the **AbilityVua Admin** role.

## Trigger

- User clicks **Request deletion** on an activity line (client, enquiry, employee, or location Activity tab) when `deletePolicy` is `admin-only` and the user is not in the Admin role.

## Outcome

| Record | Change |
|--------|--------|
| **Task** | New `app_task` with type `tt-activity-delete`, assignee role `role-admin`, entity link to parent record |
| **Activity line** | Unchanged until an administrator removes it on the record |
| **Process audit** | `request-activity-deletion` logged with entity and line reference |

## Steps

1. **Guard** — `canProcess("request-activity-deletion")`; user is not Admin; line is on an activity table with `deletePolicy: admin-only`.
2. **Dedupe** — If an open task already exists for the same line (`automationDedupeKey`), show message and do not create a duplicate.
3. **Create task** — Title and description summarise the line; due date +3 days; assigned to Admin role.
4. **Admin action** — Administrator opens the linked record, reviews the line, removes it, saves the parent record, and completes the task.

## Rules and constraints

- Only **AbilityVua Admin** may use **Remove** on activity lines.
- Other line tables (alerts, credentials, etc.) keep the default delete policy unless explicitly set.
- Duplicate deletion requests for the same line are blocked while a task is Open or In progress.

## Code locations

| Role | File |
|------|------|
| Policy + task builder | `web/src/lib/activity-line-policy.ts` |
| UI | `web/src/components/line-item-table.tsx`, `web/src/components/record-line-drawer.tsx` |
| Table config | `web/src/lib/client-line-tables.ts`, `employee-line-tables.ts`, `location-line-tables.ts` |
| Process catalog | `web/src/lib/access/catalog.ts` |
| Task type | `web/src/lib/task-type.ts`, migration `20260623120000_activity_delete_task_type.sql` |
