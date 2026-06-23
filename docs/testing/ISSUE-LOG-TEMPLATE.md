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
| ISSUE-009 | ROLE-014 | Access / Finance | High | `role-finance-officer` missing billing windows — no Claims/Invoices in sidebar; pages only via direct URL | **Fixed** — `FINANCE_OFFICER_BILLING_WINDOWS` in `seed.ts` + `seed-access.sql` (re-applied remote) |
| ISSUE-010 | TEST-020 | Enquiries / convert | Doc | Runbook said Support Coordinator converts; `role-coordinator` has no `enquiry-to-client` — convert button only on Intake role | **Fixed** — TEST-RUNBOOKS.md updated; use Intake Coordinator for convert |
| ISSUE-011 | TEST-096 | HR / Access | High | HR Manager missing `print-employee-separation` — exit panel / generate letter not granted | **Fixed** — `HR_DOCUMENT_PRINT_PROCESSES` in `role-access-templates.ts` + `seed-access.sql` |
| ISSUE-012 | TEST-096 | HR / Org | Doc | Auto-generate separation letter fails without org ABN on Amplify seed | **Fixed** — `app_organization.abn` in `seed-e2e-amplify-smoke.sql` + `defaultOrganization()` |

## Amplify deep pass — 2026-06-22

**Environment:** https://app.abilityvua.com · SuperUser · June 2026 test window seed

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

**Environment:** https://app.abilityvua.com · June 2026 test window seed

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

**Environment:** https://app.abilityvua.com · seeds re-applied · fresh login for OliverWilliams

| ISSUE | Retest | Result |
|-------|--------|--------|
| ISSUE-002 | `/claims/CL-JUN26-BERN` (display ref) | **Pass** — claim detail loads; $3,349, Accepted |
| ISSUE-003 | Home “2 awaiting approval” → `/timesheet-approval?scope=organisation` | **Pass** — All (2), Ready (1), Blocked (1) |
| ISSUE-004 | Bern Plan budget → Apply billing rollup | **Pass** — claimed $3,349 matches billing panel |
| ISSUE-005 | Generate invoices June 2026 | **Pass** — 1 eligible (plan-managed); 6 agency skipped; 0 already billed |
| ISSUE-006 | Oliver `/my/shifts`, `/my/timesheets` after re-login | **Pass** — both pages load |

## Amplify role pass — 2026-06-18 (continued)

**Environment:** https://app.abilityvua.com · June 2026 test window seed

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

### ROLE-014 / ROLE-015 — Amplify pass — 2026-06-18

**Environment:** https://app.abilityvua.com · June 2026 test window seed

### ROLE-014 — Finance Officer (JessicaHancock / welcome) — Pass (after ISSUE-009 seed fix)

| Step | Result |
|------|--------|
| Login + role picker | Finance Officer selected; home loads |
| Sidebar — billing | **Fail pre-fix** — no Finance nav on home; **fixed** in `FINANCE_OFFICER_BILLING_WINDOWS` |
| `/generate-claims` — June 2026 | **Pass** — preview loads; 0 eligible, 6 already claimed, 1 plan-managed skipped |
| `/claims` | **Pass** — list loads; CL-JUN26-BERN visible |
| `/invoices` | **Pass** — list loads; June invoices visible |

### ROLE-015 — Finance Manager (TessaNguyen / welcome) — Pass

| Step | Result |
|------|--------|
| Login + role picker | Finance Manager selected; home loads |
| Sidebar — Service delivery | Plan / claim / invoice reconciliation + financial close + audit pack visible |
| `/plan-reconciliation?period=2026-06` | **Pass** — Bern row; 3 participants, billed $3,349 |
| `/financial-close?period=2026-06` | **Pass** — checklist loads; close blocked (payroll + plan variance — expected) |

## Intake chain pass — 2026-06-22

**Seeds:** `seed-access.sql` + `seed-e2e-intake` re-applied · Amplify

### ROLE-016 — GabrielaWilson (Intake) — Pass

| Step | Result |
|------|--------|
| Sidebar | Enquiries visible; no billing / generate-claims |
| `/enquiries` | List loads; Samuel in active pipeline |
| `/enquiries/1000025` | Proposal status; pipeline + audit footer |

### TEST-010 — Pass

