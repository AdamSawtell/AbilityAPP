# AbilityAPP testing documentation

## Quick vs full UAT

| Layer | Document | Purpose |
|-------|----------|---------|
| **Happy path** | [HAPPY-PATH-E2E-MATRIX.md](./HAPPY-PATH-E2E-MATRIX.md) | Fast spine — enquiry → exit (~30 min smoke) |
| **Smoke steps** | [TEST-RUNBOOKS.md](./TEST-RUNBOOKS.md) | Executable TEST-010 … TEST-099 |
| **Full UAT** | [UAT-INDEX.md](./UAT-INDEX.md) | All modules, windows, processes, reports |
| **Sign-off** | [UAT-SIGNOFF.md](./UAT-SIGNOFF.md) | Release gate checklist |
| **Defects** | [ISSUE-LOG-TEMPLATE.md](./ISSUE-LOG-TEMPLATE.md) | ISSUE / UAT IDs |

## UAT module packs (`docs/testing/uat/`)

| Pack | File |
|------|------|
| UAT-00 | [UAT-00-core-home-tasks.md](./uat/UAT-00-core-home-tasks.md) |
| UAT-01 | [UAT-01-enquiries-crm.md](./uat/UAT-01-enquiries-crm.md) |
| UAT-02 | [UAT-02-clients.md](./uat/UAT-02-clients.md) |
| UAT-03 | [UAT-03-locations-catalog.md](./uat/UAT-03-locations-catalog.md) |
| UAT-04 | [UAT-04-agreements-bookings.md](./uat/UAT-04-agreements-bookings.md) |
| UAT-05 | [UAT-05-planning-rostering.md](./uat/UAT-05-planning-rostering.md) |
| UAT-06 | [UAT-06-timesheets.md](./uat/UAT-06-timesheets.md) |
| UAT-07 | [UAT-07-billing-claims.md](./uat/UAT-07-billing-claims.md) |
| UAT-08 | [UAT-08-reconciliation-close.md](./uat/UAT-08-reconciliation-close.md) |
| UAT-09 | [UAT-09-incidents-complaints.md](./uat/UAT-09-incidents-complaints.md) |
| UAT-10 | [UAT-10-workforce-hr.md](./uat/UAT-10-workforce-hr.md) |
| UAT-11 | [UAT-11-my-workplace.md](./uat/UAT-11-my-workplace.md) |
| UAT-12 | [UAT-12-reports.md](./uat/UAT-12-reports.md) |
| UAT-13 | [UAT-13-admin-system.md](./uat/UAT-13-admin-system.md) |
| UAT-14 | [UAT-14-portal.md](./uat/UAT-14-portal.md) |
| UAT-15 | [UAT-15-processes.md](./uat/UAT-15-processes.md) |
| UAT-ROLE | [UAT-ROLE-MATRIX.md](./uat/UAT-ROLE-MATRIX.md) |

**Generated inventory:** [uat/UAT-INVENTORY.generated.md](./uat/UAT-INVENTORY.generated.md) — `npm run uat:inventory`

## Commands

| Command | Purpose |
|---------|---------|
| `npm run uat:inventory` | Regenerate window/process/report checklist from catalog |
| `npm run supabase:seed-e2e-intake` | Reset enquiry + exit test data |
| `npm run supabase:seed-e2e-amplify` | Reset delivery/billing smoke data |

**Related:** [BUILD-PROGRESS.md](../BUILD-PROGRESS.md), [processes/](../processes/), [scope/README.md](../scope/README.md).

**Status:** Happy path v1.0 + **UAT programme v1.0** (structure complete; execution not started).

**Agent rule:** Every feature slice must update help articles and testing docs per `.cursor/rules/docs-and-testing.mdc` before push.
