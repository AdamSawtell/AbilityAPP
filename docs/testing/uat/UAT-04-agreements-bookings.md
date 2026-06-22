# UAT-04 — Service agreements & bookings

**Pack:** UAT-04 | **Priority:** P0 | **Owner:** Coordinator | **HP:** Flow 4

## Preconditions

- `bp-bern` or converted client with active lifecycle
- `npm run supabase:seed-e2e-amplify` for June booking window

## Scenarios

| UAT ID | Scenario | Steps | Expected | Result |
|--------|----------|-------|----------|--------|
| UAT-04-S-001 | SA list + create | `/service-agreements` | Overview + Lines; audit | HP-043–044 |
| UAT-04-S-002 | SA activate | Status → active | Booking eligible | HP-045 |
| UAT-04-S-003 | Print SA pack | Print service agreement | Document registry | |
| UAT-04-S-004 | Booking create | Link client + SA | Overview + Lines | HP-046–047 |
| UAT-04-S-005 | Booking compliance | Client lifecycle intake/exit | Warning on create | HP-037 |
| UAT-04-S-006 | Booking lines | Schedule + location + ratio | Persists | |
| UAT-04-S-007 | Cancel booking line | Cancellation reason | Audit + claim path later | |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-04**.
