# AbilityAPP — scope roadmap & implementation plan

**Authority:** Complete Operational Workflow & Requirements Scope (19 June 2026).  
**Index:** [scope/README.md](./scope/README.md) | **Build rules:** [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md)

This document is the living backlog. Update chunk status when work ships.

---

## Executive summary

AbilityAPP is building the full NDIS provider operational spine:

**Enquiry → Client → Service Agreement → Service Booking → Service Planning → Master Roster → Current Roster → Service Complete → Timesheet → Billing → Payroll (via integration) → Reconciliation**

The largest greenfield work is **Chunk 4 (Rostering)**. Upstream modules must be compliance-ready first so roster shifts, timesheets, and claims have solid data.

**Recommended build order (minimal user input):**

1. Finish **Chunk 1** gaps (client lifecycle, plan budgets, consent)
2. Deepen **Chunk 3** (service booking compliance engine)
3. **Chunk 2** (service agreements + e-sign)
4. **Chunk 5** (service planning / utilisation) in parallel with early roster design
5. **Chunk 4** (master + current roster) — phased slices
6. **Chunk 7** → **Chunk 6** → **Chunk 8** (downstream of verified shifts)
7. **Chunk 0** portal/CRM enhancements can run in parallel once client/agreement foundations exist

---

## Current platform baseline (as of June 2026)

| Area | Status | Notes |
|------|--------|-------|
| Auth, org, roles | ✅ Live | Off / Read / Write per window |
| Enquiries | 🟡 Partial | Records + tabs; pipeline stages basic; Process 01 live |
| Clients | 🟡 Partial | Rich tabs; plan import/budget tracking incomplete |
| Employees | 🟡 Partial | Credentials, leave, My workplace |
| Locations, incidents, tasks | ✅ Live | Core CRUD + line tables |
| Service agreements | 🟡 Partial | Records exist; e-sign / PAPL lifecycle not complete |
| Products, price lists, contracts | 🟡 Partial | Reference + linking |
| Service bookings | 🟡 Partial | DB + UI; compliance engine not complete |
| Workforce planning | 🟡 Placeholder | Review queue exists |
| Rostering | ⬜ Placeholder | `/rostering` module placeholder |
| Timesheets | ⬜ Placeholder | `/timesheets`, `/generate-timesheets` placeholders |
| Billing / claims | ⬜ Not started | Requires PRODA/gateway path |
| Payroll integration | ⬜ Not started | Export-only architecture per scope |
| Reconciliation | ⬜ Not started | Reports foundation only |
| Client portal | ⬜ Not started | Chunk 0 differentiator |
| AI home + chat | ✅ Live | Write-gated per window |

Legend: ✅ Live · 🟡 Partial · ⬜ Not started · 🔵 In progress

---

## Development chunks (mapped to scope doc)

### Chunk 0 — Enquiry & CRM + client portal

**Scope stages:** 0 (Enquiry & CRM), participant self-service portal

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Enquiry record + basic pipeline | 🟡 | Yes |
| NDIS qualification scoring | ⬜ | Yes (rules engine) |
| Custom enquiry forms / web-to-lead | ⬜ | Yes |
| HubSpot / Zoho sync | ⬜ | Yes (needs OAuth credentials) |
| One-click Enquiry → Client | 🟡 | Process 01 exists; enrich auto-populate |
| Client portal (services, budget, request service) | ⬜ | Yes (needs auth model decision) |
| Cross-sell intelligence (utilisation alerts) | ⬜ | Depends on Chunk 5 |

**User input needed (once):** Portal auth (magic link vs NDIS login), HubSpot vs built-in CRM priority, branding.

**Suggested slices:**
1. Enquiry pipeline stages + loss reasons + follow-up dates
2. Qualification fields + auto-score rules
3. Portal MVP (read-only services + budget)
4. Service request workflow → agreement variation stub
5. External CRM sync (optional branch)

---

### Chunk 1 — Client & plan management

**Scope stage:** 1 (Client onboarding)

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Participant CRUD (identity, clinical, risk) | 🟡 | Extend existing tabs |
| NDIS plan structure (Core / CB / Capital) | ⬜ | Yes |
| Category-level budget tracking | ⬜ | Yes |
| Plan import (manual → PDF/OCR → API) | ⬜ | Manual first; API later |
| Consent management | ⬜ | Yes |
| Lifecycle states (Intake → Active → Exit) | ⬜ | Yes |
| PRODA / LanternPay / quickclaim plan pull | ⬜ | Needs gateway credentials |

**User input needed:** Sample plan PDFs for OCR testing; gateway partner choice (LanternPay vs quickclaim vs direct PRODA).

