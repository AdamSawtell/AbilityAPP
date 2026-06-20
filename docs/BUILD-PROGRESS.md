# AbilityAPP — build progress log

**Always read this before starting work.** Update after every shipped slice.  
**Roadmap:** [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) · **Standards:** [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md)

---

## Overall program progress

| Metric | Value |
|--------|-------|
| **Overall completion** | **30%** |
| **Current work package** | WP-C — Service agreements (Chunk 2) |
| **Active slice** | WP-C.1 — Template + schedule of supports ✅ shipped |
| **Next slice** | WP-C.2 — Lifecycle states Draft → Active |
| **Last push** | 2026-06-18 — `c9e74f7` |

---

## Verification pipeline (every slice)

| Tier | Who | When | Required? |
|------|-----|------|-----------|
| **1 — Automated** | Agent | Every slice before push | ✅ Yes — `npm run build`, `npm run page-guides:check`; `supabase:push-remote` if migration |
| **2 — Browser smoke** | Agent | Any slice that changes UI | ✅ Yes — follow **What you can test** for that slice |
| **3 — Bugbot review** | Agent | Before every `git push` to `main` | ✅ Yes — fix Critical/High before push |
| **4 — Your spot-check** | Adam | After push (Amplify live) | Recommended — same steps as Tier 2 |

### Documentation pipeline (every slice)

| Deliverable | Who | When | Required? |
|-------------|-----|------|-----------|
| **User how-to** | Agent | Same slice as the feature | ✅ Yes — article section with steps in `web/src/lib/help/articles/` |
| **System setup** | Agent | Same slice as the feature | ✅ Yes — checklist in `module-setup-guides.ts`; reference data + role grants named |
| **Progress log** | Agent | Before push | ✅ Yes — row in **User guides & system setup** below + **Guide delivery log** |

See [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md) §8 for file paths and checklist format.

---

Slices through **WP-B.1** were verified with **Tier 1 only** (build + migrations). **Tier 2 browser** and **Tier 3 Bugbot** were not run on those pushes — backlog below. **All future slices use all tiers.**

---

## Dependency spine (do not skip)

```
Chunk 1 Client ──► Chunk 3 Booking ──► Chunk 4 Roster ──► Chunk 7 Billing
       │                  │                    │                  │
       └──── Chunk 2 Agreement ──────────────┴──► Chunk 6 Timesheet
       │
       └──► Chunk 5 Planning ──► Chunk 8 Reconcile
Chunk 0 Portal/CRM (parallel after Chunk 1 basics)
```

---

## Chunk progress

| Chunk | Name | Weight | Done | Status | Blockers |
|-------|------|--------|------|--------|----------|
| 0 | Enquiry & CRM + portal | 10% | 2% | 🟡 Partial | Portal auth (default: magic link) |
| 1 | Client & plan management | 12% | **55%** | 🟡 Partial | WP-A complete |
| 2 | Service agreements | 10% | **25%** | 🔵 In progress | None |
| 3 | Service bookings compliance | 12% | **100%** | ✅ Complete | None |
| 4 | Rostering | 22% | 0% | ⬜ Placeholder | Requires Chunk 1–3 |
| 5 | Service planning | 8% | 0% | ⬜ Not started | Chunk 1 budgets ✅ |
| 6 | Timesheets & payroll export | 10% | 2% | ⬜ Placeholder | Chunk 4 shifts |
| 7 | Billing & claiming | 10% | 0% | ⬜ Not started | PRODA/gateway |
| 8 | Reconciliation | 6% | 3% | ⬜ Not started | Chunks 5 + 7 |

**Platform cross-cutting** (auth, roles, audit, AI, reports): ~85%

---

## What you can test (manual checklist)

Use the **live Amplify app** after each push (or `cd web && npm run dev` locally). Login as a user with full client/booking access (e.g. SuperUser role).

### Governance docs (6032a7f)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Open repo on GitHub → `docs/BUILD-PROGRESS.md` | File visible on `main` |

### WP-A.1 — Client lifecycle (`6032a7f` / `bd60219`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Clients** → open **Bernadette Rose** | Record opens |
| 2 | **Full profile** → set **Lifecycle** to *Plan review*, save | Saves without error |
| 3 | Refresh page | Lifecycle still *Plan review* |
| 4 | **Clients** list → filter **All lifecycles** → *Active* | Bern appears or not per filter |
| 5 | Footer → **Full audit trail** → open last save | Shows lifecycle field change |
| 6 | Scroll to audit footer on page | Created/updated visible |

