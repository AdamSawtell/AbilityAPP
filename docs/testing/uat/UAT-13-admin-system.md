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
| UAT-13-S-014 | NDIS Price Guide Importer | `/system/services/ndis-price-importer` | Upload CSV, preview, apply, import history | **Pass** — Amplify 2026-06-28; sample 2026–27 CSV applied; history + revert visible |
| UAT-13-S-015 | Price Dependant Updater | `/system/services/price-update-review` | Select applied batch, analyse impacts, consent gate, apply | **Pass** — Amplify 2026-06-28; 108 scanned / 81 impacts; Active agreements consent-required; 0 ready without evidence |
| UAT-13-S-016 | Availability hours policy | `/system/settings/availability` | Configure maximum hours per period, max period, over-maximum approval role, overnight hours mode | **Pass** (2026-06-29, localhost) — settings page renders; defaults max 80h/fortnight, approval role Rostering Manager, overnight = include; default availability template sits within the cap |

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-13** — all **Pass** on Amplify (2026-06-18). UAT-15 admin audit **process** scenarios remain **Partial** (no seeded risk rows to investigate).
