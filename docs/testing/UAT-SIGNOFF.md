# UAT release sign-off

Record completion of full UAT before production or major demo release.

## Release record

| Field | Value |
|-------|--------|
| **Release / milestone** | E2E smoke RC — pre full UAT |
| **Environment** | Amplify (`main.d3vim3geq5td01.amplifyapp.com`) |
| **Build / commit** | `4997627` + UAT docs (see latest on `main`) |
| **UAT lead** | Engineering / AI-browser |
| **Sign-off date** | *Not signed — T1 partial only* |

## Tier gates

| Tier | Requirement | Pass? | Date | Notes |
|------|-------------|-------|------|-------|
| T0 | `npm run build` + `page-guides:check` exit 0 | Yes | 2026-06-18 | CI / local |
| T1 | Happy path TEST-010 → TEST-085 (see TEST-RUNBOOKS) | **Partial** | 2026-06-18 | TEST-060, TEST-085 pass; intake smokes documented + seeded; ROLE-014/015 not run |
| T2 | All P0 module packs | No | | Structure only — execution not started |
| T2 | All P1 module packs (or documented deferrals) | No | | |
| T3 | UAT-ROLE matrix | **Partial** | 2026-06-18 | ROLE-011, 012, 013 pass; 014, 015 queued |
| T3 | UAT-15 processes | No | | |
| T4 | Playwright smokes (if enabled) | N/A | | |

## Module pack sign-off

| Pack | Priority | Tester | Started | Completed | Pass | Open issues |
|------|----------|--------|---------|-----------|------|-------------|
| UAT-00 Core / home / tasks | P2 | | | | | |
| UAT-01 Enquiries & CRM | P0 | | | | | |
| UAT-02 Clients | P0 | | | | | |
| UAT-03 Locations & catalog | P1 | | | | | |
| UAT-04 Agreements & bookings | P0 | | | | | |
| UAT-05 Planning & rostering | P0 | | | | | |
| UAT-06 Timesheets | P0 | | | | | |
| UAT-07 Billing & claims | P0 | | | | | |
| UAT-08 Reconciliation & close | P1 | | | | | |
| UAT-09 Incidents & complaints | P1 | | | | | |
| UAT-10 Workforce & HR | P1 | | | | | |
| UAT-11 My workplace | P1 | | | | | |
| UAT-12 Reports | P2 | | | | | |
| UAT-13 Admin & system | P2 | | | | | |
| UAT-14 Portal | P3 | | | | | |
| UAT-15 Processes | P1 | | | | | |
| UAT-ROLE Matrix | P0 | AI-browser | 2026-06-18 | — | **Partial** | ROLE-014/015 open |

## Deferred / N/A (with approval)

| Pack or scope | Reason | Approved by | Date |
|---------------|--------|-------------|------|
| | | | |

## Open defects at sign-off

| ISSUE ID | UAT ID | Severity | Summary | Accept for release? |
|----------|--------|----------|---------|---------------------|
| — | — | — | ISSUE-001–008 fixed and retested | Yes (closed) |

## Approvals

| Role | Name | Signature / date |
|------|------|------------------|
| Product owner | | |
| Operations lead | | |
| Engineering | | |

---

*Update after each module pack completes. Link to [UAT-INDEX.md](./UAT-INDEX.md).*