### WP-A.2 — Plan budget (`0ad2f6c`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → tab **Plan budget** | Tab visible (check Roles if missing) |
| 2 | Review summary cards | ~$69k allocated, ~$18.8k claimed, remainder shown |
| 3 | Edit **Claimed ($)** on a line, save | Persists after refresh |
| 4 | **Full audit trail** | Save event logged |

### WP-A.3 — Core consents (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → **Consents and Legal Orders** | Three core consent tiles: Service *Granted*, Information *Granted*, Photo *Refused* |
| 2 | Add row: type *Service delivery*, status *Pending*, save | Row persists |
| 3 | Profile header / overview | Consent alert list mentions photo refusal |
| 4 | **Overview** tab | **Core consents** panel visible |

### WP-A.4 — Plan budget wizard (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Plan budget** tab → click **Core supports starter** | Two new empty lines appended |
| 2 | Click **Full plan scaffold** | Core + Capacity building + Capital lines added |
| 3 | Save, refresh | Lines still present |

### WP-A.5 — Overview utilisation (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Client **Bern** → **Overview** | **Plan utilisation** section with totals |
| 2 | Click **Open Plan budget** | Navigates to Plan budget tab |

### WP-B.1 — Booking compliance (`777b20e`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Service bookings** → open booking **50145** (Bern) | Compliance panel shows pass or warnings |
| 2 | Change **End date** before **Start date**, save | Save **blocked**; error shown |
| 3 | Set dates valid, save | Saves successfully |
| 4 | (Optional) Increase **Grand total** above client remaining budget | Budget exceeded error; save blocked |

### WP-B.2 — Cancellation policy

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Service bookings** → open booking **50145** | Overview loads |
| 2 | Set **Document status** to *Cancelled* | **Cancellation details** section appears; date defaults to today |
| 3 | Leave **Initiated by** empty, save | Save **blocked** — initiator required |
| 4 | Set **Initiated by** *Participant*, **Reason** *Participant request*, save | Saves successfully |
| 5 | Set **Cancellation date** within 7 days of **Start date** | **Cancellation policy** panel shows short notice + estimated claimable amount |
| 6 | Set cancellation date **after** booking **End date** | Save blocked; error shown |
| 7 | Refresh page | Cancellation fields persist; audit trail logs changes |

### WP-B.3 — Extended compliance (`pending`)

| Step | Action | Pass if |
|------|--------|---------|
| 1 | Booking **50145** — clear service agreement, save | Warning: link agreement |
| 2 | Set agreement to *Draft* (if test copy), save | Error: agreement not Active |
| 3 | Remove product from a line, save | Error: product required |
| 4 | Restore product + Active agreement | Compliance passes |

### WP-C.1 — Schedule of supports templates

| Step | Action | Pass if |
|------|--------|---------|
| 1 | **Service agreements** → open **ROSE_Rose Ni** | Agreement opens |
| 2 | Click **SIL + community starter** | Two lines appended |
| 3 | Enter planned prices, save | Total planned updates; persists after refresh |
| 4 | Set status *Draft*, save | Status saved; audit trail logs change |

### WP-C.2 — Agreement lifecycle (not shipped)

---

## User guides & system setup (per slice)

Each row is what end users and system administrators need. In-app: workspace footer **How to use this page** → Help article; System → **Setup guides** or `/system/setup/<module>`.

### WP-A.1 — Client lifecycle

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → section **Client lifecycle** (`clients-locations.ts` § `client-lifecycle`) |
| **User steps** | 1. Open client → **Full profile**. 2. Set **Lifecycle**, **Plan review due** (when plan review), **Exit reason** (when exit). 3. Save. 4. Filter **Clients** list by lifecycle badge. |
| **System setup** | `/system/setup/clients` → guide **Clients setup** |
| **Reference data** | `/system/reference-data/clients` → **Client lifecycle status**, **Lifecycle exit reason** |
| **Role access** | Admin → Roles → **Clients** module + **Full profile** tab (`client-full-profile`) at Write |
| **Admin verify** | Edit lifecycle on a test client; confirm badge on list and audit trail entry |

