# Process 12: Approve leave request

HR and line managers approve or decline leave submitted from My workplace or on behalf.

## Trigger

- User with `approve-leave-request` process acts in **Workforce planning → Review queue**, from an **Approve** task, or on the employee **Leave** tab.

## Who can approve

| Role | Scope |
|------|--------|
| CEO, HR executive, HR manager, HR officer | All pending leave |
| Rostering manager, team leader | Direct reports only (`reports_to_id`) |

Support coordinators do **not** have org-wide leave approval by default.

## Steps

1. Open review queue, Approve task, or employee Leave tab.
2. Locate request with status **Requested**.
3. Approve or decline (optional decline reason).
4. On approve: deduct `days_requested` from matching `employee_leave_entitlement.balance_days`.
5. Automation task `tar-employee-leave-requested` closes for that request.
6. Employee activity logged; staff see outcome on My workplace → Leave.

## Windows and processes

| Item | Key |
|------|-----|
| Approve process | `approve-leave-request` |
| Leave tab | `employee-leave` |

## API

- `POST /api/workforce/reviews` — body `{ type: "leave", employeeId, requestId, decision, declineReason? }`.

## Related

- [Process 8: Submit leave request](08-submit-leave-request.md)
- [Process 10: Submit leave on behalf](10-submit-leave-on-behalf.md)
