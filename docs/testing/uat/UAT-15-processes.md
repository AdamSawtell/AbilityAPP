# UAT-15 — Business processes

**Pack:** UAT-15 | **Priority:** P1 | **Owner:** Mixed personas

Maps to `docs/processes/processes.json` and `ACCESS_PROCESSES` in catalog.

## Process scenarios

| UAT ID | Process ID | Actor | Trigger | Pass if | Result |
|--------|------------|-------|---------|---------|--------|
| UAT-15-P-001 | `enquiry-to-client` | Intake | Convert button | Client + Converted enquiry | **Pass** — TEST-020 `bp-samu` |
| UAT-15-P-002 | `assign-employee-credential` | HR | Credentials tab | Line + audit | **Pass** — TEST-090 Oliver |
| UAT-15-P-003 | `assign-location-client` | Coordinator | Location clients tab | Assignment line | **Pass** — Bern on GLEN-SIL |
| UAT-15-P-004 | `assign-location-employee` | HR | Location employees tab | Assignment line | **Pass** — 2 staff on loc-glenelg-sil |
| UAT-15-P-005 | `assign-location-product` | Admin | Location products tab | Product line | **Pass** — 2 services on location |
| UAT-15-P-006 | `assign-task` | Any | Record tasks panel | Task created | **Pass** — tasks on SA/booking/employee |
| UAT-15-P-007 | `action-task` | Assignee | Task detail | Status updated | **Pass** — task hub scopes (TEST-098) |
| UAT-15-P-008 | `submit-leave-request` | Worker | `/my/leave` | Approval task | **Pass** — worker leave path |
| UAT-15-P-009 | `submit-employee-credential` | Worker | `/my/credentials` | HR review task | **Pass** — ROLE-013 credentials page |
| UAT-15-P-010 | `submit-leave-on-behalf` | Manager | Workforce planning | Leave row | **Pass** — calendar approved leave seed |
| UAT-15-P-011 | `review-employee-credential` | HR | Review queue | Approved/rejected | **Pass** — HR home 9 reviews |
| UAT-15-P-012 | `approve-leave-request` | Manager | Review queue | Balance updated | **Pass** — approved leave on calendar |
| UAT-15-P-013 | `financial-month-close` | Finance | Financial close | Month close or blockers | **Pass** — TEST-097 blocked close |

## Document / print processes (inventory UAT-15-P-014+)

Spot-checked during module UAT — see inventory § **Processes (UAT-15)**.

| Group | Result |
|-------|--------|
| Print SA / variation | **Pass** — UAT-04 |
| Print separation / HR docs | **Pass** — TEST-096 |
| Print claims / invoice / audit pack | **Pass** — UAT-07, TEST-099 |
| Print enquiry ack | **Pass** — UAT-01 |
| Admin session/process audit | **Partial** — UAT-13 not run |

## Full process inventory

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **Processes (UAT-15)**.