### WP-A.2 — Plan budget line table

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → section **Plan budget** (`client-plan-budget`) |
| **User steps** | 1. Open client → **Plan budget** tab. 2. Review summary cards. 3. Add/edit lines (support budget, category, allocated, claimed). 4. Save; refresh to confirm persistence. |
| **System setup** | `/system/setup/clients` — checklist items for NDIS lists and **Plan budget** role grant |
| **Reference data** | **NDIS support budget**, **NDIS support category** |
| **Role access** | **Plan budget** tab window `client-plan-budget` at Read or Write |
| **Admin verify** | Role without Plan budget cannot see tab; role with Write can edit and save lines |

### WP-A.3 — Core consents

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Consents and Legal Orders** + **Core consents summary** |
| **User steps** | 1. Open **Consents and Legal Orders**. 2. Review three core tiles (Service, Information, Photo). 3. Add lines with type, status, dates. 4. Check **Overview** consent alert list and **Core consents** panel. |
| **System setup** | `/system/setup/clients` — **Consent status** list |
| **Reference data** | **Consent status**; consent type list if customised |
| **Role access** | **Consents and Legal Orders** tab (`client-consents-and-legal-orders`) |
| **Admin verify** | Refused photo consent appears on Overview alerts |

### WP-A.4 — Plan budget wizard

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Plan budget** (wizard buttons described in steps) |
| **User steps** | 1. **Plan budget** tab → **Core supports starter** or **Full plan scaffold**. 2. Enter allocated amounts from NDIS plan. 3. Save. |
| **System setup** | Same as WP-A.2 (no extra reference data) |
| **Reference data** | — |
| **Role access** | `client-plan-budget` Write |
| **Admin verify** | Scaffold adds expected row count; lines persist after refresh |

### WP-A.5 — Overview utilisation

| | Detail |
|---|--------|
| **User how-to** | Help → **Clients** → **Plan utilisation on Overview** |
| **User steps** | 1. Open **Overview**. 2. Review **Plan utilisation** totals. 3. Click **Open Plan budget** to edit lines. |
| **System setup** | Same as WP-A.2 |
| **Reference data** | — |
| **Role access** | **Overview** + **Plan budget** as needed |
| **Admin verify** | Totals match Plan budget tab after line edit |

### WP-B.1 — Booking compliance

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → section **Booking compliance checks** (`delivery.ts` § `booking-compliance`) |
| **User steps** | 1. Open **Service bookings** → select booking. 2. Read compliance panel (pass / warning / error). 3. Fix errors (dates, budget, client). 4. Save when no blocking errors. |
| **System setup** | `/system/setup/services` → guide **Services setup** |
| **Reference data** | Products/UoM under `/system/reference-data/services` (existing) |
| **Role access** | **Service bookings** window Write; clients need **Plan budget** for budget checks |
| **Admin verify** | Invalid dates block save; budget exceeded blocks save when client has plan lines |

### WP-B.2 — Cancellation policy

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Cancellation policy** (`delivery.ts` § `booking-cancellation`) |
| **User steps** | 1. Set status *Cancelled*. 2. Complete date, initiator, reason. 3. Review policy panel (notice days, claimable estimate). 4. Save when compliance passes. |
| **System setup** | `/system/setup/services` → **Services setup** |
| **Reference data** | `/system/reference-data/services` → **Booking cancellation reason**, **Cancellation initiated by** |
| **Role access** | **Service bookings** Write |
| **Admin verify** | Cancel test booking with short notice; panel shows claimable estimate; fields persist after refresh |

### WP-B.3 — Extended compliance rules

| | Detail |
|---|--------|
| **User how-to** | Help → **Delivery** → **Extended compliance rules** |
| **User steps** | 1. Link Active service agreement. 2. Confirm service delivery consent on client. 3. Add lines with products and dates in range. 4. Fix errors before save. |
| **System setup** | Active agreements + client consents before bookings go live |
| **Reference data** | Service agreement status |
| **Role access** | Service bookings Write |
| **Admin verify** | Inactive agreement or refused consent blocks save |

### WP-C.1 — Schedule of supports templates

| | Detail |
|---|--------|
| **User how-to** | Help → **Services** → **Service agreements** |
| **User steps** | 1. Open agreement. 2. Use schedule template. 3. Enter planned prices. 4. Save. |
| **System setup** | Products, price lists, service agreement status |
| **Role access** | Service agreements Write |
| **Admin verify** | Template adds lines; total recalculates on save |

### WP-C.2 — Agreement lifecycle (not shipped)

