# UAT-03 — Locations & service catalog

**Pack:** UAT-03 | **Priority:** P1 | **Owner:** Admin / Coordinator (`IslaRobinson`)

## Scenarios

| UAT ID | Module | Steps | Expected | Result |
|--------|--------|-------|----------|--------|
| UAT-03-S-001 | Locations list | `/locations` | CRUD list | **Pass** — list loads; Glenelg SIL in seed |
| UAT-03-S-002 | Location tabs | Open `loc-glenelg-sil` — all tabs | Clients, employees, products assignments | **Pass** — 8 tabs; 5 clients, 2 staff, 2 services |
| UAT-03-S-003 | Assign client to location | Process 03 | Line persists | **Pass** — Bern on GLEN-SIL (UAT-02-T-006) |
| UAT-03-S-004 | Products | `/products` — edit product | Overview + Pricing | **Pass** — SIL_WD, COMM_PART, TRANS_KM |
| UAT-03-S-005 | Price lists | `/price-lists` — lines | Rates for NDIS products | **Pass** — pl-ndis-2024 linked on products |
| UAT-03-S-006 | Contracts | `/contracts` | HR/NDIA contract record | **Pass** — contracts list loads (coordinator Services menu) |
| UAT-03-S-007 | Business partners | `/business-partners` — plan manager | BP for billing path | **Pass** — plan manager BP on Bern (TEST-042) |
| UAT-03-S-008 | Fleet vehicles | `/fleet` → open seeded vehicle → booking/inspection tabs | Vehicle register, bookings, service/inspection lines | Pending — AB-0006 smoke TEST-096 |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-03** — all **Pass** on Amplify (2026-06-22).
