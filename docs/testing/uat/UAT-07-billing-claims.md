# UAT-07 — Billing & claims

**Pack:** UAT-07 | **Priority:** P0 | **Owner:** JessicaHancock (Finance Officer) | **HP:** Flow 5

## Preconditions

- Approved June timesheets; `npm run supabase:seed-e2e-amplify`

## Scenarios

| UAT ID | Scenario | Expected | Result |
|--------|----------|----------|--------|
| UAT-07-S-001 | Generate claims preview | PAPL messages; eligible lines | HP-066 |
| UAT-07-S-002 | Generate claims | Records created; TS locked | HP-067 |
| UAT-07-S-003 | Cancellation claims panel | Cancellation lines | HP-068 |
| UAT-07-S-004 | Claim detail + gateway dry-run | Stub; hard blocks | HP-069 |
| UAT-07-S-005 | Claim list + route id | `/claims/cl-jun26-bern` | HP-070, ISSUE-002 |
| UAT-07-S-006 | Remittance import | Match payments | HP-071 |
| UAT-07-S-007 | Generate invoices preview | Plan-managed path | HP-072 |
| UAT-07-S-008 | Generate invoices | Invoice records | HP-073 |
| UAT-07-S-009 | Issue / print invoice | Document + delivery scaffold | HP-074 |
| UAT-07-S-010 | Negative — unapproved TS | Excluded from claim gen | HP-083 |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-07**.
