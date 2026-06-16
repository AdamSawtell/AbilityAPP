# Core reports

Data export and review reports implemented in AbilityAPP. Each report has a numbered doc in this folder.

**Ask anytime:** "Tell me the reports" or "What does report X export?"  
Start here, then open the linked doc for full detail.

| # | ID | Name | Module | Status | What it exports |
|---|-----|------|--------|--------|-----------------|
| 1 | `client-register` | Client register | Clients | **Live** | Support receiver listing — demographics, funding, alerts, location counts (20 columns max). |

## Status values

| Status | Meaning |
|--------|---------|
| **Live** | Built and in use |
| **Planned** | Agreed, not built yet |
| **Draft** | Being designed |

## Access

- Sidebar **Reports** menu requires the `reports` window on the role.
- Each report is granted separately via **Admin → Roles → Reports** (`app_role_report`).
- A role also needs the parent module window (e.g. `clients` for Client register).

## Adding a report

1. Copy [`_template.md`](./_template.md) to `NN-short-name.md`.
2. Add a row to the table above and an entry in [`reports.json`](./reports.json).
3. Register the report in `web/src/lib/reports/catalog.ts`.
4. Add a runner in `web/src/lib/reports/runners/`.
5. Seed default role access in `web/src/lib/access/seed.ts` and regenerate `supabase/seed-access.sql`.

## Related docs

- [processes/README.md](../processes/README.md) — business processes
- [DATABASE-CHANGES.md](../DATABASE-CHANGES.md) — schema rules
