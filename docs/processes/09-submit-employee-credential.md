# Process 9: Submit employee credential

Staff submit credentials with evidence through **My workplace → Credentials**. HR reviews on the employee record and signs off when complete.

## Trigger

- Staff with `submit-employee-credential` process and `my-credentials` window submits from `/my/credentials`.

## Steps

1. Staff chooses credential type, dates, number, and an evidence reference (document link or file ref).
2. System creates an `employee_credential` row with status **Pending review**, `staff_submitted = true`, and logs an employee activity.
3. HR reviews on **Employees → Credentials Assigned** — sets status to **Current** (approved) or **Rejected** with review notes.
4. Staff sees the outcome on **My workplace → Credentials** and on the compliance dashboard.

## Windows and processes

| Item | Key |
|------|-----|
| My credentials window | `my-credentials` |
| Submit process | `submit-employee-credential` |

## API

- `GET /api/my/credentials` — list own credentials (scoped to linked employee).
- `POST /api/my/credentials` — submit a new credential for HR review.