**Suggested slices (do these next — low dependency):**
1. `client_lifecycle_status` enum + UI badges + list filters
2. Plan budget line table (category, allocated, claimed, remaining)
3. Consent tab (service, information, photo) with audit
4. Plan manual entry wizard
5. Utilisation read-only dashboard on client record
6. Gateway integration (when credentials available)

---

### Chunk 2 — Service agreements

**Scope stage:** 2

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Agreement templates | ⬜ | Yes (needs template content) |
| 10 mandatory PAPL clauses | ⬜ | Yes |
| Signing authority matrix (6 types) | ⬜ | Yes |
| E-signature (in-app vs DocuSign) | ⬜ | Yes in-app; DocuSign needs API keys |
| 7-state lifecycle | 🟡 | Extend current status field |
| Variation workflow | ⬜ | Yes |

**User input needed:** Legal-approved agreement templates; e-sign vendor preference.

**Suggested slices:**
1. Template engine + schedule of supports from products/price list
2. Lifecycle states + expiry alerts
3. In-app e-sign (capture + audit trail)
4. Variation as linked draft version
5. DocuSign integration (optional)

---

### Chunk 3 — Service bookings

**Scope stage:** 3

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Booking CRUD | 🟡 | Exists |
| Real-time compliance checks | ⬜ | Yes |
| Cancellation rules (2bd / 7bd) | ⬜ | Yes |
| MMM travel caps | ⬜ | Yes (needs org MMM config) |
| NDIS API booking sync | ⬜ | Gateway |
| GPS check-in/out | ⬜ | Mobile slice (Chunk 4/7) |
| 7-state booking lifecycle | 🟡 | Extend |

**Suggested slices (before rostering):**
1. Compliance engine module (screening, budget, plan dates, ratio, price cap)
2. Cancellation rule engine + audit
3. Booking lifecycle alignment with scope
4. Link booking ↔ agreement line ↔ client budget
5. Gateway create/edit booking (when creds ready)

---

### Chunk 4 — Rostering (largest build)

**Scope stages:** 5 (Master roster), 6 (Current roster), parts of 7 (mobile)

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Master roster (4–12 week view) | ⬜ | Yes |
| Current roster calendar | ⬜ | Yes |
| Drag-and-drop day/week views | ⬜ | Yes |
| Recurring + ad-hoc shifts | ⬜ | Yes |
| Staff–client matching rules | ⬜ | Yes |
| Conflict detection (hard blocks) | 🟡 | Yes |
| Open shift marketplace | ⬜ | Yes |
| Mobile worker app | ⬜ | Phase 2 (PWA or native) |
| RoC import | ⬜ | Yes |

**Prerequisites:** Chunks 1–3 stable (client, agreement, booking data model).

**Suggested phased approach:**

| Phase | Focus | Outcome |
|-------|--------|---------|
| 4a | Data model + read-only calendar | Shifts from bookings visible |
| 4b | Create/edit shifts + recurring | Coordinator can roster |
| 4c | Conflict engine + matching | Compliance blocks |
| 4d | Master roster + gap analysis | Forward planning |
| 4e | Worker mobile MVP | Check-in, notes, sign-off |
| 4f | Marketplace + notifications | Fill vacant shifts |

**User input needed:** RoC template sample; mobile PWA vs native; notification provider (Twilio).

---

### Chunk 5 — Service planning & utilisation

**Scope stage:** 4

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Monthly service plan from budget | ⬜ | Yes |
| Burn rate + forecast alerts | ⬜ | Yes |
| SCHADS cost **prediction** (not payroll) | ⬜ | Yes |
| Multi-provider budget view | ⬜ | Later |

**Can start after Chunk 1 budgets exist.** Feeds Chunk 0 cross-sell alerts.

---

### Chunk 6 — Workforce, timesheets, HR compliance, payroll export

**Scope stages:** 8 (Timesheet), 10 (Employee payment via integration), HR compliance section

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Timesheet auto-generation from shifts | ⬜ | After Chunk 4/7 |
| Approval workflow | ⬜ | Yes |
| Keypay / Xero / EH API export | ⬜ | Needs OAuth |
| SCHADS award interpretation | ❌ Out of scope | Payroll system only |
| HR compliance alerts (screening, fatigue) | 🟡 | Partial via credentials/leave |
| Hard enforcement blocks on roster | 🟡 | With Chunk 4 |

**User input needed:** Primary payroll vendor (Keypay recommended in scope).

---

### Chunk 7 — Billing & claiming

**Scope stage:** 9

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Claim generation from verified shifts | ⬜ | After Chunk 4/7 |
| PAPL validation engine | ⬜ | Yes |
| Bulk PRODA claims | ⬜ | PRODA approval |
| Remittance import + match | ⬜ | Yes |
| Invoicing (plan/self-managed) | ⬜ | Yes |

