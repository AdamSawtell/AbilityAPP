# AbilityAPP Happy Path and End-to-End Testing Matrix

**Version:** 0.2 (sections 4–5)  
**Last updated:** 2026-06-22  
**Environment:** Localhost (`npm run dev`) with Supabase remote + demo seed unless noted.

## ID scheme

| Prefix | Range (this doc) | Use |
|--------|------------------|-----|
| HP | 041–085 | Happy path steps — flows 4–5 |
| FUNC | 200–439 | Functional checks — delivery modules |
| TEST | 040–089 | Executable test cases tied to HP rows |
| DATA | 010–019 | Seed / synthetic records for flows 4–5 |
| ROLE | 010–019 | Role suites for delivery modules |
| ISSUE | — | See [ISSUE-LOG-TEMPLATE.md](./ISSUE-LOG-TEMPLATE.md) |

**Build status legend:** **Live** = shippable in demo; **Partial** = UI or logic exists but incomplete vs scope; **Planned** = in roadmap / process doc only; **N/A** = out of AbilityAPP scope.

## Table of contents

1. Purpose and scope — *planned*
2. Test environment and roles — *planned*
3. Core spine overview — *planned*
4. **End-to-end happy path — flows 4–5** *(this release)*
5. **Functional test matrix — delivery modules** *(this release)*
6. Data and seed catalogue — *planned*
7. Role permission matrix — *planned*
8. Issue log — see [ISSUE-LOG-TEMPLATE.md](./ISSUE-LOG-TEMPLATE.md)
9. Missing functions and gaps review — *summary in §9 below; full cross-module pass planned*

---

## 4. End-to-end happy path — flows 4–5

### Flow 4 — Service agreement → rostering / service delivery

**Goal:** Turn an approved service agreement and booking into planned shifts, a published roster, worker assignment, and delivered service (timesheet source).

**Primary DATA:** `DATA-010` Bern (`bp-bern`), `DATA-011` Bern SA/lines, `DATA-012` service booking, `DATA-013` bulk support workers, `DATA-014` location/site.

| Step | HP ID | Actor | Action | Route / surface | Expected outcome | Build | TEST ID |
|------|-------|-------|--------|-----------------|------------------|-------|---------|
| 4.1 | HP-041 | Coordinator | Confirm participant has active NDIS plan budget lines | `/clients/bp-bern?tab=Plan%20budget` | Plan budget tab shows categories, allocated/claimed rollup panel | Live | TEST-041 |
| 4.2 | HP-042 | Coordinator | Set billing + comms prefs (plan manager path) | `/clients/bp-bern?tab=Billing%20and%20communication` | Plan manager BP linked; invoice email/delivery prefs saved; audit on save | Live | TEST-042 |
| 4.3 | HP-043 | Coordinator | Open or create service agreement for participant | `/service-agreements` → detail | SA list/filter works; Overview + Lines tabs; audit footer | Live | TEST-043 |
| 4.4 | HP-044 | Coordinator | Add SA line(s) with product, qty/rate, dates | SA → Lines tab | Lines persist after refresh; line audit diff on save | Live | TEST-044 |
| 4.5 | HP-045 | Coordinator | Activate / approve SA (status → active) | SA Overview | Status transition saved; eligible for booking/planning | Live | TEST-045 |
| 4.6 | HP-046 | Coordinator | Create service booking from SA | `/service-bookings` → new/detail | Booking links to client + SA; Overview + Lines | Live | TEST-046 |
| 4.7 | HP-047 | Coordinator | Add booking lines (schedule pattern, location, ratio) | Booking → Lines | Lines saved; location and product resolve from catalog | Live | TEST-047 |
| 4.8 | HP-048 | Planner | Open service planning for booking window | `/service-planning` | Planning board/list shows demand from bookings | Live | TEST-048 |
| 4.9 | HP-049 | Planner | Generate or adjust planned service instances | `/service-planning` | Instances appear for date range; edit persists | Live | TEST-049 |
| 4.10 | HP-050 | Roster admin | Build roster from planned instances | `/rostering` | Shifts appear on roster grid/calendar | Live | TEST-050 |
| 4.11 | HP-051 | Roster admin | Assign qualified worker(s) to shifts | `/rostering` | Assignment saved; conflicts surfaced if rules hit | Partial | TEST-051 |
| 4.12 | HP-052 | Roster admin | Publish roster / notify workers | `/rostering` | Published state visible; worker sees shift in My workplace | Partial | TEST-052 |
| 4.13 | HP-053 | Support worker | View assigned shift | `/my/shifts` | Shift list matches roster assignment | Live | TEST-053 |
| 4.14 | HP-054 | Support worker | Check in / check out (or manual timesheet path) | `/my/shifts` or `/my/timesheets` | Attendance captured or timesheet draft created | Partial | TEST-054 |
| 4.15 | HP-055 | Team lead | Generate timesheets from roster/attendance | `/generate-timesheets` | Preview lists billable lines from delivered shifts | Live | TEST-055 |
| 4.16 | HP-056 | Team lead | Approve timesheet | `/timesheet-approval` | Status → approved; locked for claim generation | Live | TEST-056 |
| 4.17 | HP-057 | Coordinator | Verify client Activity reflects service | `/clients/bp-bern?tab=Activity` | Activity row or case note linked to shift/date | Live | TEST-057 |
| 4.18 | HP-058 | Admin | Confirm audit trail on SA, booking, roster, timesheet | Each record → Full audit trail | Field-level events on save | Live | TEST-058 |
| 4.19 | HP-059 | SuperUser | Access control: coordinator without roster grant | `/rostering` | Blocked or read-only per role matrix | Live | TEST-059 |
| 4.20 | HP-060 | AI browser | Smoke chain 4.1→4.16 with Bern + one worker | Multi-route | No console errors; data survives refresh | Live | TEST-060 |

