# My Workplace — developer notes

## Communications: tasks, not email

AbilityERP does **not** send workforce or My Workplace notifications by email. All actionable comms go through **tasks** created from **task templates** (`tt-review`, `tt-approve`, `tt-check`, and related types).

| Channel | Use |
|--------|-----|
| **Task automations** | Primary — assign work to a role, org position, or individual when something needs action |
| **In-app UI** | Secondary — review queue on Workforce planning, home dashboard banners, My Workplace summaries |
| **Email** | Not used for this module |

### Review and approval flow

1. Staff submit leave or credentials in My Workplace.
2. Task automations fire on `employee.credential_pending_review` and `employee.leave_requested` (see `supabase/seed-task-automation.sql` and `web/src/lib/task-automation/run-server.ts`).
3. The assignee completes the task (review / approve) and may also use the **Workforce review queue** as a convenience UI.
4. The queue and banners are **not** a separate comms channel — they surface the same work that tasks represent.

Align new triggers with existing patterns in `web/src/lib/task-automation/` and seed rules in `supabase/seed-task-automation.sql` (for example incident review tasks use `tt-review` with `assignee_mode` of `org_position` or `assignee_role_id`).

### Access for review actions

| Action | Who |
|--------|-----|
| Credential review (`review-employee-credential`) | CEO, HR executive, HR manager, HR officer |
| Leave approval (`approve-leave-request`) | Same HR roles, plus rostering manager and team leader for **direct reports only** |

Support coordinators and general operations executives do **not** receive review processes. HR roles see all pending leave; line managers see direct reports only (`web/src/lib/workforce/review-server.ts`).

### Leave balance

When leave is **approved**, `days_requested` is deducted from the matching `employee_leave_entitlement.balance_days` row (same leave type). Submit already validates against the current balance.

### Contract documents

Staff-visible contracts store a **viewable URL** in `employee_document.document_ref` (HTTPS PDF). The My Contracts viewer embeds URLs; plain text refs are shown as reference-only fallbacks.
