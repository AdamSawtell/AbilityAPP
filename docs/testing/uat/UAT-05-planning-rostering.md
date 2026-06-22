# UAT-05 — Service planning & rostering

**Pack:** UAT-05 | **Priority:** P0 | **Owner:** RileyShaw (Rostering Manager) | **HP:** Flow 4

## Preconditions

- `?week=2026-06-09`; `npm run supabase:seed-e2e-amplify`

## Scenarios

| UAT ID | Scenario | Steps | Expected | Result |
|--------|----------|-------|----------|--------|
| UAT-05-S-001 | Service planning | `/service-planning` | Demand from bookings | **Pass** — June 2026 plans; Bern + ELCL12 rows |
| UAT-05-S-002 | Multi-provider budget | `/multi-provider-budget` | View loads | **Pass** — link from service planning |
| UAT-05-S-003 | Roster week view | `/rostering?week=2026-06-09` | Shifts on grid | **Pass** — week 8–14 Jun; Bern shifts (IslaR, OlvW, GabW) |
| UAT-05-S-004 | Assign worker | Edit shift — worker | Saves; hints shown | **Pass** — staffed shifts on grid (T1 TEST-051) |
| UAT-05-S-005 | Publish week | Publish staffed drafts | Published; notify task | **Pass** — **1 ready · 0 blocked**; RileyShaw publish (TEST-060) |
| UAT-05-S-006 | Qualification block | Worker without WWCC | Publish blocked | **Pass** — publish panel blocks missing credentials (seeded WWCC fix in TEST-060) |
| UAT-05-S-007 | RoC / forward plan | Roster views | Load without error | **Pass** — RoC + Forward plan tabs render |
| UAT-05-S-008 | Open shifts list | Rostering open shifts tab | Vacant shifts visible | **Pass** — **Open shifts 23** tab |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-05** — all **Pass** on Amplify (2026-06-22).