**Flow 4 exit criteria:** Approved timesheet exists for Bern linked to a rostered shift derived from SA → booking → planning.

---

### Flow 5 — Service delivery → case notes, incidents, claims, billing

**Goal:** After delivery, document the session, handle incidents if needed, generate NDIS claims and plan-managed invoices, reconcile, and roll claimed amounts into plan budget.

**Depends on:** Flow 4 exit (approved timesheet) or seed timesheet for Bern.

| Step | HP ID | Actor | Action | Route / surface | Expected outcome | Build | TEST ID |
|------|-------|-------|--------|-----------------|------------------|-------|---------|
| 5.1 | HP-061 | Support worker | Add case note / activity on client | `/clients/bp-bern?tab=Activity` | Note saved; visible in Activity line table; audit | Live | TEST-061 |
| 5.2 | HP-062 | Coordinator | Link activity to service date / shift | Activity line fields | Reference to delivery period where supported | Partial | TEST-062 |
| 5.3 | HP-063 | Any reporter | Log incident (if occurred) | `/incidents` → new | Incident created; Overview + tabs; audit footer | Live | TEST-063 |
| 5.4 | HP-064 | Manager | Progress incident workflow (review, NDIS fields) | `/incidents/{id}` | Status transitions; compliance tab available | Live | TEST-064 |
| 5.5 | HP-065 | Manager | Override manager review (if role granted) | Incident + `incident-manager-override` | Override action audited | Live | TEST-065 |
| 5.6 | HP-066 | Billing clerk | Preview NDIS claims from approved timesheets | `/generate-claims` | Preview lines with PAPL validation messages | Live | TEST-066 |
| 5.7 | HP-067 | Billing clerk | Generate claims (incl. standard delivery) | `/generate-claims` | Claim records created; locked timesheets excluded from re-gen | Live | TEST-067 |
| 5.8 | HP-068 | Billing clerk | Preview cancellation claims | `/generate-claims` (cancellation panel) | Cancellation lines from roster cancellations | Live | TEST-068 |
| 5.9 | HP-069 | Billing clerk | Gateway dry-run / PAPL hard blocks | Claim detail / generate | Stub gateway; hard blocks prevent invalid submit | Live | TEST-069 |
| 5.10 | HP-070 | Billing clerk | Review claim list and statuses | `/claims` | Filter, open detail, audit trail | Live | TEST-070 |
| 5.11 | HP-071 | Billing clerk | Import remittance and match payments | Remittance import surface | Payments matched to claims (WP-I.3) | Live | TEST-071 |
| 5.12 | HP-072 | Billing clerk | Preview plan-managed invoices | `/generate-invoices` | Uses client billing prefs + plan manager BP | Live | TEST-072 |
| 5.13 | HP-073 | Billing clerk | Generate invoices | `/generate-invoices` | Invoice records; line linkage to claims/delivery | Live | TEST-073 |
| 5.14 | HP-074 | Billing clerk | Send / export invoice (email scaffold) | Invoice detail | Delivery method reflects comms prefs | Partial | TEST-074 |
| 5.15 | HP-075 | Finance | Plan reconciliation | `/plan-reconciliation` | Participant plan vs claimed/billed variance | Live | TEST-075 |
| 5.16 | HP-076 | Finance | Claim reconciliation | `/claim-reconciliation` | Claim vs payment status | Live | TEST-076 |
| 5.17 | HP-077 | Finance | Invoice reconciliation | `/invoice-reconciliation` | Invoice vs remittance | Live | TEST-077 |
| 5.18 | HP-078 | Finance | Review financial close checklist | `/financial-close` | Close tasks visible (process alignment) | Partial | TEST-078 |
| 5.19 | HP-079 | Coordinator | Verify plan budget claimed rollup updated | `/clients/bp-bern?tab=Plan%20budget` | Claimed amounts reflect generated claims | Live | TEST-079 |
| 5.20 | HP-080 | Quality | NDIS audit pack extract | `/ndis-audit-pack` | Export bundle for sample period | Partial | TEST-080 |
| 5.21 | HP-081 | Exec | Board reporting snapshot | `/board-reporting` | KPI panels render for seeded org | Partial | TEST-081 |
| 5.22 | HP-082 | SuperUser | Full audit trail across claim + invoice save | Claim + invoice records | Single save → one audit event with field detail | Live | TEST-082 |
| 5.23 | HP-083 | Billing clerk | Negative: claim from unapproved timesheet | `/generate-claims` | Excluded or validation error | Live | TEST-083 |
| 5.24 | HP-084 | Billing clerk | Negative: invoice without plan manager when required | `/generate-invoices` | Validation or empty preview | Live | TEST-084 |
| 5.25 | HP-085 | AI browser | Smoke chain 5.6→5.19 after Flow 4 | Multi-route | Claims + rollup visible; no duplicate claims on re-run | Live | TEST-085 |

