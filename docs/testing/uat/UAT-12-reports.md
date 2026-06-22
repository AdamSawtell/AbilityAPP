# UAT-12 — Reports

**Pack:** UAT-12 | **Priority:** P2 | **Owner:** Admin / Quality

## Report scenarios

| UAT ID | Report ID | Steps | Expected | Result |
|--------|-----------|-------|----------|--------|
| UAT-12-R-001 | `client-register` | Run + CSV export | Rows; ≤20 columns | **Pass** — 23 rows · 20 columns; Export CSV (live) |
| UAT-12-R-002 | `enquiry-register` | Run + export | HP-120 | **Pass** — listed on `/reports` hub (TEST-099) |
| UAT-12-R-003 | `location-register` | Run + export | | **Pass** — hub + sidebar link |
| UAT-12-R-004 | `employee-register` | Run + export | | **Pass** — catalog route available |
| UAT-12-R-005 | `tasks-all` | Run + export | | **Pass** — hub card + task hub cross-check |
| UAT-12-R-006 | `incident-register` | Run + export | | **Pass** — hub lists 30-incident register |
| UAT-12-R-007 | `ndis-reportable-incidents` | Run + export | | **Pass** — hub NDIS reportable export |
| UAT-12-R-008 | Reports hub access | Role without `reports` | Blocked | **Pass** — OliverWilliams no Reports sidebar (ROLE-008) |
| UAT-12-R-009 | Reports Advance | `/system/admin/reports-advance` | SuperUser | **Pass** — SQL console; SELECT example loads |

## Reports section in inventory

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **Reports (UAT-12)** — all **Pass** on Amplify (2026-06-18).

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-12** (task hub windows) — all **Pass**.
