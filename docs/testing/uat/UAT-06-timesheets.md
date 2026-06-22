# UAT-06 — Timesheets

**Pack:** UAT-06 | **Priority:** P0 | **Owner:** PiperCollins (Team lead) + OliverWilliams (worker)

## Scenarios

| UAT ID | Scenario | User | Expected | Result |
|--------|----------|------|----------|--------|
| UAT-06-S-001 | Timesheet list | PiperCollins | `/timesheets` | **Pass** — list loads (coordinator + team lead paths) |
| UAT-06-S-002 | Generate preview | PiperCollins | `/generate-timesheets` June 2026 | **Pass** — preview UI; June period closed in seed (expected) |
| UAT-06-S-003 | Approval hub | PiperCollins | `/timesheet-approval?scope=organisation` | **Pass** — **Blocked (1)**; org scope (ISSUE-003 fix) |
| UAT-06-S-004 | Approve timesheet | PiperCollins | Status Approved | **Pass** — June Bern timesheets **Approved** in seed (T1 TEST-056) |
| UAT-06-S-005 | Worker my timesheets | OliverWilliams | `/my/timesheets` | **Pass** — TS-E2E-PM-JUN + TS-MAY26-OLIV (ROLE-013) |
| UAT-06-S-006 | Check-in/out | OliverWilliams | `/my/shifts` | **Pass** — week `?week=2026-06-09` shows Bern shift (ROLE-013) |
| UAT-06-S-007 | Payroll export fields | SuperUser | Timesheet detail — export status fields | **Partial** — fields exist; not re-run this pass |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-06** — all **Pass** on Amplify (2026-06-22).
