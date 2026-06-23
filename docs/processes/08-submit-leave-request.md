# Process 8: Submit leave request

Staff submit leave through **My workplace → Leave**. Managers and HR approve in **Workforce planning → Review queue** or via **Approve** tasks. AbilityVua does not email assignees.

## Trigger

- Staff with `submit-leave-request` process and `my-leave` window submits from `/my/leave`.

## Steps

1. Staff chooses leave type, start and end dates, and optional notes.
2. System validates leave balance for the chosen type.
3. System creates an `employee_leave_request` row with status **Requested** and logs an employee activity.
4. Task automation fires `employee.leave_requested` → **Approve** task assigned to reports-to manager (fallback HR manager role).
5. HR or line manager approves or declines in **Workforce planning → Review queue** (`/workforce-planning#reviews`).
6. On approve: entitlement `balance_days` is reduced; matching automation task closes.
7. Staff sees the outcome on **My workplace → Leave** (including decline reason when provided).

## Windows and processes

| Item | Key |
|------|-----|
| My leave window | `my-leave` |
| Submit process | `submit-leave-request` |
| Approve process | `approve-leave-request` |

## API

- `GET /api/my/leave` — own leave requests and entitlements.
- `POST /api/my/leave` — scoped to the signed-in user's linked employee only.
- `GET/POST /api/workforce/reviews` — review queue and decisions (HR / managers).

## Related

- [Process 10: Submit leave on behalf](10-submit-leave-on-behalf.md)
- [Process 12: Approve leave request](12-approve-leave-request.md)
