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
| ISSUE-002 | TEST-085 | Claims | Low | Direct URL `/claims/CL-JUN26-BERN` (display ref) returns not found; use `/claims/cl-jun26-bern` | **Fixed** — `findClaimByRouteId` resolves id or document number |
| ISSUE-003 | TEST-060 | Timesheet approval | Medium | Home shows “2 awaiting approval”; hub shows 0 at GLEN-SIL and All submitted (seed June timesheets already Approved) | **Fixed** — home + hub default to `organisation` scope when user has `timesheets` window |
| ISSUE-004 | TEST-079 | Plan budget | Low | After billing rollup, claimed total $5,149 vs billing panel $3,349 (support-coord line unchanged) | **Fixed** — rollup clears categories with no billing so totals align |
| ISSUE-005 | TEST-085 | Invoices | Doc | Bern set plan-managed post-seed; June lines show “already billed” via agency claim — invoice path needs fresh seed window | **Fixed** — Bern agency; `bp-bulk-04` plan-managed + `ts-e2e-pm-jun` invoice smoke |
| ISSUE-006 | ROLE-013 | My workplace | High | Support worker `/my/shifts` and `/my/timesheets` blocked — `seed-access.sql` grants `my-shifts`/`my-timesheets` only to `role-admin` | **Fixed** — frontline roles get my-shifts/timesheets in `seed-access.sql` |
| ISSUE-007 | ROLE-012 | Access / Rostering | High | `role-rostering-manager` missing `rostering`, `service-planning`, `service-delivery` windows — read-only week view, no Publish week panel or shift editor | **Fixed** — `ROSTERING_DELIVERY_WINDOWS` in `seed.ts` + remote `seed-access.sql` |
| ISSUE-008 | TEST-060 | Rostering seed | Medium | `rs-e2e-smoke-today` uses `current_date` (22 Jun on Amplify), not June 9 week; Oliver shift shows overlap warning with GabW 10:00–18:00 | **Fixed** — pinned to `2026-06-12` in June test week |

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

### ROLE-013 — Support Worker (OliverWilliams / welcome, role-support-worker) — Pass (retest 2026-06-18)

| Step | Result |
|------|--------|
| Login | Auto-opens Support Worker workspace |
| Home | Loads; no Tasks link (expected); incidents in needs-attention |
| My workplace hub (`/my`) | Dashboard loads; shows My shifts card |
| My shifts (`/my/shifts`) | **Pass** — Today tab; 1 draft shift (Bern) |
| My timesheets (`/my/timesheets`) | **Pass** — TS-E2E-PM-JUN + TS-MAY26-OLIV listed |
| Bern client Activity | Tab loads; 3 activity rows; Add activity available |
| Generate claims (direct URL) | Page renders; Generate button disabled (no window write) — sidebar link hidden |

## Fix retest — 2026-06-18 (Amplify, post `d5cbf38`)

**Environment:** https://main.d3vim3geq5td01.amplifyapp.com · seeds re-applied · fresh login for OliverWilliams

| ISSUE | Retest | Result |
|-------|--------|--------|
| ISSUE-002 | `/claims/CL-JUN26-BERN` (display ref) | **Pass** — claim detail loads; $3,349, Accepted |
| ISSUE-003 | Home “2 awaiting approval” → `/timesheet-approval?scope=organisation` | **Pass** — All (2), Ready (1), Blocked (1) |
| ISSUE-004 | Bern Plan budget → Apply billing rollup | **Pass** — claimed $3,349 matches billing panel |
| ISSUE-005 | Generate invoices June 2026 | **Pass** — 1 eligible (plan-managed); 6 agency skipped; 0 already billed |
| ISSUE-006 | Oliver `/my/shifts`, `/my/timesheets` after re-login | **Pass** — both pages load |

## Amplify role pass — 2026-06-18 (continued)

**Environment:** https://main.d3vim3geq5td01.amplifyapp.com · June 2026 test window seed

### ROLE-012 — Rostering Manager (RileyShaw / welcome) — Pass

| Step | Result |
|------|--------|
| Login + role picker | Rostering Manager selected; home loads |
| Sidebar Service delivery | **Rostering**, Service planning, Service bookings, Generate timesheets visible |
| Rostering `?week=2026-06-09` | Week 8–14 June; `rs-e2e-smoke-today` on Fri 12 Jun (OlvW / Draft → Published) |
| Publish week panel | **1 ready · 0 blocked** after Oliver WWCC + NDIS screening in e2e seed |
| Publish 1 shift | **Pass** — shift status Published; publish panel clears |

### TEST-060 — Rostering publish smoke — Pass

| Step | Result |
|------|--------|
| `?week=2026-06-09` | Smoke shift Fri 12 June — no overlap warning |
| Publish week (RileyShaw) | **Pass** — mandatory credentials seeded for `emp-oliver` |
| Oliver `/my/shifts` | Published shift is in the past vs org “today”; week calendar `?week=2026-06-09` is the worker check |

### ROLE-014 / ROLE-015 — Not run this pass

Finance roles (`JessicaHancock` billing clerk, `TessaNguyen` finance manager) queued next. Seed review: `role-finance-manager` has claims/invoices/reconciliation windows; `role-finance-officer` billing windows need browser confirmation.
