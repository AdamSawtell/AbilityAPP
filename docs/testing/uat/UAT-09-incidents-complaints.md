# UAT-09 — Incidents & complaints

**Pack:** UAT-09 | **Priority:** P1 | **Owner:** Manager / Quality (`QuinnTaylor`)

## Scenarios

| UAT ID | Scenario | Expected | Result |
|--------|----------|----------|--------|
| UAT-09-S-001 | Create incident | `/incidents/new` — audit footer | **Pass** — T1 TEST-063 (HP-063) |
| UAT-09-S-002 | Incident workflow | Status transitions; tabs | **Pass** — T1 TEST-064; 30 incidents in register |
| UAT-09-S-003 | Manager override | Override granted role | **Pass** — T1 TEST-065 (HP-065) |
| UAT-09-S-004 | NDIS compliance view | `/incidents/compliance` | **Pass** — T1 TEST-098 (HP-116) |
| UAT-09-S-005 | Incident dashboard | `/incidents/dashboard` | **Pass** — 9 incidents; overdue alert (TEST-098) |
| UAT-09-S-006 | Print incident notification | Document registry | **Pass** — process on incident detail (catalog) |
| UAT-09-S-007 | Complaints register | `/complaints` — create + list | **Pass** — register loads; audit module (TEST-098) |
| UAT-09-S-008 | Client → Incidents tab | Reverse link from client | **Pass** — UAT-02-T-007 Bern 7 incidents |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-09** — all **Pass** on Amplify (2026-06-22).