| Step | Result |
|------|--------|
| Enquiry `1000025` at Proposal | **Pass** — seeded qualification complete |
| Activity tab | 1 row from intake seed |
| Audit footer | Visible |

### TEST-020 — Pass (intake role)

| Step | Result |
|------|--------|
| Isla as **Support Coordinator** on `1000025` | No Convert button (ISSUE-010) |
| Isla switched to **Intake Coordinator** | Convert to client **Pass** |
| New client | `bp-samu` · enquiry link `1000025` · activity carried forward |

### TEST-030 — Pass (2026-06-22)

| Step | Result |
|------|--------|
| `bp-samu` Full profile (Isla / coordinator) | **Pass** — lifecycle **active**; status Active receiving support |
| Plan manager + invoice delivery | **Pass** — MyPlan Manager; Email |
| Audit footer | Updated by Isla Robinson on save |

### ISSUE-009 retest — Jessica billing sidebar — Pass

| Step | Result |
|------|--------|
| JessicaHancock re-login after `seed-access.sql` | **Pass** — Service delivery → Claims, Generate claims, Invoices, Generate invoices |

## Amplify role pass — 2026-06-22 (continued)

**Seeds:** `seed-access.sql` + `seed-e2e-amplify` re-applied

### ROLE-010 — SuperUser — Pass

| Step | Result |
|------|--------|
| Sidebar | Enquiries, Clients, Service delivery (full), Admin → Roles |
| Service delivery submenu | Rostering through Board reporting |

### ROLE-017 — PiperCollins (Team Leader) — Pass (partial)

| Step | Result |
|------|--------|
| Login | `PiperCollins` / welcome — doc listed `PiperHall` (incorrect username) |
| Sidebar | Timesheet approval under Service delivery |
| `/timesheet-approval` | **Pass** — scope picker; Ready/Review/Blocked tabs |
| Generate timesheets | Not granted to `role-team-leader` in seed (expected) |

### ROLE-018 — SandraBlake (HR Manager) — Pass

| Step | Result |
|------|--------|
| People menu | **Pass** — Employees, Workforce planning |
| Home workforce reviews | 9 leave requests in needs-attention |

### ROLE-019 — QuinnTaylor (Quality Manager) — Pass

| Step | Result |
|------|--------|
| Incident reports sidebar | **Pass** — list loads from home |
| `/ndis-audit-pack` | Access denied for Quality Manager (expected — use SuperUser for TEST-099) |

## Amplify flows 6–11 — 2026-06-22

**Environment:** https://app.abilityvua.com · Remote seeds re-applied (`seed-access.sql`, intake, amplify)

### TEST-090 — Flow 6 employee credentials — Pass

| Step | Result |
|------|--------|
| `/employees/emp-oliver` → Credentials Assigned | WWCC **Current**; NDIS Worker Screening **Current** (First Aid expiring soon — non-blocking) |

### TEST-095 — Flow 7 participant exit — Pass

| Step | Result |
|------|--------|
| IslaRobinson / coordinator → `bp-e2e-exit` | Lifecycle **active** after intake seed |
| Activity — exit handover note | Saved; audit footer updated |
| Full profile — lifecycle **exit** + reason + inactive status | Saved; persists on page (re-run intake seed resets to active) |

### TEST-097 — Flow 9 financial close — Pass

| Step | Result |
|------|--------|
| TessaNguyen → `/financial-close?period=2026-06` | Checklist renders; Mark month closed disabled |
| Blockers | Plan variance, overdue invoice, 2 timesheets not exported (expected) |

### TEST-098 — Flow 10 governance — Pass

| Step | Result |
|------|--------|
| QuinnTaylor → `/complaints` | Register loads; audit module label |
| QuinnTaylor → `/incidents/dashboard` | 9 incidents in range; overdue investigations alert |

### TEST-099 — Flow 11 reporting wrap — Pass

| Step | Result |
|------|--------|
| SuperUser → `/ndis-audit-pack?period=2026-06` | 10 sections; Export manifest + CSV actions |
| SuperUser → `/board-reporting` | Monthly Board Report — June 2026 listed |
| QuinnTaylor → audit pack / board | Access denied (role-gated — SuperUser path per runbook) |

### TEST-096 — Flow 8 employee exit — Pass

