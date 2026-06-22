# AbilityAPP — Full UAT index

**Version:** 1.0  
**Last updated:** 2026-06-18  
**Companion docs:** [Happy path (quick smoke)](./HAPPY-PATH-E2E-MATRIX.md) · [Test runbooks](./TEST-RUNBOOKS.md) · [Sign-off](./UAT-SIGNOFF.md) · [Issue log](./ISSUE-LOG-TEMPLATE.md)

## Purpose

Full **User Acceptance Testing** covers every in-scope window, process, and report in the built system. The [happy path matrix](./HAPPY-PATH-E2E-MATRIX.md) remains the **fast spine** (~30 min); this UAT programme is the **complete catalogue** before go-live.

## Testing tiers

| Tier | When | Artefact | Outcome |
|------|------|----------|---------|
| **T0** | Every push | `npm run build`, `page-guides:check` | Build green |
| **T1** | Every release candidate | [TEST-RUNBOOKS.md](./TEST-RUNBOOKS.md) | Happy path smoke pass |
| **T2** | Weekly / per module | `docs/testing/uat/UAT-*.md` | Module pack signed off |
| **T3** | Pre go-live | [UAT-SIGNOFF.md](./UAT-SIGNOFF.md) | All P0–P2 packs + role matrix |
| **T4** | Later CI | Playwright (P0 only) | Automated regression |

## Environment

| Item | Value |
|------|--------|
| **Amplify** | `https://main.d3vim3geq5td01.amplifyapp.com` |
| **Local** | `cd web && npm run dev` |
| **Passwords** | Staff `welcome`; SuperUser `flamingo` |
| **Spine seeds** | `npm run supabase:seed-e2e-intake` + `npm run supabase:seed-e2e-amplify` |

## Module packs

| Pack | Document | Priority | Owner role | Est. time | Status | HP overlap |
|------|----------|----------|------------|-----------|--------|------------|
| UAT-00 | [UAT-00-core-home-tasks.md](./uat/UAT-00-core-home-tasks.md) | P2 | All | 1 h | **Pass** | — |
| UAT-01 | [UAT-01-enquiries-crm.md](./uat/UAT-01-enquiries-crm.md) | P0 | Intake | 2 h | **Pass** | Flow 1–2 |
| UAT-02 | [UAT-02-clients.md](./uat/UAT-02-clients.md) | P0 | Coordinator | 4 h | **Pass** | Flow 3, 7 |
| UAT-03 | [UAT-03-locations-catalog.md](./uat/UAT-03-locations-catalog.md) | P1 | Admin / Coordinator | 2 h | **Pass** | Partial |
| UAT-04 | [UAT-04-agreements-bookings.md](./uat/UAT-04-agreements-bookings.md) | P0 | Coordinator | 3 h | **Pass** | Flow 4 |
| UAT-05 | [UAT-05-planning-rostering.md](./uat/UAT-05-planning-rostering.md) | P0 | Roster admin | 3 h | **Pass** | Flow 4 |
| UAT-06 | [UAT-06-timesheets.md](./uat/UAT-06-timesheets.md) | P0 | Team lead | 2 h | **Pass** | Flow 4 |
| UAT-07 | [UAT-07-billing-claims.md](./uat/UAT-07-billing-claims.md) | P0 | Billing | 3 h | **Pass** | Flow 5 |
| UAT-08 | [UAT-08-reconciliation-close.md](./uat/UAT-08-reconciliation-close.md) | P1 | Finance | 2 h | **Pass** | Flow 5, 9 |
| UAT-09 | [UAT-09-incidents-complaints.md](./uat/UAT-09-incidents-complaints.md) | P1 | Manager / Quality | 2 h | **Pass** | Flow 10 |
| UAT-10 | [UAT-10-workforce-hr.md](./uat/UAT-10-workforce-hr.md) | P1 | HR | 3 h | **Pass** | Flow 6, 8 |
| UAT-11 | [UAT-11-my-workplace.md](./uat/UAT-11-my-workplace.md) | P1 | Support worker | 2 h | **Pass** | Flow 4–6 |
| UAT-12 | [UAT-12-reports.md](./uat/UAT-12-reports.md) | P2 | Admin / Quality | 1.5 h | **Pass** | Flow 11 |
| UAT-13 | [UAT-13-admin-system.md](./uat/UAT-13-admin-system.md) | P2 | SuperUser / ICT | 4 h | **Pass** | — |
| UAT-14 | [UAT-14-portal.md](./uat/UAT-14-portal.md) | P3 | Portal (if release) | 1 h | Not started | Planned |
| UAT-15 | [UAT-15-processes.md](./uat/UAT-15-processes.md) | P1 | Mixed | 3 h | **Pass** | Cross-flow |
| UAT-ROLE | [UAT-ROLE-MATRIX.md](./uat/UAT-ROLE-MATRIX.md) | P0 | All personas | 2 h | **Pass** | 010–019 |

**Generated checklist:** [uat/UAT-INVENTORY.generated.md](./uat/UAT-INVENTORY.generated.md) — run `npm run uat:inventory` after catalog changes.

## Recommended execution order

1. **T1** — Happy path smokes ([TEST-RUNBOOKS.md](./TEST-RUNBOOKS.md)).
2. **UAT-ROLE** — Window visibility per persona (catches access seed gaps).
3. **P0 modules** — UAT-01 → 02 → 04 → 05 → 06 → 07 (can parallelise 05/06).
4. **UAT-15** — Process scenarios (leave, credentials, tasks, convert).
5. **P1 modules** — 08, 09, 10, 11, 03.
6. **P2** — 00, 12, 13.
7. **P3** — 14 portal (if in release scope).
8. **UAT-SIGNOFF** — Release gate.

## Out of scope (mark N/A in UAT)

| Capability | Reason |
|------------|--------|
| SCHADS payroll calculation in-app | Architecture — export only |
| Live PRODA claim submission | Integration not approved |
| Full mobile / offline GPS | Planned |
| Participant portal (production) | UAT-14 until release decision |

## Defects and evidence

- Log defects in [ISSUE-LOG-TEMPLATE.md](./ISSUE-LOG-TEMPLATE.md) with **UAT ID** + module pack.
- Record module completion in [UAT-SIGNOFF.md](./UAT-SIGNOFF.md).
- Optional: screenshots under `docs/testing/evidence/<pack-id>/` (not committed by default).

## Maintenance

| Change | Action |
|--------|--------|
| New window in `catalog.ts` | `npm run uat:inventory` → add scenario row to module pack |
| New process in `ACCESS_PROCESSES` | Update UAT-15 |
| New report | Update UAT-12 + `reports.json` |
| Happy path slice ships | Update TEST-RUNBOOKS + HP refs in pack |
