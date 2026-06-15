# AbilityERP Employee windows & dependent tabs

Business Partner (Employee) in AbilityERP is a **parent window**. Tabs and sub-functions are **dependent windows** — a role needs both the parent and the child grant.

## Window map

| Window key | AbilityERP | Type | Employee tab |
|------------|------------|------|----------------|
| `employees` | Business Partner (Employee) | Parent — sidebar | — |
| `employee-overview` | Employee header | Dependent | Overview |
| `employee-contact` | Contact | Dependent | Contact |
| `employee-employment` | Employment | Dependent | Employment |
| `employee-credentials-assigned` | **Credentials Assigned** | Dependent | Credentials Assigned |
| `employee-locations` | Location | Dependent | Locations |
| `employee-system-access` | User link | Dependent | System access |

Catalog source: `web/src/lib/access/catalog.ts`

## Processes

| Process id | Label | Requires window |
|------------|-------|-----------------|
| `assign-employee-credential` | Assign employee credential | `employee-credentials-assigned` |

Users with the credentials tab but not the assign process can view credentials (read-only UI planned).

## Access rules

1. **Sidebar:** only `showInSidebar: true` windows (e.g. `employees`).
2. **Tabs:** `canWindow(tabWindowKey)` — child must be granted **and** parent `employees` must be granted.
3. **Roles admin:** unchecking a parent removes its dependent windows from the role.

## Data

- `employee` — header / profile
- `employee_credential` — Credentials Assigned line table

Regenerate seeds: `npm run supabase:seed-employees` then `npm run supabase:seed-access`