**Flow 5 exit criteria:** At least one claim and (for plan-managed Bern) one invoice exist; plan budget claimed rollup updated; reconciliation pages load without error.

---

### AI browser instructions (flows 4–5)

1. Sign in as **SuperUser** (demo seed).
2. Run **TEST-060** then **TEST-085** in order; log failures to [ISSUE-LOG-TEMPLATE.md](./ISSUE-LOG-TEMPLATE.md).
3. After each save, hard-refresh and confirm persistence.
4. Open **Full audit trail** on SA, booking, timesheet, claim, and invoice.
5. Capture console errors and network 4xx/5xx on `/generate-claims` and `/generate-invoices`.

---

## 5. Functional test matrix — delivery modules

Columns: **FUNC ID** | **Module** | **Function** | **Route / entry** | **Roles** | **Build** | **HP / TEST refs**

### 5.1 Services — agreements and bookings

| FUNC ID | Module | Function | Route | Roles | Build | Refs |
|---------|--------|----------|-------|-------|-------|------|
| FUNC-200 | Service agreement | List + search | `/service-agreements` | Coordinator+ | Live | HP-043, TEST-043 |
| FUNC-201 | Service agreement | Create record | `/service-agreements/new` | Coordinator+ | Live | HP-043 |
| FUNC-202 | Service agreement | Overview save + audit | SA detail Overview | Coordinator+ | Live | HP-043, HP-058 |
| FUNC-203 | Service agreement | Lines CRUD | SA Lines tab | Coordinator+ | Live | HP-044 |
| FUNC-204 | Service agreement | Status lifecycle | SA Overview | Coordinator+ | Live | HP-045 |
| FUNC-205 | Service booking | List + filter | `/service-bookings` | Coordinator+ | Live | HP-046 |
| FUNC-206 | Service booking | Create + link SA | `/service-bookings/new` | Coordinator+ | Live | HP-046 |
| FUNC-207 | Service booking | Lines CRUD | Booking Lines | Coordinator+ | Live | HP-047 |
| FUNC-208 | Service booking | Client/location resolution | Booking Overview | Coordinator+ | Live | HP-047 |
| FUNC-209 | Contract / product | Catalog drives SA lines | `/products`, `/price-lists` | Admin | Live | HP-044 |

