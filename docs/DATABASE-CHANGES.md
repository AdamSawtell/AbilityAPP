# Database changes — required for every feature

AbilityAPP uses **Supabase Postgres**. Schema is version-controlled in `supabase/migrations/`. GitHub Actions applies migrations on push to `main`.

## Rule

**Any new field, entity, tab, or relationship in the app needs a matching database change** unless it is purely presentational.

When you add or change app behaviour, also:

1. Add a migration under `supabase/migrations/` (timestamped filename).
2. Update `web/src/lib/supabase/mappers.ts` if columns changed.
3. Update `web/src/lib/supabase/data-api.ts` if save/load logic changed.
4. Regenerate seed SQL if sample data changed:
   - Reference lists: `npm run supabase:seed`
   - Entities: `npm run supabase:seed-entities`
5. Push to `main` — CI runs `supabase db push` and reapplies seeds.

Do **not** rely on the Supabase SQL editor for routine schema work. Migrations in Git are the source of truth.

## Current schema

| Table | Purpose |
|-------|---------|
| `reference_list` / `reference_option` | Admin dropdowns |
| `enquiry` | Intake enquiries |
| `client` | Support received (header) |
| `client_alert` / `client_activity` / `client_location` | Client line tables |
| `product` / `price_list` / `price_list_line` | Catalog & pricing |
| `service_agreement` / `service_agreement_line` | Service agreements |
| `contract` / `contract_audit` | Legacy contracts module |
| `support_plan` / `support_plan_goal` | Support plans |
| `plan_assessment_document` | Plan & assessment documents |

## Not built yet (needs migration when added)

- `service_booking` / `service_booking_line`
- Auth, org tenancy, tightened RLS
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
