# Process 8: Submit leave request

Staff submit leave through **My workplace → Leave**. Managers approve or decline on the employee HR record.

## Trigger

- Staff with `submit-leave-request` process and `my-leave` window submits a request from `/my/leave`.

## Steps

1. Staff chooses leave type, start and end dates, and optional notes.
2. System creates an `employee_leave_request` row with status **Requested** and logs an employee activity.
3. Manager reviews on **Employees → Leave** tab (status **Approved**, **Declined**, or **Cancelled**).
4. Staff sees the outcome on **My workplace → Leave** (including decline reason when provided).

## Windows and processes

| Item | Key |
|------|-----|
| My leave window | `my-leave` |
| Submit process | `submit-leave-request` |

## API

- `POST /api/my/leave` — scoped to the signed-in user's linked employee only.
