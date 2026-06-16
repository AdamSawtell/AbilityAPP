# Process 2: Assign employee credential

| | |
|---|---|
| **ID** | `assign-employee-credential` |
| **Status** | Live |
| **Module** | People → Employees → Credentials Assigned |

## Purpose

Record qualifications, licences, and other credentials held by an employee Business Partner so compliance and rostering can be checked.

## Trigger

- User opens an employee (`/employees/[id]`).
- Edits lines on the **Credentials Assigned** tab when the role has this process.

## Outcome

| Record | Change |
|--------|--------|
| **Employee** | `employee_credential` child rows added, updated, or removed |
| **Persist** | Saved to Supabase (or local store when DB not configured) |

## Steps

1. **Guard** — `canProcess("assign-employee-credential")` and window access to `employee-credentials-assigned`.
2. **Edit lines** — User adds credential type, number, issuer, valid dates, and notes.
3. **Save** — Employee record saved with normalized credential line numbers.

## Rules and constraints

- Requires parent window **Credentials Assigned** on the employee record.
- Only roles with this process can edit credential lines.

## Code locations

| Role | File |
|------|------|
| UI | `web/src/components/employee-view.tsx` |
| Model | `web/src/lib/employee.ts` |
| Persist | `web/src/lib/supabase/data-api.ts` |

## Database

- **Write:** `employee_credential`

## Related processes

- None. Future: credential expiry alerts, roster credential checks.

Process visibility is controlled per role in **Admin → Roles**. See [ABILITYERP-USERS-ROLES.md](../ABILITYERP-USERS-ROLES.md).
