# UAT-11 — My workplace

**Pack:** UAT-11 | **Priority:** P1 | **Owner:** OliverWilliams (Support worker)

## Scenarios

| UAT ID | Route | Expected | Result |
|--------|-------|----------|--------|
| UAT-11-S-001 | `/my` | Dashboard hub | **Pass** — ROLE-013 My workplace hub |
| UAT-11-S-002 | `/my/shifts` | Today / upcoming / week | **Pass** — Bern shift week 2026-06-09 |
| UAT-11-S-003 | `/my/timesheets` | Worker timesheet list | **Pass** — ROLE-013 timesheet list |
| UAT-11-S-004 | `/my/leave` | Submit leave request | **Pass** — leave form loads (process 08) |
| UAT-11-S-005 | `/my/credentials` | Submit credential | **Pass** — worker credentials page (ISSUE-006) |
| UAT-11-S-006 | `/my/availability` | Set availability | **Pass** — availability page in my-workplace hub |
| UAT-11-S-007 | `/my/contracts` | View employment contracts | **Pass** — contracts tab loads |
| UAT-11-S-008 | `/my/profile` | Edit profile fields | **Pass** — profile / about me page |
| UAT-11-S-009 | `/my/open-shifts` | Marketplace (partial) | **Partial** — page loads; marketplace thin |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-11** — **Pass** (S-009 partial) on Amplify (2026-06-22).