---

## WP-A — Client foundation (Chunk 1) ✅ COMPLETE

| Slice | Deliverable | Status | % of WP-A |
|-------|-------------|--------|-----------|
| A.1 | Client lifecycle status | ✅ Done | 20% |
| A.2 | Plan budget line table | ✅ Done | 25% |
| A.3 | Consent tab alignment | ✅ Done | 15% |
| A.4 | Plan manual entry wizard | ✅ Done | 20% |
| A.5 | Utilisation summary on Overview | ✅ Done | 20% |

**WP-A completion:** 100%

---

## WP-B — Service booking compliance (Chunk 3) ✅ COMPLETE

| Slice | Deliverable | Status |
|-------|-------------|--------|
| B.1 | Compliance rule engine + UI panel + save blocks | ✅ Done |
| B.2 | Cancellation policy engine | ✅ Done |
| B.3 | Extended compliance rules | ✅ Done |
| B.4 | Budget line validation link | ✅ Done (in B.1) |

**WP-B completion:** 100%

---

## WP-C — Service agreements (Chunk 2)

| Slice | Deliverable | Status |
|-------|-------------|--------|
| C.1 | Template + schedule of supports | ✅ Done |
| C.2 | Lifecycle states Draft → Active | ⬜ Next |
| C.3 | In-app e-sign capture | ⬜ |
| C.4 | Expiry notification hook | ⬜ |

**WP-C completion:** 25%

---

## Shipped log

| Date | Commit | What shipped |
|------|--------|--------------|
| 2026-06-18 | c9e74f7 | WP-C.1 schedule of supports templates |
| 2026-06-18 | 8e6bc50 | Bugbot fixes: cancellation local date + stale fields |
| 2026-06-18 | 6fce676 | Per-slice user guides and system setup docs |
| 2026-06-18 | 777b20e | WP-A complete + WP-B.1 booking compliance |
| 2026-06-18 | 0ad2f6c | WP-A.2: plan budget lines |
| 2026-06-18 | bd60219 | WP-A.1: lifecycle + governance |

---

## Verification log (Tier 1 — automated)

| Date | Command | Result |
|------|---------|--------|
| 2026-06-18 | `npm run build` | exit 0 |
| 2026-06-18 | `npm run page-guides:check` | exit 0 |
| 2026-06-18 | `npm run supabase:push-remote` | `20260624180000` cancellation fields |
| 2026-06-18 | `npm run build` | exit 0 (WP-B.2) |
| 2026-06-18 | `npm run page-guides:check` | exit 0 (WP-B.2) |

---

## Browser verification log (Tier 2 — agent)

| Date | Slice | Routes tested | Result | Notes |
|------|-------|---------------|--------|-------|
| — | WP-A.1–B.1 | — | **Not run** | Backlog — Adam can run **What you can test** above |
| — | *Next slice* | *TBD* | Pending | Required before next push |

---

## Code review log (Tier 3 — Bugbot)

| Date | Commit range | Findings | Result | Notes |
|------|--------------|----------|--------|-------|
| 2026-06-18 | `e0ccb56`–`a88e1dc` | 1 High + 2 Medium — all fixed | Pass | Multi-line dates, local date, stale fields |
| 2026-06-18 | `a88e1dc` | — | **Pass** | [Bugbot branch review](ec37fa04-ce0e-4c70-be28-88b0bcd95bc5) — no findings |
| — | *Next push* | — | Pending | Required per BUILD-EXPECTATIONS §11 |

---

## Guide delivery log

| Date | Slice | User article | System setup | page-guides:check |
|------|-------|--------------|--------------|-------------------|
| 2026-06-18 | WP-A.1–A.5 | `clients` — lifecycle, plan budget, consents, utilisation | `clients-setup` updated | exit 0 |
| 2026-06-18 | WP-C.1 | `services` — schedule templates | `services-setup` | exit 0 |
| 2026-06-18 | WP-B.2 | `delivery` — cancellation policy | `services-setup` updated | exit 0 |

---

## How to update this file

1. After each slice: update chunk %, WP slice status, overall %, shipped log.
2. Add **What you can test** rows for the new slice (table format above).
3. Add **User guides & system setup** row with user steps, reference data, role access, and admin verify.
4. Log Tier 1 / 2 / 3 results in the verification tables; log guides in **Guide delivery log**.
5. Set **Next slice** to the first incomplete item on the critical path.
