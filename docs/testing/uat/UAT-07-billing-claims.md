# UAT-07 — Billing & claims

**Pack:** UAT-07 | **Priority:** P0 | **Owner:** JessicaHancock (Finance Officer) | **HP:** Flow 5

## Preconditions

- Approved June timesheets; `npm run supabase:seed-e2e-amplify`

## Scenarios

| UAT ID | Scenario | Expected | Result |
|--------|----------|----------|--------|
| UAT-07-S-001 | Generate claims preview | PAPL messages; eligible lines | **Pass** — preview loads; 0 eligible / already claimed (TEST-085) |
| UAT-07-S-002 | Generate claims | Records created; TS locked | **Pass** — `cl-jun26-bern` Accepted $3,349 (TEST-067) |
| UAT-07-S-003 | Cancellation claims panel | Cancellation lines | **Pass** — `sb-jun26-cancel` seeds cancellation path (TEST-068) |
| UAT-07-S-004 | Claim detail + gateway dry-run | Stub; hard blocks | **Pass** — PAPL 6/6 pass; gateway ref GW-JUN26-BERN-001 |
| UAT-07-S-005 | Claim list + route id | `/claims/cl-jun26-bern` | **Pass** — record id route; remittance matched (ISSUE-002) |
| UAT-07-S-006 | Remittance import | Match payments | **Pass** — NDIA-PAY-JUN26-001 matched $3,349 on claim detail |
| UAT-07-S-007 | Generate invoices preview | Plan-managed path | **Pass** — 1 eligible plan-managed (ISSUE-005 retest) |
| UAT-07-S-008 | Generate invoices | Invoice records | **Pass** — June invoices in list (TEST-073) |
| UAT-07-S-009 | Issue / print invoice | Document + delivery scaffold | **Partial** — delivery scaffold; email send not production (HP-074) |
| UAT-07-S-010 | Negative — unapproved TS | Excluded from claim gen | **Pass** — blocked TS excluded; `cl-jun26-bern-rej` Rejected line |
| UAT-07-S-011 | Finance menu + vendor AP | Finance sidebar groups claims, invoices, reconciliation, vendor invoices | **Pass** — Amplify smoke (2026-06-25) |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-07** — all **Pass** on Amplify (2026-06-22).
