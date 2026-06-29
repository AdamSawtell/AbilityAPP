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
| UAT-11-S-009 | `/my/open-shifts` | Open shift request marketplace | **Pass** — request / withdraw / critical fill flow covered by TEST-074 |
| UAT-11-S-010 | `/my`, `/my/open-shifts`, `/my/shifts` | Contact Rostering communication | **Pass** — Amplify TEST-075 created **REQ-3220**, history opened `/tasks/task-1782528595749`, Rostering Officer saw it in To my role |
| UAT-11-S-011 | `/my` | Services I can work at + high-demand advisory | Pending — TEST-077 |
| UAT-11-S-012 | `/my/availability` | Hours summary shows weekly total vs contracted minimum and organisation maximum | **Pass** (2026-06-29, localhost) — OliverWilliams default Mon–Fri 09:00–17:00 showed "Weekly hours: 40h · Within organisation maximum (40h/week from 80h fortnight)" |
| UAT-11-S-013 | `/my/availability` | Save within range succeeds | **Pass** (2026-06-29) — saved 40h pattern, "Availability saved" confirmation |
| UAT-11-S-014 | `/my/availability` | Availability above organisation maximum requires manager approval | **Pass** (2026-06-29) — Monday set 07:00–17:00 → live "Weekly availability (42h) exceeds the organisation maximum… Manager approval is required"; save created request and showed "Over-maximum approval: pending review" + "Availability saved — manager approval is pending for hours above the maximum" |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-11** — **Pass** on Amplify (2026-06-27); S-009/S-010 updated by TEST-074/075 coverage; S-012/S-013/S-014 (availability hours policy) verified on localhost 2026-06-29.