### 5.2 Planning and rostering

| FUNC ID | Module | Function | Route | Roles | Build | Refs |
|---------|--------|----------|-------|-------|-------|------|
| FUNC-240 | Service planning | View demand | `/service-planning` | Planner+ | Live | HP-048 |
| FUNC-241 | Service planning | Edit planned instances | `/service-planning` | Planner+ | Live | HP-049 |
| FUNC-242 | Rostering | Roster grid/calendar | `/rostering` | Roster admin | Live | HP-050 |
| FUNC-243 | Rostering | Create shift from plan | `/rostering` | Roster admin | Live | HP-050 |
| FUNC-244 | Rostering | Assign worker | `/rostering` | Roster admin | Partial | HP-051 |
| FUNC-245 | Rostering | Publish / notify | `/rostering` | Roster admin | Partial | HP-052 |
| FUNC-246 | Rostering | Conflict / qualification hints | `/rostering` | Roster admin | Partial | — |
| FUNC-247 | My workplace | View my shifts | `/my/shifts` | Support worker | Live | HP-053 |
| FUNC-248 | My workplace | Check-in/out | `/my/shifts` | Support worker | Partial | HP-054 |
| FUNC-249 | Open shifts | Marketplace claim | `/my/open-shifts` | Support worker | Partial | — |

### 5.3 Timesheets

| FUNC ID | Module | Function | Route | Roles | Build | Refs |
|---------|--------|----------|-------|-------|-------|------|
| FUNC-300 | Timesheets | List | `/timesheets` | Team lead+ | Live | HP-055 |
| FUNC-301 | Generate timesheets | Preview from roster | `/generate-timesheets` | Team lead+ | Live | HP-055, TEST-055 |
| FUNC-302 | Generate timesheets | Generate records | `/generate-timesheets` | Team lead+ | Live | HP-055 |
| FUNC-303 | Timesheet approval | Approve / reject | `/timesheet-approval` | Team lead+ | Live | HP-056, TEST-056 |
| FUNC-304 | My timesheets | Worker entry | `/my/timesheets` | Support worker | Live | HP-054 |
| FUNC-305 | Timesheets | Lock after claim gen | `/generate-claims` | Billing | Live | HP-067, TEST-083 |

### 5.4 Client activity and incidents

| FUNC ID | Module | Function | Route | Roles | Build | Refs |
|---------|--------|----------|-------|-------|-------|------|
| FUNC-330 | Client Activity | Line table CRUD | Client → Activity | Worker+ | Live | HP-061, TEST-061 |
| FUNC-331 | Client Activity | Audit on save | Client → Activity | Worker+ | Live | HP-058 |
| FUNC-332 | Incidents | List + create | `/incidents` | All staff | Live | HP-063 |
| FUNC-333 | Incidents | Detail tabs + workflow | `/incidents/{id}` | Manager+ | Live | HP-064 |
| FUNC-334 | Incidents | NDIS compliance view | `/incidents/compliance` | Quality+ | Live | HP-064 |
| FUNC-335 | Incidents | Dashboard | `/incidents/dashboard` | Manager+ | Live | — |
| FUNC-336 | Incidents | Manager override | Access: `incident-manager-override` | Senior mgr | Live | HP-065 |

### 5.5 Claims and NDIS billing

