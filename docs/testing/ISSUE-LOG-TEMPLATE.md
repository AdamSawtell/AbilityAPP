# Issue log template

Use one row per defect or gap found during happy path or functional testing.

| Field | Description |
|-------|-------------|
| **ISSUE ID** | `ISSUE-001` … increment |
| **Date** | ISO date |
| **Reporter** | Name or `AI-browser` |
| **HP / FUNC / TEST** | Linked test ID(s) |
| **Module** | e.g. Rostering, Claims |
| **Severity** | Blocker / High / Medium / Low / Doc |
| **Build status** | Live / Partial / Planned |
| **Summary** | One line |
| **Steps** | Numbered repro |
| **Expected** | What should happen |
| **Actual** | What happened |
| **Evidence** | Screenshot path, console error, commit |
| **Work package** | e.g. WP-I.7 if known |

## Example

| ISSUE ID | Date | Reporter | HP / FUNC | Module | Severity | Summary |
|----------|------|----------|-----------|--------|----------|---------|
| ISSUE-001 | 2026-06-22 | AI-browser | HP-072 | Claims | Medium | Preview shows duplicate line when same timesheet approved twice |

## Open issues (delivery flows 4–5)

| ISSUE ID | HP / FUNC | Module | Severity | Summary | Status |
|----------|-----------|--------|----------|---------|--------|
| ISSUE-001 | TEST-060 | Rostering | Medium | Week view hard-defaults to Oct 2025; June test-window shifts not visible without ~37 week clicks | **Fixed** — defaults to current week; `?week=YYYY-MM-DD` deep link; Today button |
| ISSUE-002 | TEST-085 | Claims | Low | Direct URL `/claims/CL-JUN26-BERN` (display ref) returns not found; use `/claims/cl-jun26-bern` | Open |
| ISSUE-003 | TEST-060 | Timesheet approval | Medium | Home shows “2 awaiting approval”; hub shows 0 at GLEN-SIL and All submitted (seed June timesheets already Approved) | Open |
| ISSUE-004 | TEST-079 | Plan budget | Low | After billing rollup, claimed total $5,149 vs billing panel $3,349 (support-coord line unchanged) | Open |
| ISSUE-005 | TEST-085 | Invoices | Doc | Bern set plan-managed post-seed; June lines show “already billed” via agency claim — invoice path needs fresh seed window | Open |
| ISSUE-006 | ROLE-013 | My workplace | High | Support worker `/my/shifts` and `/my/timesheets` blocked — `seed-access.sql` grants `my-shifts`/`my-timesheets` only to `role-admin` | Open |

## Amplify deep pass — 2026-06-22

**Environment:** https://main.d3vim3geq5td01.amplifyapp.com · SuperUser · June 2026 test window seed

### TEST-060 — Pass (partial)

| Step | Result |
|------|--------|
| Generate timesheets (2026-06-01–30) | Blocked — pay period marked closed (expected for seeded month) |
| Timesheet approval (GLEN-SIL / All submitted) | Page OK; 0 rows (June Bern timesheets already Approved) |
| Rostering publish `rs-e2e-smoke-today` | Skipped — roster week anchored Oct 2025 (ISSUE-001) |

### TEST-085 — Pass

| Step | Result |
|------|--------|
| Generate claims (June) | 0 eligible; 6 plan-managed skipped; no duplicate generation |
| Claim `cl-jun26-bern` | Accepted, $3,349, 6 lines, PAPL pass, remittance matched, audit footer |
| Generate invoices (June) | 0 eligible; 6 already billed (agency claim path — ISSUE-005) |
| Bern plan budget rollup | Apply + save → claimed $5,149, persisted (SuperUser audit) |
| Plan reconciliation (2026-06) | Bern variance row loads |

## Amplify role pass — 2026-06-18

**Environment:** https://main.d3vim3geq5td01.amplifyapp.com · June 2026 test window seed

### ROLE-011 — Support Coordinator (IslaRobinson / welcome, role-coordinator) — Pass

| Step | Result |
|------|--------|
| Login + role picker | Support Coordinator selected; home loads |
| Bern plan budget | Tab loads; rollup panel $3,349 vs claimed $5,149 (ISSUE-004) |
| Service agreements | List loads (22 agreements incl. Bern) |
| Service bookings | List loads; Bern SIL bookings visible |
| Rostering `?week=2026-06-09` | Week 8–14 June; Bern shifts (IslaR, GabW) visible |
| Generate claims | Page loads; 0 eligible (Oct default period) |
| Financial close (2026-06) | Checklist loads; close blocked (variance + payroll — expected) |

### ROLE-013 — Support Worker (OliverWilliams / welcome, role-support-worker) — Partial

| Step | Result |
|------|--------|
| Login | Auto-opens Support Worker workspace |
| Home | Loads; no Tasks link (expected); incidents in needs-attention |
| My workplace hub (`/my`) | Dashboard loads; shows My shifts card |
| My shifts (`/my/shifts`) | **Blocked** — “Your role does not include this self-service area” (ISSUE-006) |
| My timesheets (`/my/timesheets`) | **Blocked** — same message (ISSUE-006) |
| Bern client Activity | Tab loads; 3 activity rows; Add activity available |
| Generate claims (direct URL) | Page renders; Generate button disabled (no window write) — sidebar link hidden |
