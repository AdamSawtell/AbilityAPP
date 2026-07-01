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
   - Glenelg roster/calendar demo data: `npm run supabase:seed-demo-once -- --file supabase/seed-glenelg-calendar.sql`
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
| `client` | Support received (header); `animal_allergy_alert` for profile header flag |
| `client_alert` / `client_activity` / `client_location` / `client_animal` | Client line tables; animals include role, care, vet, vaccination, display priority; optional `location_id` and `client_location_id` |
| `product` / `price_list` / `price_list_line` | Catalog & pricing; NDIS metadata, region, effective dates, quote/no-price flags and source import linkage (AB-0011 foundation) |
| `ndis_price_import_batch` / `ndis_price_import_row` | NDIS price guide import history, row-level preview/apply results and AB-0012 changed-item handoff |
| `price_update_run` / `price_update_impact` | AB-0012 price dependant updater — analysis runs, row-level classifications, decisions, and apply results |
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
| `app_task_type` | Configurable task types (Review, Approve, Check, Rostering communication, …) |
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
| `support_location.high_demand_advisory` | AB-0030 manual high-demand flag for My Workplace **Services I can work at** advisory |
| `admin_message` | AB-0034 admin communications hub — title, body, audience, publish/expiry, status |
| `admin_message_acknowledgment` | AB-0034 immutable per-user seen/acknowledged records (with optional weekly recurrence period key) |
| `fleet_vehicle` | AB-0006 vehicle register — registration, insurance, status, odometer, assigned location/driver, accessibility and asset fields |
| `fleet_service_record` / `fleet_inspection` / `fleet_fuel_log` / `fleet_booking` | AB-0006 fleet child tables for servicing, pre-start checks, mileage, and vehicle bookings |
| `maintenance_request` / `maintenance_request_photo` | AB-0005 maintenance register — location-linked requests with SLA, cost approval fields, optional incident link, and photo lines |
| `employee` driver qualification fields | AB-0006 licence number/class/expiry, medical, NDIS screening, WWCC, driver history, vehicle certifications |
| `roster_shift.vehicle_id` / `incident.vehicle_id` | AB-0006 links shifts and incidents to provider-owned fleet vehicles |
| `agency_worker` | Agency relief workers (vendor-linked; not employees) |
| `agency_shift_request` | Agency coverage requests linked to vacant `roster_shift` |
| `agency_timesheet` / `agency_timesheet_line` | Vendor timesheet header + lines from completed agency shifts |
| `site_orientation` | Site orientation per worker (agency or employee) and location |
| `roster_shift` AB-0021 fields | Training/meeting grouping, cost allocation, cost centre, estimated cost, attendance sign-off |
| `mobile_offline_sync` | AB-0004 Phase B — idempotent offline check-in/out sync audit (`sync_id`, status, rejection_reason) |
| `app_push_subscription` | AB-0004 Phase C — web push endpoints per device (`endpoint`, `p256dh`, `auth`, preference flags) |
| `mobile_push_log` | AB-0004 Phase C — idempotent scheduled push dedupe (`user_id`, `push_type`, `dedupe_key`) |
| `roster_shift.check_in_voided_at` / `roster_shift_worker_line.check_in_voided_at` | Coordinator void check-in (CFO C-01) |
| `roster_shift` session fields (20260702120000) | `session_key`, `required_worker_count` — groups master/live session blocks |
| `roster_shift_client_line` | Billable client participants per session (ratio, booking link) |
| `roster_shift_worker_line` | Paid workers per session (role, status, check-in/out); `coverage_role` (`fill` \| `leave_pay`) and `leave_request_id` (20260702140000) for leave-aware rollover |
| `roster_of_care_line` session fields (20260702120000) | `default_employee_id`, `support_ratio`, `session_key` — master roster grouping |
| `app_organization` roster rollover fields (20260702123000) | `roster_rollover_enabled`, `roster_rollover_lookahead_weeks`, `roster_rollover_default_status`, `roster_rollover_skip_existing` — RoC → live roster defaults |
| `pay_period_definition` / `pay_period_instance` (20260702150000) | Organisation pay cycle config and generated open/closed period buckets (AB-0033) |
| `pay_period_definition` month allocation (20260702160000) | `month_allocation_method` (`accrual` \| `period_end` \| `pay_date`), `pay_date_offset_days` — how pay-period cost maps to a calendar month for financial close |
| `employee` contracted/SCHADS columns (20260702151000) | `contracted_hours_per_period`, `contracted_hours_period`, `schads_classification_level`, `schads_pay_point`, `super_rate` (AB-0032 / AB-0031) |
| `roster_shift` profitability columns (20260702152000) | `pay_period_instance_id`, `calculated_cost`, `calculated_income`, `calculated_margin` (AB-0031) |
| `app_organization` theme columns (AB-0017) | `theme_primary_colour`, `theme_accent_colour`, `theme_background_colour`, `theme_text_colour` — empty = AbilityVua defaults |
| `app_organization.idle_timeout_minutes` (20260630171200) | Organisation workspace idle timeout, 5 to 120 minutes; default 15 (AB-0040) |

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