| FUNC ID | Module | Function | Route | Roles | Build | Refs |
|---------|--------|----------|-------|-------|-------|------|
| FUNC-380 | Claims | List + detail | `/claims` | Billing+ | Live | HP-070 |
| FUNC-381 | Generate claims | Preview | `/generate-claims` | Billing+ | Live | HP-066, TEST-066 |
| FUNC-382 | Generate claims | Generate + lock TS | `/generate-claims` | Billing+ | Live | HP-067, TEST-067 |
| FUNC-383 | Generate claims | Cancellation panel | `/generate-claims` | Billing+ | Live | HP-068, TEST-068 |
| FUNC-384 | Claims | PAPL validation / hard blocks | Generate + detail | Billing+ | Live | HP-069 |
| FUNC-385 | Claims | Gateway dry-run stub | Claim workflow | Billing+ | Live | HP-069 |
| FUNC-386 | Claims | Remittance import + match | Remittance UI | Finance+ | Live | HP-071 |
| FUNC-387 | Plan budget | Claimed rollup on client | Plan budget tab | Coordinator+ | Live | HP-041, HP-079 |

### 5.6 Invoices and reconciliation

| FUNC ID | Module | Function | Route | Roles | Build | Refs |
|---------|--------|----------|-------|-------|-------|------|
| FUNC-400 | Invoices | List + detail | `/invoices` | Billing+ | Live | HP-073 |
| FUNC-401 | Generate invoices | Preview (plan-managed) | `/generate-invoices` | Billing+ | Live | HP-072, TEST-072 |
| FUNC-402 | Generate invoices | Generate | `/generate-invoices` | Billing+ | Live | HP-073, TEST-073 |
| FUNC-403 | Invoices | Plan manager BP on invoice | Invoice detail | Billing+ | Live | HP-072 |
| FUNC-404 | Invoices | Email / delivery scaffold | Invoice detail | Billing+ | Partial | HP-074 |
| FUNC-420 | Reconciliation | Plan | `/plan-reconciliation` | Finance+ | Live | HP-075 |
| FUNC-421 | Reconciliation | Claim | `/claim-reconciliation` | Finance+ | Live | HP-076 |
| FUNC-422 | Reconciliation | Invoice | `/invoice-reconciliation` | Finance+ | Live | HP-077 |
| FUNC-423 | Financial close | Close checklist UI | `/financial-close` | Finance+ | Partial | HP-078 |
| FUNC-424 | Reporting | NDIS audit pack | `/ndis-audit-pack` | Quality+ | Partial | HP-080 |
| FUNC-425 | Reporting | Board reporting | `/board-reporting` | Exec+ | Partial | HP-081 |

### 5.7 Cross-cutting (delivery)

| FUNC ID | Module | Function | Route | Roles | Build | Refs |
|---------|--------|----------|-------|-------|-------|------|
| FUNC-430 | Access | Window grants for delivery sidebar | Access admin | SuperUser | Live | HP-059 |
| FUNC-431 | Audit | Record footer + full trail | All record pages | All | Live | HP-058, HP-082 |
| FUNC-432 | Client prefs | Billing + comms + BP link | Client Billing tab | Coordinator+ | Live | HP-042 |
| FUNC-433 | Business partners | Plan manager registry | `/business-partners` | Admin+ | Live | HP-042 |
| FUNC-434 | Page guides | Help drawer on route | Any delivery route | All | Live | — |

---

## 6–7. Data and roles (flows 4–5 stub)

| DATA ID | Record | Use in flows 4–5 |
|---------|--------|------------------|
| DATA-010 | Client `bp-bern` | Primary participant |
| DATA-011 | Bern service agreement + lines | HP-043–045 |
| DATA-012 | Bern service booking | HP-046–047 |
| DATA-013 | Bulk support workers (seed) | HP-051, HP-053 |
| DATA-014 | Bern primary location | HP-047 |
| DATA-015 | Plan manager BP `bp-myplan-manager` | HP-042, HP-072 |
| DATA-016 | Approved timesheet (post Flow 4) | HP-066+ |
| DATA-017 | Sample claim + invoice (optional seed) | HP-070, HP-073 |

