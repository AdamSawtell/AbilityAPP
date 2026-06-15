# AbilityERP Employee windows & dependent tabs

Business Partner (Employee) in AbilityERP is a **parent window**. Tabs and sub-functions are **dependent windows** — a role needs both the parent and the child grant.

## Window map

| Window key | AbilityERP | Type | Employee tab |
|------------|------------|------|----------------|
| `employees` | Business Partner (Employee) | Parent — sidebar | — |
| `employee-overview` | Employee header | Dependent | Overview |
| `employee-contact` | Contact | Dependent | Contact |
| `employee-locations` | **Address** | Dependent | Address (1..n, one primary) |
| `employee-emergency-contacts` | Emergency contacts | Dependent | Emergency contacts (1..n, primary) |
| `employee-employment` | Employment | Dependent | Employment |
| `employee-work-rights` | Work rights | Dependent | Work rights (visa, licence) |
| `employee-payroll` | Payroll | Dependent | Payroll (bank / tax / super) |
| `employee-leave` | Leave | Dependent | Leave (policy + entitlements) |
| `employee-credentials-assigned` | **Credentials Assigned** | Dependent | Credentials Assigned |
| `employee-alerts` | Alerts | Dependent | Alerts (manual + system compliance) |
| `employee-documents` | HR documents | Dependent | Documents |
| `employee-activity` | Activity | Dependent | Activity |
| `employee-skills` | Skills & languages | Dependent | Skills & languages |
| `employee-system-access` | User link | Dependent | System access |

Catalog source: `web/src/lib/access/catalog.ts`

## Processes

| Process id | Label | Requires window |
|------------|-------|-----------------|
| `assign-employee-credential` | Assign employee credential | `employee-credentials-assigned` |

## Access rules

1. **Sidebar:** only `showInSidebar: true` windows (e.g. `employees`).
2. **Tabs:** `canWindow(tabWindowKey)` — child must be granted **and** parent `employees` must be granted.
3. **Roles admin:** unchecking a parent removes its dependent windows from the role.

## Data

- `employee` — header / profile (reports-to link, employment type, payroll, work rights)
- `employee_location` — Address tab
- `employee_emergency_contact` — Emergency contacts tab
- `employee_alert` — Manual alerts (system alerts derived from credential/visa expiry)
- `employee_credential` — Credentials Assigned
- `employee_skill` — Skills & languages
- `employee_document` — HR documents
- `employee_activity` — Activity timeline
- `employee_leave_entitlement` — Leave balances per type

Compliance helpers: `web/src/lib/employee-compliance.ts` (expiry status, merged alerts, list badges).

Regenerate seeds: `npm run supabase:seed-employees` then `npm run supabase:seed-access`
