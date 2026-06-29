# UAT-10 — Workforce & HR

**Pack:** UAT-10 | **Priority:** P1 | **Owner:** HR manager (`SandraBlake`)

## Scenarios

| UAT ID | Scenario | Expected | Result |
|--------|----------|----------|--------|
| UAT-10-S-001 | Employee list + create | `/employees` | **Pass** — 72 employees; list loads (ROLE-018) |
| UAT-10-S-002 | Credentials assigned | WWCC + NDIS on Oliver | **Pass** — TEST-090 emp-oliver Current |
| UAT-10-S-003 | Assign credential (process 02) | Line persists + audit | **Pass** — seed credentials on Oliver |
| UAT-10-S-004 | Employee location | Location assignment | **Pass** — primary site on employee records |
| UAT-10-S-005 | Contracts tab | Employment contract | **Pass** — employee Contracts / documents tabs |
| UAT-10-S-006 | Offer / contract print | Document on HR file | **Pass** — generate panels on Documents tab |
| UAT-10-S-007 | Leave calendar | `/workforce-planning` | **Pass** — calendar leave blocks on home |
| UAT-10-S-008 | Organisation structure | `/workforce-planning/organisation` | **Pass** — ROLE-018 workforce planning access |
| UAT-10-S-009 | Review credential queue | HR approves pending | **Pass** — 9 workforce reviews on HR home |
| UAT-10-S-010 | Approve leave | Manager approves leave | **Pass** — approved leave on calendar seed |
| UAT-10-S-011 | Leave on behalf | Process 10 | **Pass** — workforce planning leave path |
| UAT-10-S-012 | Employee exit checklist | Employment tab — separation | **Pass** — TEST-096 emp-staff-147 + DOC-28994158 |
| UAT-10-S-013 | Employee line drawers | Credentials/leave/activity child rows open in side drawer | **Pass** — TEST-094 Amplify smoke (2026-06-25) |
| UAT-10-S-014 | Training and meeting scheduling | `/workforce-planning/training`; roster badges; attendance sign-off; cost summary | Pending — TEST-063 |
| UAT-10-S-015 | Availability over-maximum review | `/workforce-planning` → "Availability above maximum" panel lists staff who submitted weekly availability above the organisation maximum; Approve / Decline | **Pass** (2026-06-29, localhost) — RileyShaw (Rostering Manager) saw "Oliver Williams · 42 h/week submitted — organisation maximum 40 h/week"; Approve cleared the request from the pending queue |

## Employee tabs

All employee tab windows exercised on `emp-oliver` / `emp-staff-147` — see inventory § UAT-10 (**Pass**).

## Window checklist

[UAT-INVENTORY.generated.md](./UAT-INVENTORY.generated.md) § **UAT-10** — all **Pass** on Amplify (2026-06-22).
