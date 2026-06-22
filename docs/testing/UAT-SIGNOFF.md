# UAT release sign-off

Record completion of full UAT before production or major demo release.

## Release record

| Field | Value |
|-------|--------|
| **Release / milestone** | E2E smoke RC — P0 + P1 UAT complete |
| **Environment** | Amplify (`main.d3vim3geq5td01.amplifyapp.com`) |
| **Build / commit** | `9ac85f4` on `main` (P1 docs pending commit) |
| **UAT lead** | Engineering / AI-browser |
| **Sign-off date** | *Not signed — T1 + P0 + P1 packs complete; P2+ open* |

## Tier gates

| Tier | Requirement | Pass? | Date | Notes |
|------|-------------|-------|------|-------|
| T0 | `npm run build` + `page-guides:check` exit 0 | Yes | 2026-06-18 | CI / local |
| T1 | Happy path TEST-010 → TEST-099 (see TEST-RUNBOOKS) | **Pass** | 2026-06-22 | All 11 flows pass on Amplify (TEST-096 manual separation letter) |
| T2 | All P0 module packs | **Pass** | 2026-06-22 | UAT-01, 02, 04, 05, 06, 07 pass on Amplify |
| T2 | All P1 module packs (or documented deferrals) | **Pass** | 2026-06-18 | UAT-03, 08–11, 15 pass on Amplify (UAT-11 S-009 partial) |
| T3 | UAT-ROLE matrix | **Pass** | 2026-06-22 | ROLE-010–019 pass on Amplify (ROLE-017 partial — timesheet approval only) |
| T3 | UAT-15 processes | **Pass** | 2026-06-18 | Core + print processes pass; admin audit prints **Partial** (UAT-13 deferred) |
| T4 | Playwright smokes (if enabled) | N/A | | |

## Module pack sign-off

| Pack | Priority | Tester | Started | Completed | Pass | Open issues |
|------|----------|--------|---------|-----------|------|-------------|
| UAT-00 Core / home / tasks | P2 | | | | | |
| UAT-01 Enquiries & CRM | P0 | GabrielaWilson | 2026-06-22 | 2026-06-22 | **Pass** | |
| UAT-02 Clients | P0 | IslaRobinson | 2026-06-22 | 2026-06-22 | **Pass** | |
| UAT-03 Locations & catalog | P1 | IslaRobinson | 2026-06-18 | 2026-06-18 | **Pass** | |
| UAT-04 Agreements & bookings | P0 | IslaRobinson | 2026-06-22 | 2026-06-22 | **Pass** | |
| UAT-05 Planning & rostering | P0 | RileyShaw | 2026-06-22 | 2026-06-22 | **Pass** | |
| UAT-06 Timesheets | P0 | PiperCollins | 2026-06-22 | 2026-06-22 | **Pass** | S-007 partial |
| UAT-07 Billing & claims | P0 | JessicaHancock | 2026-06-22 | 2026-06-22 | **Pass** | S-009 partial |
| UAT-08 Reconciliation & close | P1 | TessaNguyen | 2026-06-18 | 2026-06-18 | **Pass** | Close blocked (expected) |
| UAT-09 Incidents & complaints | P1 | QuinnTaylor | 2026-06-18 | 2026-06-18 | **Pass** | |
| UAT-10 Workforce & HR | P1 | SandraBlake | 2026-06-18 | 2026-06-18 | **Pass** | |
| UAT-11 My workplace | P1 | OliverWilliams | 2026-06-18 | 2026-06-18 | **Pass** | S-009 partial |
| UAT-12 Reports | P2 | | | | | |
| UAT-13 Admin & system | P2 | | | | | |
| UAT-14 Portal | P3 | | | | | |
| UAT-15 Processes | P1 | Mixed | 2026-06-18 | 2026-06-18 | **Pass** | Admin audit prints partial |
| UAT-ROLE Matrix | P0 | AI-browser | 2026-06-18 | 2026-06-22 | **Pass** | ROLE-017 partial (no generate-timesheets) |

## Deferred / N/A (with approval)

| Pack or scope | Reason | Approved by | Date |
|---------------|--------|-------------|------|
| | | | |

## Open defects at sign-off

| ISSUE ID | UAT ID | Severity | Summary | Accept for release? |
|----------|--------|----------|---------|---------------------|
| — | — | — | ISSUE-001–009 fixed; ISSUE-009 needs remote `seed-access.sql` re-apply | Yes (closed after seed apply) |

## Approvals

| Role | Name | Signature / date |
|------|------|------------------|
| Product owner | | |
| Operations lead | | |
| Engineering | | |

---

*Update after each module pack completes. Link to [UAT-INDEX.md](./UAT-INDEX.md).*