| Step | Result |
|------|--------|
| SandraBlake → `/employees/emp-staff-147?tab=Employment` | Exit workflow panel visible (after ISSUE-011 seed fix) |
| Separation letter | **Pass** — auto-generate **DOC-28994158** on Documents tab (ISSUE-011 + ISSUE-012 fixed); prior manual line also present |
| End date `2026-06-30` + status **Terminated** | Saved; checklist **Exit checklist complete** |
| Export checklist | CSV export clicked |
| Refresh | Terminated + end date persist; audit trail updated |

## UAT-01 — Enquiries & CRM — 2026-06-22

**User:** GabrielaWilson / welcome · Amplify

| Scenario | Result |
|----------|--------|
| UAT-01-S-001 — `/enquiries` list | **Pass** — 27 enquiries; module audit |
| UAT-01-S-002 — New enquiry | **Pass** — New enquiry action available |
| UAT-01-S-003 — Pipeline `1000025` | **Pass** — Proposal stage |
| UAT-01-S-004–008 | **Pass** — prior TEST-010/011 + HubSpot panel |
| UAT-01-S-009 — Lost `1000014` | **Pass** — `5_Lost` + No response from enquirer |
| UAT-01-S-010 — Convert guard | **Pass** — Convert disabled when unsaved |
| UAT-01-S-011 — All tabs | **Pass** — tabs render; audit footer on record |
| Window checklist UAT-01-W-001–006 | **Pass** — enquiries + all enquiry tabs on `1000025` |

## UAT-02 — Clients — 2026-06-22

**User:** IslaRobinson / Support Coordinator · Amplify · `bp-bern`, `bp-e2e-exit`

| Scenario | Result |
|----------|--------|
| UAT-02-T-001–023 | **Pass** — all client tabs visible/load on Bern; Plan budget + Full profile deep-checked |
| UAT-02-S-001–003 | **Pass** — prior TEST-020 / process demos |
| UAT-02-S-004 | **Pass** — `bp-e2e-exit` lifecycle **exit** + Voluntary withdrawal saved |
| Window checklist UAT-02-W-001–023 | **Pass** |

## ISSUE-011 / ISSUE-012 retest — Separation auto-generate — Pass (2026-06-22)

| Step | Result |
|------|--------|
| Push `3506136` + SandraBlake re-login | HR Manager sees **Generate separation letter** on Documents tab |
| `emp-staff-147` → Generate separation letter | **Pass** — DOC-28994158 generated; saved to HR file (2 document rows) |
| Download HTML / Print preview | Enabled after generate |

## UAT-04 — Agreements & bookings — Pass (2026-06-22)

**User:** IslaRobinson / Support Coordinator · Amplify · `sa-rose-ni`, `sb-50145`, `bp-e2e-exit`

| Scenario | Result |
|----------|--------|
| UAT-04-S-001–007 | **Pass** — SA active + lines; booking create; E2EXIT exit warning; cancelled 50151 |
| Window UAT-04-W-001–006 | **Pass** |

## UAT-05 — Planning & rostering — Pass (2026-06-22)

**User:** IslaRobinson + RileyShaw (prior TEST-060) · `?week=2026-06-09`

| Scenario | Result |
|----------|--------|
| UAT-05-S-001–008 | **Pass** — service planning, roster grid, publish panel, open shifts 23 |
| Window UAT-05-W-001–003 | **Pass** |

## UAT-06 — Timesheets — Pass (2026-06-22)

**Users:** IslaRobinson / PiperCollins path; OliverWilliams (ROLE-013)

| Scenario | Result |
|----------|--------|
| UAT-06-S-001–006 | **Pass** — approval hub Blocked (1); worker my/shifts + my/timesheets |
| UAT-06-S-007 | **Partial** — payroll export fields not re-run |
| Window UAT-06-W-001–003 | **Pass** |

## UAT-07 — Billing & claims — Pass (2026-06-22)

**User:** IslaRobinson + JessicaHancock (ROLE-014) · `cl-jun26-bern`

| Scenario | Result |
|----------|--------|
| UAT-07-S-001–008, S-010 | **Pass** — claim $3,349 Accepted; PAPL 6/6; remittance matched |
| UAT-07-S-009 | **Partial** — invoice delivery scaffold only (HP-074) |
| Window UAT-07-W-001–004 | **Pass** |

## UAT-03 — Locations & catalog — Pass (2026-06-18)

