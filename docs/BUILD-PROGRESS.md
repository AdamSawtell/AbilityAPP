# AbilityAPP — build progress log

**Always read this before starting work.** Update after every shipped slice.  
**Roadmap:** [SCOPE-ROADMAP.md](./SCOPE-ROADMAP.md) · **Standards:** [BUILD-EXPECTATIONS.md](./BUILD-EXPECTATIONS.md)

---

## Overall program progress

| Metric | Value |
|--------|-------|
| **Overall completion** | **24%** |
| **Current work package** | WP-B — Service booking compliance (Chunk 3) |
| **Active slice** | WP-B.1 — Compliance rule engine ✅ shipped |
| **Next slice** | WP-B.2 — Cancellation policy engine |
| **Last verified** | 2026-06-18 — build + page-guides only (see gaps below) |
| **Last push** | 2026-06-18 — `9873432` |

---

## Verification pipeline (every slice)

| Tier | Who | When | Required? |
|------|-----|------|-----------|
| **1 — Automated** | Agent | Every slice before push | ✅ Yes — `npm run build`, `npm run page-guides:check`; `supabase:push-remote` if migration |
| **2 — Browser smoke** | Agent | Any slice that changes UI | ✅ Yes — follow **What you can test** for that slice |
| **3 — Bugbot review** | Agent | Before every `git push` to `main` | ✅ Yes — fix Critical/High before push |
| **4 — Your spot-check** | Adam | After push (Amplify live) | Recommended — same steps as Tier 2 |

### Honest status (WP-A / WP-B.1)

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
| 2 | Service agreements | 10% | 5% | 🟡 Partial | Templates (default scaffold OK) |
| 3 | Service bookings compliance | 12% | **25%** | 🔵 In progress | None |
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

### WP-B.2 — Cancellation policy (not shipped yet)

| Step | Action | Pass if |
|------|--------|---------|
| — | *Steps added when slice ships* | — |

### WP-C — Service agreements (not started)

| Step | Action | Pass if |
|------|--------|---------|
| — | *Steps added when slice ships* | — |

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

## WP-B — Service booking compliance (Chunk 3)

| Slice | Deliverable | Status |
|-------|-------------|--------|
| B.1 | Compliance rule engine + UI panel + save blocks | ✅ Done |
| B.2 | Cancellation policy engine | ⬜ Next |
| B.3 | Extended compliance rules | ⬜ |
| B.4 | Budget line validation link | ✅ Done (in B.1) |

**WP-B completion:** 35%

---

## WP-C — Service agreements (Chunk 2)

| Slice | Deliverable | Status |
|-------|-------------|--------|
| C.1 | Template + schedule of supports | ⬜ |
| C.2 | Lifecycle states Draft → Active | ⬜ |
| C.3 | In-app e-sign capture | ⬜ |
| C.4 | Expiry notification hook | ⬜ |

**WP-C completion:** 0%

---

## Shipped log

| Date | Commit | What shipped |
|------|--------|--------------|
| 2026-06-18 | 9873432 | BUILD-PROGRESS update |
| 2026-06-18 | 777b20e | WP-A complete + WP-B.1 booking compliance |
| 2026-06-18 | 0ad2f6c | WP-A.2: plan budget lines |
| 2026-06-18 | bd60219 | WP-A.1: lifecycle + governance |

---

## Verification log (Tier 1 — automated)

| Date | Command | Result |
|------|---------|--------|
| 2026-06-18 | `npm run build` | exit 0 |
| 2026-06-18 | `npm run page-guides:check` | exit 0 |
| 2026-06-18 | `npm run supabase:push-remote` | `20260624120000`, `20260624140000`, `20260624160000` |

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
| — | through `9873432` | — | **Not run** | Backlog — run before next push |
| — | *Next push* | — | Pending | Required per BUILD-EXPECTATIONS §11 |

---

## How to update this file

1. After each slice: update chunk %, WP slice status, overall %, shipped log.
2. Add **What you can test** rows for the new slice (table format above).
3. Log Tier 1 / 2 / 3 results in the verification tables.
4. Set **Next slice** to the first incomplete item on the critical path.
