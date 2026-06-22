# UAT-06 — Timesheets

**Pack:** UAT-06 | **Priority:** P0 | **Owner:** PiperCollins (Team lead) + OliverWilliams (worker)

## Scenarios

| UAT ID | Scenario | User | Expected | Result |
|--------|----------|------|----------|--------|
| UAT-06-S-001 | Timesheet list | PiperCollins | `/timesheets` | |
| UAT-06-S-002 | Generate preview | PiperCollins | `/generate-timesheets` June 2026 | HP-055 |
| UAT-06-S-003 | Approval hub | PiperCollins | `/timesheet-approval?scope=organisation` | HP-056, ISSUE-003 |
| UAT-06-S-004 | Approve timesheet | PiperCollins | Status Approved | |
| UAT-06-S-005 | Worker my timesheets | OliverWilliams | `/my/timesheets` | HP-054 |
| UAT-06-S-006 | Check-in/out | OliverWilliams | `/my/shifts` | HP-054 |
| UAT-06-S-007 | Payroll export fields | SuperUser | Timesheet detail — export status fields | Partial |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-06**.
