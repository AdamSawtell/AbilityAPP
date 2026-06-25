# Database changes — required for every feature

AbilityVua uses **Supabase Postgres**. Schema is version-controlled in `supabase/migrations/`. GitHub Actions applies migrations on push to `main`.

## Rule

**Any new field, entity, tab, or relationship in the app needs a matching database change** unless it is purely presentational.

When you add or change app behaviour, also:

1. Add a migration under `supabase/migrations/` (timestamped filename).
2. Update `web/src/lib/supabase/mappers.ts` if columns changed.
3. Update `web/src/lib/supabase/data-api.ts` if save/load logic changed.
4. Regenerate seed SQL if sample data changed:
   - Reference lists: `npm run supabase:seed`
   - Entities: `npm run supabase:seed-entities`
   - Users/roles: `npm run supabase:seed-access`
   - Employees: `npm run supabase:seed-employees`
5. **One-off rebrand / data fix** (existing remote DB): `node scripts/run-all-remote-seeds.mjs -- --file supabase/seed-rebrand-abilityvua.sql`
6. Add new **windows** to `web/src/lib/access/catalog.ts` when shipping a new module.

Do **not** rely on the Supabase SQL editor for routine schema work. Migrations in Git are the source of truth.

7. Push to `main` — CI runs `supabase db push` and reapplies seeds.

## Current schema

| Table | Purpose |
|-------|---------|
| `reference_list` / `reference_option` | Admin dropdowns |
| `enquiry` | Intake enquiries |
| `incident` | Incident reports (NDIS-aligned header) |
| `incident_party` / `incident_action` / `incident_notification` | Incident line tables |
| `client` | Support received (header) |
| `client_alert` / `client_activity` / `client_location` | Client line tables |
| `product` / `price_list` / `price_list_line` | Catalog & pricing |
| `service_agreement` / `service_agreement_line` | Service agreements |
| `service_booking` / `service_booking_line` | Service bookings (document + lines) |
| `contract` / `contract_audit` | Legacy contracts module |
| `support_plan` / `support_plan_goal` | Support plans |
| `support_plan_medication` / `support_plan_diagnosis` / `support_plan_health_plan` / `support_plan_support_requirement` / `support_plan_assistive_technology` | Support plan line tables (care plan printable) |
| `plan_assessment_document` | Plan & assessment documents |
| `app_user` | Application login users |
| `app_role` | Security roles |
| `app_user_role` | User ↔ role (many-to-many) |
| `app_role_window` | Role ↔ menu window |
| `app_role_process` | Role ↔ business process |
| `app_task` | Tasks / requests (assignable work items) |
| `app_task_type` | Configurable task types (Review, Approve, Check, …) |
| `app_role_task_type` | Role ↔ task type (see / select / create) |
| `employee` | Staff / business partner (employee) |
| `employee_location` | Employee addresses (primary flag) |
| `employee_emergency_contact` | Emergency contacts & next of kin |
| `employee_alert` | Employee alerts (manual; system alerts derived in app) |
| `employee_credential` | Credentials assigned lines |
| `employee_skill` | Skills & languages |
| `employee_document` | HR documents |
| `employee_activity` | Employee activity log |
| `employee_leave_entitlement` | Leave entitlements / balances |
| `agency_worker` | Agency relief workers (vendor-linked; not employees) |
| `agency_shift_request` | Agency coverage requests linked to vacant `roster_shift` |
| `agency_timesheet` / `agency_timesheet_line` | Vendor timesheet header + lines from completed agency shifts |
| `site_orientation` | Site orientation per worker (agency or employee) and location |
| `roster_shift` AB-0021 fields | Training/meeting grouping, cost allocation, cost centre, estimated cost, attendance sign-off |
| `app_organization` theme columns (AB-0017) | `theme_primary_colour`, `theme_accent_colour`, `theme_background_colour`, `theme_text_colour` — empty = AbilityVua defaults |

## Not built yet (needs migration when added)

- Auth, org tenancy, tightened RLS
- Rostering / booking generator, timesheets, generate-timesheets records
- Goals / progress review as standalone entities (if split from support plan)

## Local commands

```powershell
cd "c:\Users\AdamSawtell\Documents\Cursor Play\AbilityERP Clone"
$env:SUPABASE_ACCESS_TOKEN = "<token>"
npx supabase link --project-ref yonkaaylolrdsjfgpvyp
npx supabase db push
npx supabase db query --linked -f supabase/seed.sql
npx supabase db query --linked -f supabase/seed-entities.sql
```

See also [SUPABASE-SETUP.md](./SUPABASE-SETUP.md).
