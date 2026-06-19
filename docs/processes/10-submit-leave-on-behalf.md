# Process 10: Submit leave on behalf

Managers and coordinators enter leave for an employee who cannot use **My workplace** themselves. The request follows the same approval and task path as self-service leave.

## Trigger

- User with `submit-leave-on-behalf` process submits from **Workforce planning → Submit leave on behalf** (`/workforce-planning#submit-leave`).

## Steps

1. Select employee, leave type, date range, and optional notes.
2. System validates the employee's leave balance.
3. System creates `employee_leave_request` with status **Requested** and logs activity (submitted on behalf).
4. Task automation fires `employee.leave_requested` for the target employee.
5. Manager or HR approves in the review queue — same as [Process 12](12-approve-leave-request.md).

## Windows and processes

| Item | Key |
|------|-----|
| Workforce planning window | `workforce-planning` |
| Submit on behalf process | `submit-leave-on-behalf` |

## API

- `POST /api/workforce/leave` — body includes `employeeId` for the target employee.

## Related

- [Process 8: Submit leave request](08-submit-leave-request.md)
- [Process 12: Approve leave request](12-approve-leave-request.md)
