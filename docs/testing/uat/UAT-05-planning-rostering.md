# UAT-05 — Service planning & rostering

**Pack:** UAT-05 | **Priority:** P0 | **Owner:** RileyShaw (Rostering Manager) | **HP:** Flow 4

## Preconditions

- `?week=2026-06-09`; `npm run supabase:seed-e2e-amplify`

## Scenarios

| UAT ID | Scenario | Steps | Expected | Result |
|--------|----------|-------|----------|--------|
| UAT-05-S-001 | Service planning | `/service-planning` | Demand from bookings | HP-048–049 |
| UAT-05-S-002 | Multi-provider budget | `/multi-provider-budget` | View loads | |
| UAT-05-S-003 | Roster week view | `/rostering?week=2026-06-09` | Shifts on grid | HP-050 |
| UAT-05-S-004 | Assign worker | Edit shift — worker | Saves; hints shown | HP-051 |
| UAT-05-S-005 | Publish week | Publish staffed drafts | Published; notify task | HP-052, TEST-060 |
| UAT-05-S-006 | Qualification block | Worker without WWCC | Publish blocked | |
| UAT-05-S-007 | RoC / forward plan | Roster views | Load without error | |
| UAT-05-S-008 | Open shifts list | Rostering open shifts tab | Vacant shifts visible | |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-05**.