**User input needed:** PRODA Digital Partnership or gateway contract.

---

### Chunk 8 — Reconciliation & reporting

**Scope stage:** 11

| Deliverable | Status | Agent-buildable? |
|-------------|--------|------------------|
| Plan vs actual reconciliation | ⬜ | After 5 + 7 |
| Claim reconciliation dashboard | ⬜ | After 7 |
| Financial close reports | ⬜ | Partial via Xero later |
| NDIS audit pack export | ⬜ | Yes |

---

## Integration dependency map

```
                    ┌─────────────────┐
                    │  Chunk 0 Portal │
                    └────────┬────────┘
                             │
Chunk 1 Client ──► Chunk 2 Agreement ──► Chunk 3 Booking
                             │                    │
                             ▼                    ▼
                      Chunk 5 Planning ◄── Chunk 4 Roster
                             │                    │
                             ▼                    ▼
                      Chunk 7 Billing ◄── Chunk 6 Timesheet
                             │
                             ▼
                      Chunk 8 Reconcile
```

**External integrations (lead times):**

| Integration | Blocks | Typical lead time |
|-------------|--------|-------------------|
| PRODA / NDIS API | Plan import, bookings, claims | Months (Digital Partnership) |
| LanternPay / quickclaim | Faster NDIS API path | Weeks (commercial) |
| Keypay / Xero / EH | Payroll export | Days (OAuth setup) |
| Twilio / SendGrid | Notifications | Days |
| Google Maps | Travel validation | Days |

---

## What we need from you (minimal touchpoints)

| # | Decision / asset | When | Default if no answer |
|---|------------------|------|----------------------|
| 1 | Confirm roadmap order above | Now | Proceed as documented |
| 2 | Sample NDIS plan PDF (de-identified) | Chunk 1 slice 4 | Manual entry only |
| 3 | Service agreement Word/PDF templates | Chunk 2 | Generic PAPL scaffold |
| 4 | E-sign: in-app vs DocuSign | Chunk 2 | In-app capture first |
| 5 | NDIS gateway: LanternPay vs quickclaim vs wait for PRODA | Chunk 1/3/7 | Build manual + stub adapters |
| 6 | Payroll primary: Keypay vs Xero | Chunk 6 | Keypay per scope doc |
| 7 | Client portal auth model | Chunk 0 portal | Email magic link |
| 8 | RoC CSV/template sample | Chunk 4d | Generate from agreements |

Everything else can proceed with sensible defaults and feature flags.

---

## Next 3 agent-led work packages (recommended)

### WP-A: Client foundation (Chunk 1) — ~2–4 weeks agent time

1. Lifecycle status field + migration + UI
2. Plan budget line table (child table + tab)
3. Consent records tab
4. Client utilisation summary panel (read-only, manual budget)
5. Help articles + processes + audit

**Exit criteria:** Client record shows lifecycle, budgets, consents; saves audit; persists after refresh.

### WP-B: Service booking compliance (Chunk 3) — ~2–3 weeks

1. `booking-compliance.ts` rule engine
2. UI warnings vs hard blocks on save
3. Cancellation policy fields + engine
4. Link validation to client budget lines
5. Extend service booking help + audit diffs

**Exit criteria:** Cannot save non-compliant booking when rules configured; audit trail captures overrides.

### WP-C: Service agreement lifecycle (Chunk 2) — ~2–3 weeks

1. Template + schedule of supports generation
2. Status lifecycle (Draft → … → Active)
3. In-app sign capture
4. Expiry notification task automation hook

**Exit criteria:** Agreement can be drafted, sent, signed, activated with full audit.

After WP-A/B/C, begin **Chunk 4a** (roster data model + read-only calendar).

---

## Verification (see BUILD-PROGRESS for detail)

| Tier | When | What |
|------|------|------|
| 1 Automated | Every slice | `npm run build`, `page-guides:check`, migration push |
| 2 Browser | UI slices | Smoke test steps in [BUILD-PROGRESS.md](./BUILD-PROGRESS.md) |
| 3 Bugbot | Before every push to `main` | Code review logged in BUILD-PROGRESS |
| 4 You (Adam) | After each push | Same **What you can test** steps on live Amplify app |

---

## How agents should use this doc

1. Read [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md) and [dev-core/AGENT-PLAYBOOK.md](../dev-core/AGENT-PLAYBOOK.md)
2. Pick the **lowest-numbered chunk** with incomplete slices that are not blocked
3. Implement one **slice** at a time; update this file's status table
4. Do not skip audit, access catalog, or help requirements
5. Flag new user decisions in the "What we need from you" table rather than blocking silently

---

## Changelog

| Date | Change |
|------|--------|
| 2026-06-18 | Initial roadmap from scope doc review; baseline inventory |
