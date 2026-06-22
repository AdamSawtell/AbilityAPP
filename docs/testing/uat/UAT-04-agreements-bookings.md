# UAT-04 — Service agreements & bookings

**Pack:** UAT-04 | **Priority:** P0 | **Owner:** Coordinator (`IslaRobinson`) | **HP:** Flow 4

## Preconditions

- `bp-bern` or converted client with active lifecycle
- `npm run supabase:seed-e2e-amplify` for June booking window

## Scenarios

| UAT ID | Scenario | Steps | Expected | Result |
|--------|----------|-------|----------|--------|
| UAT-04-S-001 | SA list + create | `/service-agreements` | Overview + Lines; audit | **Pass** — 22+ agreements; `sa-rose-ni` Overview + 2 lines + audit footer |
| UAT-04-S-002 | SA activate | Status → active | Booking eligible | **Pass** — Bern SA **Active** |
| UAT-04-S-003 | Print SA pack | Print service agreement | Document registry | **Pass** — print-service-agreement on SA detail (T1 TEST-043–045) |
| UAT-04-S-004 | Booking create | Link client + SA | Overview + Lines | **Pass** — `sb-50145` Bern + `sa-rose-ni`; new booking flow works |
| UAT-04-S-005 | Booking compliance | Client lifecycle intake/exit | Warning on create | **Pass** — E2EXIT booking shows lifecycle **exit** warning |
| UAT-04-S-006 | Booking lines | Schedule + location + ratio | Persists | **Pass** — `sb-50145` lines $10,907.80; June seed lines on 50150 |
| UAT-04-S-007 | Cancel booking line | Cancellation reason | Audit + claim path later | **Pass** — `sb-jun26-cancel` (50151) **Cancelled** + short-notice fields |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-04** — all **Pass** on Amplify (2026-06-22).
