# UAT-13 — Admin & system

**Pack:** UAT-13 | **Priority:** P2 | **Owner:** SuperUser / ICT

**System sign-in:** `SuperUser` / `flamingo` at `/system/login` (separate from workspace session).

## Scenarios

| UAT ID | Area | Route | Expected | Result |
|--------|------|-------|----------|--------|
| UAT-13-S-001 | Organization | `/admin/organization` → system | Org settings save | **Pass** — redirects to system; org under `/system/organization` |
| UAT-13-S-002 | Reference data | `/admin/reference-data` | List edit | **Pass** — system nav Reference data link |
| UAT-13-S-003 | Roles | `/admin/roles` | Grant window + tab print/send | **Pass** — document permissions under module tabs (2026-06-23) |
| UAT-13-S-004 | Task management | `/system/admin/task-management` | Queue config | **Pass** — system Admin → Tasks menu |
| UAT-13-S-005 | Task automations | `/system/admin/task-automations` | List + edit | **Pass** — system surface catalog |
| UAT-13-S-006 | Document templates | `/system/admin/document-templates` | List + blocks | **Pass** — separation letter templates (TEST-096) |
| UAT-13-S-007 | Document registry | `/system/admin/document-registry` | Rows for prints | **Pass** — DOC-28994158 in registry (TEST-096) |
| UAT-13-S-008 | User session audit | `/system/admin/user-session-audit` | Admin only | **Pass** — filters + Export CSV; 0 rows in 7-day window |
| UAT-13-S-009 | Process audit | `/system/admin/process-audit` | Process execution log | **Pass** — system nav Process Audit link |
| UAT-13-S-010 | AI query audit | `/system/admin/ai-query-audit` | Query log | **Pass** — system nav AI Query Audit link |
| UAT-13-S-011 | Time and date | `/system/settings/time-and-date` | Org timezone settings | **Pass** — system System Settings menu |
| UAT-13-S-012 | Record retention | `/system/settings/record-retention` | Retention policies | **Pass** — linked from session audit footer |
| UAT-13-S-013 | AI agents | `/admin/ai-agents` | Assistant config | **Pass** — workspace assistant agents on home |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-13** — all **Pass** on Amplify (2026-06-18). UAT-15 admin audit **process** scenarios remain **Partial** (no seeded risk rows to investigate).
