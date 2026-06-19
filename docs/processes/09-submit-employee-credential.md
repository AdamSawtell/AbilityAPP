# Process 9: Submit employee credential

Staff submit credentials with evidence through **My workplace → Credentials**. HR reviews in **Workforce planning → Review queue** or via **Review** tasks. AbilityAPP does not email assignees.

## Trigger

- Staff with `submit-employee-credential` process and `my-credentials` window submits from `/my/credentials`.

## Steps

1. Staff chooses credential type, dates, number, and evidence (link or uploaded file reference).
2. System creates an `employee_credential` row with status **Pending review**, `staff_submitted = true`, and logs an employee activity.
3. Task automation fires `employee.credential_pending_review` → **Review** task assigned to HR officer role.
4. HR approves or rejects in **Workforce planning → Review queue** or on **Employees → Credentials Assigned**.
5. Matching automation task closes on decision.
6. Staff sees the outcome on **My workplace → Credentials** and on the compliance dashboard.

## Windows and processes

| Item | Key |
|------|-----|
| My credentials window | `my-credentials` |
| Submit process | `submit-employee-credential` |
| Review process | `review-employee-credential` |

## API

- `GET /api/my/credentials` — list own credentials (scoped to linked employee).
- `POST /api/my/credentials` — submit a new credential for HR review.
- `GET/POST /api/workforce/reviews` — review queue and credential decisions.

## Related

- [Process 11: Review employee credential](11-review-employee-credential.md)
