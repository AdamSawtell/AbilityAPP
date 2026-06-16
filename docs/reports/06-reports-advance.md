# Reports Advance

| Field | Value |
|-------|-------|
| **Window key** | `reports-advance` |
| **Route** | `/reports/advance` |
| **Status** | Live |

## Purpose

Let authorised users write read-only SQL against the Supabase database, review results in a table, and export to CSV.

## Security

- **SELECT / WITH only** — validated in app and Postgres function
- **Single statement** — no semicolons
- **Forbidden keywords** — INSERT, UPDATE, DELETE, DDL, etc.
- **Row cap** — 5,000 rows per query
- **Role gate** — requires `reports` + `reports-advance` windows

## Code

- UI: `web/src/components/reports-advance-view.tsx`
- API: `web/src/app/api/reports/sql/route.ts`
- Validation: `web/src/lib/reports/sql-validate.ts`
- DB function: `supabase/migrations/20250615280000_reports_advance_sql.sql`
