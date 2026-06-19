# Process 11: Review employee credential

HR signs off credentials submitted from My workplace or added with status **Pending review**.

## Trigger

- User with `review-employee-credential` process acts in **Workforce planning → Review queue** or on the employee **Credentials Assigned** tab.

## Who can review

- CEO, HR executive, HR manager, HR officer.
- Support coordinators and general executives do **not** have this process by default.

## Steps

1. Open review queue or the Review task from Tasks.
2. Locate credential under **Credentials pending review**.
3. Verify evidence (employee record or My workplace submission).
4. Approve → status **Current**, or reject → **Rejected** with review notes.
5. Automation task `tar-employee-credential-pending-review` closes for that credential.
6. Employee activity logged on the employee record.

## Windows and processes

| Item | Key |
|------|-----|
| Review process | `review-employee-credential` |
| Credentials tab | `employee-credentials-assigned` |

## API

- `POST /api/workforce/reviews` — body `{ type: "credential", employeeId, credentialId, decision, reviewNotes? }`.

## Related

- [Process 9: Submit employee credential](09-submit-employee-credential.md)
