# UAT-08 — Reconciliation & financial close

**Pack:** UAT-08 | **Priority:** P1 | **Owner:** TessaNguyen (Finance Manager)

## Scenarios

| UAT ID | Route | Expected | HP | Result |
|--------|-------|----------|-----|--------|
| UAT-08-S-001 | `/plan-reconciliation` | June variance rows | HP-075 | **Pass** — Bern row; billed $3,349 (TEST-085, ROLE-015) |
| UAT-08-S-002 | `/claim-reconciliation` | Claim vs payment | HP-076 | **Pass** — remittance matched on cl-jun26-bern |
| UAT-08-S-003 | `/invoice-reconciliation` | Invoice vs remittance | HP-077 | **Pass** — linked from financial close checklist |
| UAT-08-S-004 | `/financial-close` | Checklist June 2026 | HP-078, TEST-097 | **Pass** — checklist renders; close blocked (expected) |
| UAT-08-S-005 | `/ndis-audit-pack` | Export June 2026 | HP-080, TEST-099 | **Pass** — SuperUser 10 sections + export |
| UAT-08-S-006 | `/board-reporting` | KPI panels | HP-081 | **Pass** — June 2026 board report (TEST-099) |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-08** — all **Pass** on Amplify (2026-06-22).
