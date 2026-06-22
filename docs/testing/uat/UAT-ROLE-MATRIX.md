# UAT-ROLE — Role and window matrix

**Pack:** UAT-ROLE | **Priority:** P0 | **Est. time:** 2 h

Verify each persona sees the correct sidebar, can open granted routes, and is blocked from ungranted write actions.

**Source:** `supabase/seed-access.sql` / `web/src/lib/access/seed.ts`  
**After access seed changes:** sign out and back in before testing.

## Test users

| ROLE ID | User | Password | Role key |
|---------|------|----------|----------|
| ROLE-010 | SuperUser | flamingo | `role-admin` |
| ROLE-011 | IslaRobinson | welcome | `role-coordinator` |
| ROLE-012 | RileyShaw | welcome | `role-rostering-manager` |
| ROLE-013 | OliverWilliams | welcome | `role-support-worker` |
| ROLE-014 | JessicaHancock | welcome | `role-finance-officer` |
| ROLE-015 | TessaNguyen | welcome | `role-finance-manager` |
| ROLE-016 | GabrielaWilson | welcome | `role-intake` |
| ROLE-017 | PiperCollins | welcome | `role-team-leader` |

## Scenarios

| UAT ID | Role | Check | Pass if | Result |
|--------|------|-------|---------|--------|
| UAT-ROLE-001 | SuperUser | Sidebar — all app groups | Enquiries, Clients, Delivery, Finance visible | |
| UAT-ROLE-002 | GabrielaWilson | Sidebar — intake | Enquiries; no Generate claims write | Pass |
| UAT-ROLE-003 | GabrielaWilson | `/enquiries/new` | Can create enquiry | Pass (list + `1000025`) |
| UAT-ROLE-004 | IslaRobinson | Sidebar — coordinator | Clients, SA, bookings; rostering per grant | |
| UAT-ROLE-005 | IslaRobinson | `/clients/bp-bern` — all granted tabs | Tabs render; denied tabs hidden | |
| UAT-ROLE-006 | RileyShaw | Sidebar — delivery | Rostering, Service planning, Generate timesheets | |
| UAT-ROLE-007 | RileyShaw | `/rostering` | Publish week panel + New shift (write) | |
| UAT-ROLE-008 | OliverWilliams | Sidebar — worker | My workplace; no billing sidebar | |
| UAT-ROLE-009 | OliverWilliams | `/my/shifts`, `/my/timesheets` | Both load (not blocked) | |
| UAT-ROLE-010 | OliverWilliams | Direct `/generate-claims` | Page read-only or generate disabled | |
| UAT-ROLE-011 | JessicaHancock | Sidebar — billing | Claims, invoices, generate-* | |
| UAT-ROLE-012 | JessicaHancock | `/generate-claims` — June 2026 | Preview loads; generate enabled if write | |
| UAT-ROLE-013 | TessaNguyen | Reconciliation + close | All three reconciliation routes + financial close | |
| UAT-ROLE-014 | PiperHall | Timesheets | Timesheet approval + generate timesheets | |
| UAT-ROLE-015 | Any non-admin | Direct `/admin/roles` | Blocked or read-only | |

## Full window inventory

For every `app_role_window` row: use [UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) and spot-check 5 windows per role not covered above.

## Known regressions (fixed — retest on access changes)

| ISSUE | Symptom | Fix |
|-------|---------|-----|
| ISSUE-006 | Worker blocked from `/my/shifts` | Frontline my-shifts grants in seed-access |
| ISSUE-007 | Riley no rostering write | `ROSTERING_DELIVERY_WINDOWS` in seed.ts |
| ISSUE-009 | Jessica no billing sidebar | `FINANCE_OFFICER_BILLING_WINDOWS` in seed.ts |
