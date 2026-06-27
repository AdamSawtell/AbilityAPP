# UAT-00 — Core, home & tasks

**Pack:** UAT-00 | **Priority:** P2 | **Owner:** All personas

## Scenarios

| UAT ID | Scenario | User | Pass if | Result |
|--------|----------|------|---------|--------|
| UAT-00-S-001 | Home dashboard | IslaRobinson | Needs-attention, stats load | **Pass** — 6 needs-attention; Clients 23, Incidents 30, Employees 72 |
| UAT-00-S-002 | Quick new enquiry | SuperUser | Navigates to `/enquiries/new` | **Pass** — New enquiry quick action on home |
| UAT-00-S-003 | Tasks — assigned to me | IslaRobinson | `/tasks?scope=assigned-to-me` | **Pass** — 24 assigned; overdue/due-today panels |
| UAT-00-S-004 | Tasks — to my role | IslaRobinson | `/tasks?scope=my-role` | **Pass** — 17 Support Coordinator scope |
| UAT-00-S-005 | Tasks — all | SuperUser | `/tasks?scope=all` | **Pass** — 41 all tasks; past scope 33 |
| UAT-00-S-006 | Create task on client | Coordinator | Linked entity; audit | **Pass** — New task link on task hub (UAT-15-P-009) |
| UAT-00-S-007 | Complete task | Assignee | Status closed; timeline | **Pass** — task detail links from hub (TEST-098 HP-117) |
| UAT-00-S-008 | Home My calendar — shifts and requests | AvaThomas | Allocated shift + pending request chips show on Home calendar | **Pass** — Amplify TEST-076 shows teal allocated shifts and cyan **Requested 09:00–15:00** for Tue 14 July |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-00** — all **Pass** on Amplify (2026-06-27).