| ROLE ID | Persona | Delivery windows (minimum) |
|---------|---------|----------------------------|
| ROLE-010 | SuperUser | All FUNC-200–425 |
| ROLE-011 | Coordinator | SA, bookings, client tabs, plan budget |
| ROLE-012 | Roster admin | Rostering, planning |
| ROLE-013 | Support worker | My shifts, my timesheets, client activity |
| ROLE-014 | Billing clerk | Claims, invoices, generate-* |
| ROLE-015 | Finance | Reconciliation, financial close |

*Full ROLE matrix for all 108 routes — planned in section 7.*

---

## 9. Missing functions and gaps review

Cross-check of **scope spine**, **process docs**, **access catalog**, and **BUILD-PROGRESS** against flows 4–5 and adjacent modules (2026-06-22).

### 9.1 In scope but partial or thin

| Area | Gap | Build | Suggested WP / action |
|------|-----|-------|---------------------|
| Rostering | Publish/notify workers | **Live** | Tasks created on Publish week (`roster-publish-notifications.ts`) |
| Rostering | Qualification/conflict rules on publish | **Live** | Missing/expired credentials block publish; conflicts enforced |
| My shifts | Check-in/out vs timesheet parity | **Live** | `shift-timesheet-bridge.ts` — link + verification message on My shifts |
| Generate invoices | Plan manager PDF handoff | **Live** | Issue invoice + Plan manager delivery panel (registry + print/PDF steps) |
| Financial close | Full month-close process | **Live** | Process 13 doc + checklist UI alignment |
| NDIS audit pack | Complaints section | **Live** | `complaints-feedback` audit section + CSV export |
| Board reporting | Complaints section depth | **Live** | `board-report-evaluators` uses live register data |

### 9.2 Planned in scope doc / processes — not in catalog or no route

| Capability | Scope / process reference | Status |
|------------|---------------------------|--------|
| Complaints and feedback (register) | User requirements / ERP parity | **Live** — `/complaints` hub + Activity types + incident category Complaint |
| Employee exit / offboarding | HR processes | **Live** — Exit checklist on Employees → Employment tab |
| SCHADS payroll calculation in-app | Out of AbilityAPP scope | **N/A** |
| Live PRODA submission | Integration | **Planned** — stub only |
| Financial month close (full workflow) | `processes/financial-month-close` | **Planned** — partial UI at `/financial-close` |
| Progress notes (clinical) separate from Activity | Some orgs expect distinct module | **Partial** — use Client → Activity; no separate `/progress-notes` |
| Service agreement e-sign / participant portal | Future channels | **Planned** |

### 9.3 Catalog routes with no HP/FUNC row yet (other flows)

These exist in `catalog.ts` but are **outside flows 4–5**; add when writing sections 1–3 and flows 1–3, 6–11:

- **Core:** Enquiries, full client onboarding chain, locations, products, contracts, price lists
- **People:** Employees (full HR), business partners (onboarding only touched via HP-042)
- **Workforce:** Workforce planning, org structure
- **My workplace:** Leave, credentials, contracts, availability
- **Admin:** Organization, access, integrations, reports-advance
- **Governance flow (11):** Policies, quality, document control if present

### 9.4 Recommended next matrix slices

| Priority | Section | Content |
|----------|---------|---------|
| 1 | §1–3 + flows 1–3 | Enquiry → client → SA setup |
| 2 | Flow 6 | Employee hire → roster eligibility |
| 3 | §7 full ROLE matrix | All windows × default roles from seed-access |
| 4 | Flows 7–11 | Governance, reporting, admin |
| 5 | Complaints decision | Dedicated module vs incident subtype — product call |

### 9.5 Verification commands (this doc)

| Command | Expected |
|---------|----------|
| `npm run build` | exit 0 |
| `npm run page-guides:check` | exit 0 (108 routes) |
| Manual TEST-060 + TEST-085 | Pass on localhost SuperUser |

---

*Document owner: Engineering. Update HP/FUNC tables when slices ship; log defects in [ISSUE-LOG-TEMPLATE.md](./ISSUE-LOG-TEMPLATE.md).*