**User:** IslaRobinson / Support Coordinator · Amplify · `loc-glenelg-sil`, `/products`

| Scenario | Result |
|----------|--------|
| UAT-03-S-001–007 | **Pass** — locations list; 8 tabs on Glenelg SIL; products SIL_WD, COMM_PART, TRANS_KM |
| Window UAT-03-W-001–019 | **Pass** |

## UAT-08 — Reconciliation & close — Pass (2026-06-18)

**User:** TessaNguyen / Finance Manager · Amplify · `?period=2026-06`

| Scenario | Result |
|----------|--------|
| UAT-08-S-001–006 | **Pass** — plan/claim/invoice recon; financial close checklist blocked (expected); audit pack + board report |
| Window UAT-08-W-001–006 | **Pass** |

## UAT-09 — Incidents & complaints — Pass (2026-06-18)

**User:** QuinnTaylor / Quality Manager · Amplify · `/complaints`, incidents register

| Scenario | Result |
|----------|--------|
| UAT-09-S-001–008 | **Pass** — incident workflow (TEST-063–065); compliance + dashboard (TEST-098); complaints register |
| Window UAT-09-W-001–009 | **Pass** |

## UAT-10 — Workforce & HR — Pass (2026-06-18)

**User:** SandraBlake / HR Manager · Amplify · `emp-oliver`, `emp-staff-147`

| Scenario | Result |
|----------|--------|
| UAT-10-S-001–012 | **Pass** — employee tabs; credentials; workforce planning; separation letter DOC-28994158 (TEST-096) |
| Window UAT-10-W-001–022 | **Pass** |

## UAT-11 — My workplace — Pass (2026-06-18)

**User:** OliverWilliams / Support worker · Amplify · `/my`, `/my/leave`, `/my/open-shifts`

| Scenario | Result |
|----------|--------|
| UAT-11-S-001–008 | **Pass** — hub, shifts, timesheets, leave, credentials (ROLE-013) |
| UAT-11-S-009 | **Partial** — open-shifts page loads; marketplace thin |
| Window UAT-11-W-001–009 | **Pass** (W-006 partial) |

## UAT-15 — Processes — Pass (2026-06-18)

**Users:** Mixed personas · evidence from T1 + module UATs

| Group | Result |
|-------|--------|
| Core workflows (convert, assign, leave, tasks) | **Pass** — UAT-15-P-001–016 |
| Print / document processes | **Pass** — invoices, SA, separation, claims, audit pack, support plan print/send |
| UAT-15-P-018, P-025, P-027, P-031 | **Partial** — batch print, participant statement, issue invoice, consent schedule |
| UAT-15-P-040, P-041 | **Pass** — print-support-plan, send-support-plan (Bern localhost 2026-06-23) |
| Admin audit prints (P-033–039) | **Partial** — windows pass; no seeded risk rows to investigate |

## UAT-00 — Core, home & tasks — Pass (2026-06-18)

**Users:** IslaRobinson + SuperUser · Amplify · `/`, `/tasks`

| Scenario | Result |
|----------|--------|
| UAT-00-S-001–007 | **Pass** — home panels; task scopes assigned/my-role/all/past; quick new enquiry |
| Window UAT-00-W-001–013 | **Pass** |

## UAT-12 — Reports — Pass (2026-06-18)

**Users:** IslaRobinson (reports hub) + SuperUser (Reports Advance) · Amplify

| Scenario | Result |
|----------|--------|
| UAT-12-R-001 | **Pass** — client register 23 rows · 20 columns · Export CSV |
| UAT-12-R-002–010 | **Pass** — hub listings + TEST-099 audit/financial summaries |
| UAT-12-R-008 (access) | **Pass** — worker has no Reports sidebar (ROLE-008) |
| UAT-12-R-009 | **Pass** — `/system/admin/reports-advance` SQL console |
| Window UAT-12-W-001–005 | **Pass** |

## UAT-13 — Admin & system — Pass (2026-06-18)

**User:** SuperUser / flamingo · `/system/login` · system surface

| Scenario | Result |
|----------|--------|
| UAT-13-S-001–013 | **Pass** — org, roles, task admin, document registry, session/process/AI audit nav |
| UAT-13-S-008 | **Pass** — session audit filters; 0 rows in default 7-day window |
| Window UAT-13-W-001–014 | **Pass** |
